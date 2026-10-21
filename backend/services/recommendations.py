"""Crop and soil-treatment recommendations.

With OPENAI_API_KEY set, the live weather, NASA soil data and pest risk go to
the OpenAI API and come back as a typed (Pydantic) structured output. Without
a key, or if the call fails, simple agronomy rules produce the same shape, so
the app always has something to show.
"""

import json
import os
from typing import Literal

from pydantic import BaseModel, Field

CANDIDATE_CROPS = ["potato", "wheat", "corn", "sugarcane"]

# Rough temperature comfort ranges (daily mean, °C) used by the rule-based fallback.
CROP_TEMP_RANGES = {
	"potato": (10, 22),
	"wheat": (10, 25),
	"corn": (18, 32),
	"sugarcane": (20, 35),
}


class CropRecommendation(BaseModel):
	crop: str
	suitability: Literal["good", "fair", "poor"]
	reason: str = Field(description="One or two sentences grounded in the provided data")


class SoilTreatment(BaseModel):
	action: str
	reason: str


class Recommendations(BaseModel):
	summary: str = Field(description="Two sentences a farmer can act on")
	crops: list[CropRecommendation]
	soil_treatments: list[SoilTreatment]


SYSTEM_PROMPT = f"""You are an agronomy assistant for small farms.
Using ONLY the data provided (7-day forecast, NASA POWER soil wetness and rainfall
for the last 30 days, and rule-based pest risk), rate each of these crops for
planting or growing right now: {", ".join(CANDIDATE_CROPS)}.
Then suggest up to 3 soil treatments (irrigation, drainage, mulching, amendments,
preventive disease measures). Be practical and cautious, cite the numbers you used,
and say when the data is too limited to be confident.
Soil wetness is a 0-1 fraction (0 = bone dry, 1 = saturated)."""


def _mean_daily_temp(conditions: dict) -> float | None:
	daily = conditions["weather"]["daily"]
	pairs = [(hi + lo) / 2 for hi, lo in zip(daily["max_c"], daily["min_c"]) if hi is not None and lo is not None]
	return round(sum(pairs) / len(pairs), 1) if pairs else None


def rule_based(conditions: dict, pest_risk: list[dict]) -> Recommendations:
	mean_temp = _mean_daily_temp(conditions)
	soil = conditions.get("soil") or {}
	wetness = soil.get("root_zone_soil_wetness")
	risk_by_crop = {r["crop"]: r for r in pest_risk}

	crops = []
	for crop in CANDIDATE_CROPS:
		low, high = CROP_TEMP_RANGES[crop]
		if mean_temp is None:
			suitability, reason = "fair", "No temperature forecast available."
		elif low <= mean_temp <= high:
			suitability, reason = "good", f"Forecast mean of {mean_temp} °C is inside its {low}-{high} °C range."
		elif low - 4 <= mean_temp <= high + 4:
			suitability, reason = "fair", f"Forecast mean of {mean_temp} °C is just outside its {low}-{high} °C range."
		else:
			suitability, reason = "poor", f"Forecast mean of {mean_temp} °C is well outside its {low}-{high} °C range."
		risk = risk_by_crop.get(crop)
		if risk and risk["risk"] == "high" and suitability == "good":
			suitability = "fair"
			reason += f" High {risk['threat']} risk this week."
		crops.append(CropRecommendation(crop=crop, suitability=suitability, reason=reason))

	treatments = []
	if wetness is not None and wetness < 0.3:
		treatments.append(SoilTreatment(action="Irrigate and mulch", reason=f"Root-zone soil wetness is low ({wetness})."))
	elif wetness is not None and wetness > 0.8:
		treatments.append(SoilTreatment(action="Improve drainage and avoid working wet soil", reason=f"Root-zone soil wetness is high ({wetness})."))
	high_risks = [r for r in pest_risk if r["risk"] == "high"]
	if high_risks:
		names = ", ".join(f"{r['crop']} ({r['threat']})" for r in high_risks)
		treatments.append(SoilTreatment(
			action="Scout fields and plan preventive disease control",
			reason=f"Weather favors {names}. Check local extension guidance before spraying.",
		))
	if not treatments:
		treatments.append(SoilTreatment(action="No treatment needed this week", reason="Soil moisture and disease risk look normal."))

	good = [c.crop for c in crops if c.suitability == "good"]
	fair = [c.crop for c in crops if c.suitability == "fair"]
	if good:
		summary = f"Best fits this week: {', '.join(good)}."
	elif fair:
		summary = f"Possible with care this week: {', '.join(fair)}."
	else:
		summary = "No candidate crop fits this week's temperatures well."
	if high_risks:
		summary += " Watch for disease: " + ", ".join(r["crop"] for r in high_risks) + "."
	return Recommendations(summary=summary, crops=crops, soil_treatments=treatments)


def _prompt_payload(conditions: dict, pest_risk: list[dict]) -> str:
	weather = conditions["weather"]
	return json.dumps({
		"location": conditions["location"],
		"current": weather["current"],
		"daily_forecast": weather["daily"],
		"nasa_soil_last_30_days": conditions.get("soil"),
		"pest_risk": [{k: r[k] for k in ("crop", "threat", "risk")} for r in pest_risk],
	})


def make_openai_client():
	from openai import AsyncOpenAI

	return AsyncOpenAI()


async def recommend(conditions: dict, pest_risk: list[dict]) -> dict:
	if not os.getenv("OPENAI_API_KEY"):
		return {"source": "rules", "recommendations": rule_based(conditions, pest_risk).model_dump()}

	model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
	try:
		response = await make_openai_client().responses.parse(
			model=model,
			input=[
				{"role": "system", "content": SYSTEM_PROMPT},
				{"role": "user", "content": _prompt_payload(conditions, pest_risk)},
			],
			text_format=Recommendations,
		)
		parsed = response.output_parsed
		if parsed is None:
			raise ValueError("model returned no structured output")
		return {"source": "openai", "model": model, "recommendations": parsed.model_dump()}
	except Exception as exc:  # network, auth, refusal, schema mismatch
		return {
			"source": "rules",
			"recommendations": rule_based(conditions, pest_risk).model_dump(),
			"warning": f"AI recommendations unavailable ({type(exc).__name__}); showing rule-based ones.",
		}
