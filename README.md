# Starvest

A React Native (Expo) app that helps small farms decide what to grow and when to watch for crop disease, using live weather, NASA satellite-derived soil data and AI recommendations.

## Architecture

```
Expo app (React Native)
   │  GET /api/conditions?lat=&lon=      POST /api/recommendations {lat, lon}
   ▼
Flask backend (async views)
   ├─ Open-Meteo        7-day hourly forecast            ┐ fetched concurrently
   ├─ NASA POWER        30 days of soil wetness, rain,   ┘ (httpx + asyncio.gather)
   │                    temperature, solar radiation
   ├─ TTL cache         per source, keyed by location rounded to ~1 km
   │                    (forecast 30 min, NASA 12 h, AI answers 1 h)
   ├─ Pest risk         weather rules per crop (Hutton criteria for potato late blight)
   └─ OpenAI API        structured crop + soil-treatment recommendations
                        (rule-based fallback when no key or the call fails)
```

## Run the backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # optional: add OPENAI_API_KEY for AI advice
flask --app app run --host 0.0.0.0 --port 5000
```

Without an OpenAI key the app still works and shows rule-based advice.

Run the tests (no network or API keys needed):

```bash
cd backend && python -m pytest
```

## Run the app

```bash
npm install
npx expo start
```

The app finds the backend at the same machine Expo is served from, on port 5000, so a phone on the same Wi-Fi works without configuration. To point it somewhere else:

```bash
EXPO_PUBLIC_API_URL=https://your-backend.example.com npx expo start
```

## API

| Endpoint | Returns |
|---|---|
| `GET /api/health` | `{"status": "ok"}` |
| `GET /api/conditions?lat=&lon=` | current weather, 7-day forecast, NASA soil data, per-crop disease risk, cache hits, warnings |
| `POST /api/recommendations` `{lat, lon}` | per-crop suitability with reasons, soil treatments, summary, and `source` (`openai` or `rules`) |

## Data sources

- [Open-Meteo](https://open-meteo.com/): forecast, no key required
- [NASA POWER](https://power.larc.nasa.gov/): daily agroclimatology data (community `AG`), no key required. Soil wetness is a 0-1 fraction for the surface and root zone
- [OpenAI API](https://platform.openai.com/): optional, set `OPENAI_API_KEY` and `OPENAI_MODEL`

The disease risk rules are simple weather heuristics for prioritizing scouting, not a validated disease model.
