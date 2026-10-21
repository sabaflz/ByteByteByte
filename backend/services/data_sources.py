"""Live data for a location: Open-Meteo forecast + NASA POWER satellite-derived history.

Both APIs are free and keyless. The two requests run concurrently with
asyncio.gather, and each source is cached separately because they change at
very different rates (forecast: minutes, NASA daily data: once a day).
"""

import asyncio
from datetime import date, timedelta
from typing import Any

import httpx

from services.cache import TTLCache, location_key

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

# NASA POWER daily point parameters (community=AG):
#   T2M          air temperature at 2 m
#   PRECTOTCORR  precipitation
#   ALLSKY_SFC_SW_DWN  solar radiation reaching the surface
#   GWETTOP      surface soil wetness (0 = dry, 1 = saturated), top ~5 cm
#   GWETROOT     root zone soil wetness (0-1), top ~100 cm
NASA_PARAMETERS = ["T2M", "PRECTOTCORR", "ALLSKY_SFC_SW_DWN", "GWETTOP", "GWETROOT"]
NASA_LOOKBACK_DAYS = 30

weather_cache = TTLCache(ttl_seconds=30 * 60)
nasa_cache = TTLCache(ttl_seconds=12 * 60 * 60)

REQUEST_TIMEOUT = httpx.Timeout(15.0, connect=5.0)


class DataSourceError(RuntimeError):
	pass


def make_client(**kwargs) -> httpx.AsyncClient:
	"""Single place to build the HTTP client so tests can swap in a mock transport."""
	return httpx.AsyncClient(timeout=REQUEST_TIMEOUT, **kwargs)


async def fetch_weather(client: httpx.AsyncClient, lat: float, lon: float) -> dict[str, Any]:
	params = {
		"latitude": lat,
		"longitude": lon,
		"current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code",
		"hourly": "temperature_2m,relative_humidity_2m,precipitation_probability,precipitation",
		"daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
		"forecast_days": 7,
		"timezone": "auto",
		"wind_speed_unit": "mph",
	}
	response = await client.get(OPEN_METEO_URL, params=params)
	if response.status_code != 200:
		raise DataSourceError(f"Open-Meteo returned {response.status_code}")
	data = response.json()

	current = data.get("current", {})
	return {
		"timezone": data.get("timezone"),
		"current": {
			"temperature_c": current.get("temperature_2m"),
			"humidity_pct": current.get("relative_humidity_2m"),
			"precipitation_mm": current.get("precipitation"),
			"wind_mph": current.get("wind_speed_10m"),
			"weather_code": current.get("weather_code"),
		},
		"hourly": {
			"time": data.get("hourly", {}).get("time", []),
			"temperature_c": data.get("hourly", {}).get("temperature_2m", []),
			"humidity_pct": data.get("hourly", {}).get("relative_humidity_2m", []),
			"precipitation_probability_pct": data.get("hourly", {}).get("precipitation_probability", []),
			"precipitation_mm": data.get("hourly", {}).get("precipitation", []),
		},
		"daily": {
			"date": data.get("daily", {}).get("time", []),
			"max_c": data.get("daily", {}).get("temperature_2m_max", []),
			"min_c": data.get("daily", {}).get("temperature_2m_min", []),
			"precipitation_mm": data.get("daily", {}).get("precipitation_sum", []),
		},
	}


def _valid_values(series: dict[str, float], fill_value: float) -> list[tuple[str, float]]:
	"""NASA marks missing days (the most recent few are usually missing) with a fill value."""
	return sorted((day, v) for day, v in series.items() if v is not None and v != fill_value)


async def fetch_nasa_power(client: httpx.AsyncClient, lat: float, lon: float, today: date | None = None) -> dict[str, Any]:
	today = today or date.today()
	params = {
		"parameters": ",".join(NASA_PARAMETERS),
		"community": "AG",
		"latitude": lat,
		"longitude": lon,
		"start": (today - timedelta(days=NASA_LOOKBACK_DAYS)).strftime("%Y%m%d"),
		"end": today.strftime("%Y%m%d"),
		"format": "JSON",
	}
	response = await client.get(NASA_POWER_URL, params=params)
	if response.status_code != 200:
		raise DataSourceError(f"NASA POWER returned {response.status_code}")
	data = response.json()

	fill_value = data.get("header", {}).get("fill_value", -999.0)
	series = data.get("properties", {}).get("parameter", {})
	units = {name: meta.get("units") for name, meta in data.get("parameters", {}).items()}

	def latest(name: str) -> float | None:
		values = _valid_values(series.get(name, {}), fill_value)
		return values[-1][1] if values else None

	def total(name: str) -> float | None:
		values = _valid_values(series.get(name, {}), fill_value)
		return round(sum(v for _, v in values), 1) if values else None

	def mean(name: str) -> float | None:
		values = _valid_values(series.get(name, {}), fill_value)
		return round(sum(v for _, v in values) / len(values), 2) if values else None

	soil_days = _valid_values(series.get("GWETROOT", {}), fill_value)
	return {
		"source": "NASA POWER",
		"period_days": NASA_LOOKBACK_DAYS,
		"latest_day": soil_days[-1][0] if soil_days else None,
		"root_zone_soil_wetness": latest("GWETROOT"),
		"surface_soil_wetness": latest("GWETTOP"),
		"precipitation_total_mm": total("PRECTOTCORR"),
		"mean_temperature_c": mean("T2M"),
		"mean_solar_radiation": mean("ALLSKY_SFC_SW_DWN"),
		"solar_radiation_units": units.get("ALLSKY_SFC_SW_DWN"),
	}


async def _cached(cache: TTLCache, key, fetch) -> tuple[Any, bool]:
	value = cache.get(key)
	if value is not None:
		return value, True
	value = await fetch()
	cache.set(key, value)
	return value, False


async def get_conditions(lat: float, lon: float) -> dict[str, Any]:
	"""Weather + NASA data for a location, fetched concurrently and cached per source."""
	key = location_key(lat, lon)
	async with make_client() as client:
		weather_result, nasa_result = await asyncio.gather(
			_cached(weather_cache, key, lambda: fetch_weather(client, lat, lon)),
			_cached(nasa_cache, key, lambda: fetch_nasa_power(client, lat, lon)),
			return_exceptions=True,
		)

	# The forecast is required (pest risk depends on it); soil history is a bonus,
	# so a NASA outage degrades the response instead of failing it.
	if isinstance(weather_result, BaseException):
		raise DataSourceError(f"Weather unavailable: {weather_result}") from weather_result
	weather, weather_hit = weather_result

	warnings = []
	if isinstance(nasa_result, BaseException):
		nasa, nasa_hit = None, False
		warnings.append(f"NASA soil data unavailable: {nasa_result}")
	else:
		nasa, nasa_hit = nasa_result

	return {
		"location": {"lat": key[0], "lon": key[1]},
		"weather": weather,
		"soil": nasa,
		"cache": {"weather": weather_hit, "soil": nasa_hit},
		"warnings": warnings,
	}
