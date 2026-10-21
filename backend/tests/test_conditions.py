from services.cache import TTLCache


def test_conditions_combines_both_sources(client, fake_apis):
	res = client.get("/api/conditions?lat=36.7378&lon=-119.7871")
	assert res.status_code == 200
	body = res.get_json()

	assert body["location"] == {"lat": 36.74, "lon": -119.79}
	assert body["weather"]["current"]["temperature_c"] == 18.2
	assert body["soil"]["root_zone_soil_wetness"] == 0.38  # latest non-fill day
	assert body["soil"]["latest_day"] == "20261017"
	assert body["soil"]["precipitation_total_mm"] == 3.0  # fill values excluded
	assert body["soil"]["solar_radiation_units"] == "MJ/m^2/day"
	assert sorted(fake_apis.calls) == ["api.open-meteo.com", "power.larc.nasa.gov"]


def test_second_request_is_served_from_cache(client, fake_apis):
	client.get("/api/conditions?lat=36.7378&lon=-119.7871")
	fake_apis.calls.clear()

	# Nearby point rounds to the same ~1 km cache cell.
	res = client.get("/api/conditions?lat=36.7401&lon=-119.7899")
	assert res.get_json()["cache"] == {"weather": True, "soil": True}
	assert fake_apis.calls == []


def test_nasa_outage_degrades_instead_of_failing(client, fake_apis):
	fake_apis.nasa_status = 503
	res = client.get("/api/conditions?lat=36.7&lon=-119.8")
	body = res.get_json()
	assert res.status_code == 200
	assert body["soil"] is None
	assert "NASA" in body["warnings"][0]


def test_rejects_bad_coordinates(client):
	assert client.get("/api/conditions?lat=abc&lon=1").status_code == 400
	assert client.get("/api/conditions?lat=95&lon=1").status_code == 400


def test_ttl_cache_expires():
	now = [0.0]
	cache = TTLCache(ttl_seconds=10, clock=lambda: now[0])
	cache.set("k", 1)
	assert cache.get("k") == 1
	now[0] = 10.0
	assert cache.get("k") is None


def test_sources_are_fetched_concurrently(monkeypatch):
	import asyncio
	import json
	import time

	import httpx

	from services import data_sources
	from tests.conftest import nasa_payload, open_meteo_payload

	async def slow_handler(request):
		await asyncio.sleep(0.3)
		payload = open_meteo_payload() if request.url.host == "api.open-meteo.com" else nasa_payload()
		return httpx.Response(200, content=json.dumps(payload))

	transport = httpx.MockTransport(slow_handler)
	monkeypatch.setattr(data_sources, "make_client", lambda **kw: httpx.AsyncClient(transport=transport))
	data_sources.weather_cache.clear()
	data_sources.nasa_cache.clear()

	start = time.perf_counter()
	asyncio.run(data_sources.get_conditions(36.7, -119.8))
	elapsed = time.perf_counter() - start
	assert elapsed < 0.5, f"took {elapsed:.2f}s; the two 0.3s requests ran one after another"
