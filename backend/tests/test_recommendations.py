from types import SimpleNamespace

import pytest

import app as app_module
from services import recommendations
from services.recommendations import CropRecommendation, Recommendations, SoilTreatment


@pytest.fixture(autouse=True)
def clear_cache():
	app_module.recommendation_cache.clear()


def test_without_api_key_uses_rules(client, monkeypatch):
	monkeypatch.delenv("OPENAI_API_KEY", raising=False)
	res = client.post("/api/recommendations", json={"lat": 36.7, "lon": -119.8})
	body = res.get_json()
	assert res.status_code == 200
	assert body["source"] == "rules"
	crops = {c["crop"]: c for c in body["recommendations"]["crops"]}
	assert set(crops) == {"potato", "wheat", "corn", "sugarcane"}
	# Fixture forecast averages ~16 °C: inside potato's range, but blight risk is high.
	assert crops["potato"]["suitability"] == "fair"
	assert "late blight" in crops["potato"]["reason"]
	assert crops["sugarcane"]["suitability"] == "fair"
	actions = [t["action"] for t in body["recommendations"]["soil_treatments"]]
	assert any("disease" in a for a in actions)


class FakeOpenAI:
	def __init__(self, parsed=None, error=None):
		self.calls = []
		self.responses = SimpleNamespace(parse=self._parse)
		self._parsed, self._error = parsed, error

	async def _parse(self, **kwargs):
		self.calls.append(kwargs)
		if self._error:
			raise self._error
		return SimpleNamespace(output_parsed=self._parsed)


def ai_answer():
	return Recommendations(
		summary="Plant wheat; hold off on potatoes until the humid spell passes.",
		crops=[CropRecommendation(crop="wheat", suitability="good", reason="Mild temps.")],
		soil_treatments=[SoilTreatment(action="Mulch", reason="Root-zone wetness 0.38.")],
	)


def test_openai_path_sends_live_data_and_caches(client, fake_apis, monkeypatch):
	monkeypatch.setenv("OPENAI_API_KEY", "test")
	fake = FakeOpenAI(parsed=ai_answer())
	monkeypatch.setattr(recommendations, "make_openai_client", lambda: fake)

	body = client.post("/api/recommendations", json={"lat": 36.7, "lon": -119.8}).get_json()
	assert body["source"] == "openai"
	assert body["recommendations"]["crops"][0]["crop"] == "wheat"
	assert body["cached"] is False

	sent = fake.calls[0]
	assert sent["text_format"] is Recommendations
	user_message = sent["input"][1]["content"]
	assert "root_zone_soil_wetness" in user_message and "late blight" in user_message

	again = client.post("/api/recommendations", json={"lat": 36.7, "lon": -119.8}).get_json()
	assert again["cached"] is True
	assert len(fake.calls) == 1


def test_openai_failure_falls_back_to_rules(client, monkeypatch):
	monkeypatch.setenv("OPENAI_API_KEY", "test")
	monkeypatch.setattr(recommendations, "make_openai_client", lambda: FakeOpenAI(error=TimeoutError()))
	body = client.post("/api/recommendations", json={"lat": 36.7, "lon": -119.8}).get_json()
	assert body["source"] == "rules"
	assert "TimeoutError" in body["warning"]


def test_requires_location(client):
	assert client.post("/api/recommendations", json={}).status_code == 400
