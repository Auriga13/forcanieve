export interface SnowData {
  depthByAltitude: Record<string, number>;
  snowfall24h: number | null;
  snowfall48h: number | null;
  snowfall7d: number | null;
  lastUpdated: string;
}

export interface SnowDataRow {
  id: string;
  zone_id: string;
  fetched_at: string;
  observation_date: string;
  source: "open_meteo" | "aemet" | "manual";
  depth_by_altitude: Record<string, number>;
  snowfall_24h_cm: number | null;
  snowfall_48h_cm: number | null;
  snowfall_7d_cm: number | null;
  expires_at: string;
}
