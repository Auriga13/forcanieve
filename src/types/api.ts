import type { ZoneSummary, WeatherAlert } from "./zone";
import type { DayForecast, TrendDay } from "./weather";
import type { SnowData } from "./snow";
import type { AvalancheInfo } from "./avalanche";
import type { RouteWithCondition } from "./route";

export interface ZonesApiResponse {
  zones: ZoneSummary[];
}

export interface WeatherApiResponse {
  zone: { id: string; name: string; slug: string };
  forecast: DayForecast[];
  trend7d: TrendDay[];
  alerts: WeatherAlert[] | null;
  lastUpdated: string;
}

export interface SnowApiResponse {
  zone: { id: string; name: string; slug: string };
  snow: SnowData;
  avalanche: AvalancheInfo | null;
  routes: RouteWithCondition[];
}

export interface ApiError {
  error: string;
}

export interface SubscribeRequest {
  email: string;
  zones: string[];
  frequency: "daily" | "weekly";
}

export interface LlmSummaryRow {
  id: string;
  zone_id: string | null;
  summary_type: "homepage" | "zone" | "email";
  content: string;
  data_snapshot: Record<string, unknown> | null;
  model_id: string;
  generated_at: string;
  expires_at: string;
}

export interface WebcamRow {
  id: string;
  zone_id: string;
  name: string;
  embed_url: string;
  thumbnail_url: string | null;
  source: string | null;
  is_active: boolean;
  sort_order: number;
}
