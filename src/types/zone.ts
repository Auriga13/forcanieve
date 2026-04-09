export interface Zone {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  lat: number;
  lng: number;
  polygon: Record<string, unknown>;
  imageUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ZoneSummary {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  weather: WeatherSnapshot | null;
  alerts: WeatherAlert[] | null;
  snowDepth: Record<string, number> | null;
  snowfall24h: number | null;
  avalancheRisk: number | null;
  avalancheTrend: AvalancheTrend | null;
  avalancheSummary: string | null;
  llmSummary: string | null;
  summaryUpdatedAt: string | null;
}

export interface WeatherSnapshot {
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
  visibility: string;
  freezingLevelMeter: number;
}

export interface WeatherAlert {
  type: "wind" | "snow" | "rain" | "cold" | "heat" | "storms";
  severity: "yellow" | "orange" | "red";
  message: string;
  validUntil: string;
}

export type AvalancheTrend = "rising" | "stable" | "falling";
