from services import pest_risk


def hourly(days: dict[str, list[tuple[float, float]]]) -> dict:
	"""Build an hourly series from {date: [(temp, rh), ...]}."""
	time, temps, rhs = [], [], []
	for day, hours in days.items():
		for h, (t, rh) in enumerate(hours):
			time.append(f"{day}T{h:02d}:00")
			temps.append(t)
			rhs.append(rh)
	return {"time": time, "temperature_c": temps, "humidity_pct": rhs}


def day(min_temp: float, humid_hours: int, temp: float = 14.0) -> list[tuple[float, float]]:
	return [(min_temp, 95)] * humid_hours + [(temp, 60)] * (24 - humid_hours)


def by_crop(results):
	return {r["crop"]: r for r in results}


def test_hutton_two_consecutive_days_is_high():
	data = hourly({"2026-10-20": day(11, 7), "2026-10-21": day(12, 6), "2026-10-22": day(5, 0)})
	assert by_crop(pest_risk.assess(data))["potato"]["risk"] == "high"


def test_hutton_non_consecutive_days_is_moderate():
	data = hourly({"2026-10-20": day(11, 7), "2026-10-21": day(5, 0), "2026-10-22": day(12, 8)})
	assert by_crop(pest_risk.assess(data))["potato"]["risk"] == "moderate"


def test_hutton_cold_nights_do_not_count():
	data = hourly({"2026-10-20": day(8, 10), "2026-10-21": day(9, 10)})
	assert by_crop(pest_risk.assess(data))["potato"]["risk"] == "low"


def test_dry_week_is_low_for_every_crop():
	data = hourly({f"2026-10-{d}": [(20, 40)] * 24 for d in range(20, 27)})
	assert {r["risk"] for r in pest_risk.assess(data)} == {"low"}


def test_conditions_endpoint_includes_pest_risk(client):
	body = client.get("/api/conditions?lat=36.7&lon=-119.8").get_json()
	risks = by_crop(body["pest_risk"])
	# Fixture: 3 days of 14 °C at 95% humidity all day -> rust and blight weather.
	assert risks["potato"]["risk"] == "high"
	assert risks["wheat"]["risk"] == "high"
	assert risks["corn"]["risk"] == "low"  # too cool for gray leaf spot
