"""Starvest API.

Run locally:
    pip install -r requirements.txt
    flask --app app run --host 0.0.0.0 --port 5000
"""

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

from services.data_sources import DataSourceError, get_conditions

load_dotenv()


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
		return jsonify(await get_conditions(lat, lon))

	return app


app = create_app()
