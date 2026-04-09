import type { AvalancheTrend } from "./zone";

export interface AvalancheInfo {
  riskLevel: number;
  trend: AvalancheTrend;
  bulletinSummary: string;
  bulletinUrl: string;
  validDate: string;
  lastUpdated: string;
}

export interface AvalancheDataRow {
  id: string;
  zone_id: string;
  fetched_at: string;
  valid_date: string;
  source: "meteo_france_bra" | "a_lurte" | "manual";
  risk_level: number;
  trend: AvalancheTrend;
  bulletin_summary: string | null;
  bulletin_url: string | null;
  raw_bulletin: Record<string, unknown> | null;
  expires_at: string;
}
