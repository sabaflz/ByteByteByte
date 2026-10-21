import Constants from 'expo-constants';

/**
 * Where the Flask backend lives.
 * 1. EXPO_PUBLIC_API_URL if set (e.g. a deployed backend).
 * 2. In development, the same machine that serves the Expo bundle, port 5000.
 *    This works from a phone on the same Wi-Fi without hardcoding an IP.
 * 3. localhost for the web build.
 */
function resolveApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return host ? `http://${host}:5000` : 'http://localhost:5000';
}

export const API_URL = resolveApiUrl();

export type Risk = 'low' | 'moderate' | 'high';

export type PestRisk = {
  crop: string;
  threat: string;
  risk: Risk;
  favorable_days: string[];
  reason: string;
};

export type Conditions = {
  location: { lat: number; lon: number };
  weather: {
    current: {
      temperature_c: number | null;
      humidity_pct: number | null;
      precipitation_mm: number | null;
      wind_mph: number | null;
      weather_code: number | null;
    };
    daily: { date: string[]; max_c: number[]; min_c: number[]; precipitation_mm: number[] };
  };
  soil: {
    root_zone_soil_wetness: number | null;
    surface_soil_wetness: number | null;
    precipitation_total_mm: number | null;
    period_days: number;
  } | null;
  pest_risk: PestRisk[];
  warnings: string[];
};

export type Recommendations = {
  source: 'openai' | 'rules';
  model?: string;
  warning?: string;
  recommendations: {
    summary: string;
    crops: { crop: string; suitability: 'good' | 'fair' | 'poor'; reason: string }[];
    soil_treatments: { action: string; reason: string }[];
  };
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(`${API_URL}${path}`, { ...init, signal: controller.signal });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
    return body as T;
  } finally {
    clearTimeout(timer);
  }
}

export function fetchConditions(lat: number, lon: number): Promise<Conditions> {
  return request(`/api/conditions?lat=${lat}&lon=${lon}`);
}

export function fetchRecommendations(lat: number, lon: number): Promise<Recommendations> {
  return request('/api/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lon }),
  });
}
