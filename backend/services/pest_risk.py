"""Disease/pest risk from the hourly forecast.

These are simple, explainable weather rules, not a validated disease model.
Most leaf diseases need leaves to stay wet for hours at the right temperature,
and forecasts don't include leaf wetness, so "hours with relative humidity
>= 90%" stands in for it. Thresholds live in RULES so they're easy to tune.
"""

from collections import defaultdict
from dataclasses import dataclass

HUMID_RH = 90  # % relative humidity treated as "leaves likely wet"


@dataclass(frozen=True)
class Rule:
	crop: str
	threat: str
	min_temp_c: float
	max_temp_c: float
	min_humid_hours: int  # humid hours in the temperature band needed for a day to count
	description: str


# Potato uses the Hutton criteria separately (below); these cover the other crops.
RULES = [
	Rule("wheat", "leaf and stripe rust", 10, 25, 6,
	     "mild temperatures with long humid (dew) periods"),
	Rule("corn", "gray leaf spot", 22, 30, 6,
	     "warm temperatures with extended high humidity"),
	Rule("sugarcane", "brown rust", 18, 28, 8,
	     "warm, humid nights with heavy dew"),
]


def _by_day(hourly: dict) -> dict[str, list[tuple[float, float]]]:
	days: dict[str, list[tuple[float, float]]] = defaultdict(list)
	for ts, temp, rh in zip(hourly.get("time", []), hourly.get("temperature_c", []), hourly.get("humidity_pct", [])):
		if temp is None or rh is None:
			continue
		days[ts[:10]].append((temp, rh))
	return dict(sorted(days.items()))


def _level(favorable_days: int) -> str:
	return "high" if favorable_days >= 2 else "moderate" if favorable_days == 1 else "low"


def potato_late_blight(days: dict[str, list[tuple[float, float]]]) -> dict:
	"""Hutton criteria: two consecutive days, each with a minimum temperature of at
	least 10 °C and at least 6 hours of relative humidity >= 90%."""
	qualifying = [
		day for day, hours in days.items()
		if hours and min(t for t, _ in hours) >= 10 and sum(rh >= HUMID_RH for _, rh in hours) >= 6
	]
	ordered = list(days)
	consecutive = any(
		ordered.index(b) - ordered.index(a) == 1 for a, b in zip(qualifying, qualifying[1:])
	)
	risk = "high" if consecutive else "moderate" if qualifying else "low"
	return {
		"crop": "potato",
		"threat": "late blight",
		"risk": risk,
		"favorable_days": qualifying,
		"reason": "Hutton criteria: 2 consecutive days with min temp >= 10 °C and 6+ hours at >= 90% humidity",
	}


def assess(hourly: dict) -> list[dict]:
	days = _by_day(hourly)
	results = [potato_late_blight(days)]
	for rule in RULES:
		favorable = [
			day for day, hours in days.items()
			if sum(rule.min_temp_c <= t <= rule.max_temp_c and rh >= HUMID_RH for t, rh in hours) >= rule.min_humid_hours
		]
		results.append({
			"crop": rule.crop,
			"threat": rule.threat,
			"risk": _level(len(favorable)),
			"favorable_days": favorable,
			"reason": f"Favored by {rule.description} "
			          f"({rule.min_humid_hours}+ h at {rule.min_temp_c:g}-{rule.max_temp_c:g} °C and >= {HUMID_RH}% humidity)",
		})
	return results
