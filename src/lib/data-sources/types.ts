export interface FetchedWeather {
  zoneId: string;
  validFrom: string;
  validTo: string;
  source: "aemet" | "open_meteo";
  forecastData: {
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
  };
  alertsJson: null;
  expiresAt: string;
}

export interface FetchedSnow {
  zoneId: string;
  observationDate: string;
  source: "open_meteo" | "aemet" | "manual";
  depthByAltitude: Record<string, number>;
  snowfall24hCm: number | null;
  snowfall48hCm: number | null;
  snowfall7dCm: number | null;
  expiresAt: string;
}

export interface ZoneCoords {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
}
