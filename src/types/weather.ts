import type { WeatherAlert, WeatherSnapshot } from "./zone";

export interface DayForecast {
  date: string;
  tempMin: number;
  tempMax: number;
  tempAltitudeMin: number;
  tempAltitudeMax: number;
  altitudeReference: number;
  precipitationMm: number;
  snowLineMeter: number;
  windSpeedKmh: number;
  windDirection: string;
  cloudCoverPct: number;
  freezingLevelMeter: number;
}

export interface TrendDay {
  date: string;
  tendency: "improving" | "stable" | "worsening";
  tempRange: string;
}

export interface WeatherResponse {
  zone: { id: string; name: string; slug: string };
  forecast: DayForecast[];
  trend7d: TrendDay[];
  alerts: WeatherAlert[] | null;
  lastUpdated: string;
}

export interface WeatherDataRow {
  id: string;
  zone_id: string;
  fetched_at: string;
  valid_from: string;
  valid_to: string;
  source: "aemet" | "open_meteo";
  forecast_data: WeatherSnapshot;
  alerts_json: WeatherAlert[] | null;
  expires_at: string;
}
