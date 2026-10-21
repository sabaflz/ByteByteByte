import json
import sys
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services import data_sources  # noqa: E402


def open_meteo_payload(hours: int = 72, temp: float = 14.0, humidity: float = 95.0) -> dict:
	times = [f"2026-10-{20 + h // 24:02d}T{h % 24:02d}:00" for h in range(hours)]
	return {
		"timezone": "America/Los_Angeles",
		"current": {
			"temperature_2m": 18.2,
			"relative_humidity_2m": 61,
			"precipitation": 0.0,
			"wind_speed_10m": 6.4,
			"weather_code": 2,
		},
		"hourly": {
			"time": times,
			"temperature_2m": [temp] * hours,
			"relative_humidity_2m": [humidity] * hours,
			"precipitation_probability": [40] * hours,
			"precipitation": [0.2] * hours,
		},
		"daily": {
			"time": ["2026-10-20", "2026-10-21", "2026-10-22"],
			"temperature_2m_max": [22.0, 21.0, 20.0],
			"temperature_2m_min": [11.0, 12.0, 10.5],
			"precipitation_sum": [1.2, 0.0, 3.4],
		},
	}


def nasa_payload() -> dict:
	days = {"20261015": 0.41, "20261016": 0.40, "20261017": 0.38, "20261018": -999.0}
	return {
		"header": {"fill_value": -999.0},
		"parameters": {"ALLSKY_SFC_SW_DWN": {"units": "MJ/m^2/day"}},
		"properties": {
			"parameter": {
				"GWETROOT": days,
				"GWETTOP": {"20261017": 0.22, "20261018": -999.0},
				"PRECTOTCORR": {"20261016": 2.5, "20261017": 0.5, "20261018": -999.0},
				"T2M": {"20261016": 17.0, "20261017": 19.0},
				"ALLSKY_SFC_SW_DWN": {"20261016": 15.0, "20261017": 17.0},
			}
		},
	}


class FakeApis:
	"""httpx MockTransport standing in for Open-Meteo and NASA POWER."""

	def __init__(self):
		self.calls: list[str] = []
		self.weather = open_meteo_payload()
		self.nasa = nasa_payload()
		self.nasa_status = 200

	def handler(self, request: httpx.Request) -> httpx.Response:
		host = request.url.host
		self.calls.append(host)
		if host == "api.open-meteo.com":
			return httpx.Response(200, content=json.dumps(self.weather))
		if host == "power.larc.nasa.gov":
			return httpx.Response(self.nasa_status, content=json.dumps(self.nasa))
		return httpx.Response(404)


@pytest.fixture
def fake_apis(monkeypatch):
	apis = FakeApis()
	transport = httpx.MockTransport(apis.handler)
	monkeypatch.setattr(data_sources, "make_client", lambda **kw: httpx.AsyncClient(transport=transport))
	data_sources.weather_cache.clear()
	data_sources.nasa_cache.clear()
	return apis


@pytest.fixture
def client(fake_apis):
	from app import create_app

	return create_app().test_client()
