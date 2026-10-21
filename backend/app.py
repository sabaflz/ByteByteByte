"""Starvest API.

Run locally:
    pip install -r requirements.txt
    flask --app app run --host 0.0.0.0 --port 5000
"""

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

from services import pest_risk, recommendations
from services.cache import TTLCache, location_key
from services.data_sources import DataSourceError, get_conditions

load_dotenv()

# AI calls cost money and the inputs change slowly, so reuse an answer for an hour.
recommendation_cache = TTLCache(ttl_seconds=60 * 60)


class BadRequest(ValueError):
	pass


def parse_location(source) -> tuple[float, float]:
	try:
		lat = float(source.get("lat"))
		lon = float(source.get("lon"))
	except (TypeError, ValueError):
		raise BadRequest("lat and lon are required numbers")
	if not (-90 <= lat <= 90 and -180 <= lon <= 180):
		raise BadRequest("lat must be in [-90, 90] and lon in [-180, 180]")
	return lat, lon


def create_app() -> Flask:
	app = Flask(__name__)
	CORS(app)  # the Expo web build runs on a different origin

	@app.errorhandler(BadRequest)
	def bad_request(err):
		return jsonify(error=str(err)), 400

	@app.errorhandler(DataSourceError)
	def upstream_error(err):
		return jsonify(error=str(err)), 502

	@app.get("/api/health")
	def health():
		return jsonify(status="ok")

	@app.get("/api/conditions")
	async def conditions():
		lat, lon = parse_location(request.args)
		data = await get_conditions(lat, lon)
		data["pest_risk"] = pest_risk.assess(data["weather"]["hourly"])
		return jsonify(data)

	@app.post("/api/recommendations")
	async def recommend():
		lat, lon = parse_location(request.get_json(silent=True) or {})
		key = location_key(lat, lon)
		cached = recommendation_cache.get(key)
		if cached is not None:
			return jsonify({**cached, "cached": True})

		data = await get_conditions(lat, lon)
		risks = pest_risk.assess(data["weather"]["hourly"])
		result = await recommendations.recommend(data, risks)
		body = {**result, "pest_risk": risks, "warnings": data["warnings"]}
		if result["source"] == "openai":  # don't pin a fallback answer for an hour
			recommendation_cache.set(key, body)
		return jsonify({**body, "cached": False})

	return app


app = create_app()
