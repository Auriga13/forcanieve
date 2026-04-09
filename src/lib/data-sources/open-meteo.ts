/**
 * Open-Meteo API client — free, no API key needed.
 * Provides weather forecasts and snow depth data for mountain zones.
 * Uses ECMWF/Meteo-France models with good altitude resolution.
 *
 * API docs: https://open-meteo.com/en/docs
 */

import type { FetchedWeather, FetchedSnow, ZoneCoords } from "./types";

const BASE_URL = "https://api.open-meteo.com/v1/forecast";

// Wind direction degrees to compass
function degreesToDirection(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

// Estimate snow line from freezing level (rough: snow line ≈ freezing level - 200m)
function estimateSnowLine(freezingLevel: number): number {
  return Math.max(0, freezingLevel - 200);
}

interface OpenMeteoResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    snowfall_sum: number[];
    windspeed_10m_max: number[];
    winddirection_10m_dominant: number[];
    cloudcover_mean?: number[];
  };
  hourly?: {
    time: string[];
    snow_depth: number[];
    freezinglevel_height: number[];
    cloudcover: number[];
    temperature_1000hPa?: number[];
    temperature_850hPa?: number[];
    temperature_700hPa?: number[];
  };
}

export async function fetchWeatherForZone(
  zone: ZoneCoords
): Promise<FetchedWeather[]> {
  const params = new URLSearchParams({
    latitude: String(zone.lat),
    longitude: String(zone.lng),
    daily: [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "snowfall_sum",
      "windspeed_10m_max",
      "winddirection_10m_dominant",
    ].join(","),
    hourly: [
      "freezinglevel_height",
      "cloudcover",
      "snow_depth",
      "temperature_850hPa",
    ].join(","),
    timezone: "Europe/Madrid",
    forecast_days: "7",
    models: "best_match",
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) {
    console.error(`Open-Meteo error for ${zone.name}: ${res.status}`);
    return [];
  }

  const data: OpenMeteoResponse = await res.json();
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();

  return data.daily.time.map((date, i) => {
    // Get midday values from hourly data (index 12 of 24 hours per day)
    const hourlyIdx = i * 24 + 12;
    const freezingLevel = data.hourly?.freezinglevel_height?.[hourlyIdx] ?? 2500;
    const cloudCover = data.hourly?.cloudcover?.[hourlyIdx] ?? 50;
    const temp850 = data.hourly?.temperature_850hPa?.[hourlyIdx] ?? -5;

    const windDir = degreesToDirection(
      data.daily.winddirection_10m_dominant[i] ?? 0
    );

    return {
      zoneId: zone.id,
      validFrom: `${date}T06:00:00Z`,
      validTo: `${date}T23:59:59Z`,
      source: "open_meteo" as const,
      forecastData: {
        tempMin: Math.round(data.daily.temperature_2m_min[i] ?? 0),
        tempMax: Math.round(data.daily.temperature_2m_max[i] ?? 0),
        tempAltitudeMin: Math.round(temp850 - 5),
        tempAltitudeMax: Math.round(temp850),
        altitudeReference: 2500,
        precipitationMm: Math.round((data.daily.precipitation_sum[i] ?? 0) * 10) / 10,
        snowLineMeter: Math.round(estimateSnowLine(freezingLevel)),
        windSpeedKmh: Math.round(data.daily.windspeed_10m_max[i] ?? 0),
        windDirection: windDir,
        cloudCoverPct: Math.round(cloudCover),
        visibility: cloudCover > 80 ? "poor" : cloudCover > 50 ? "moderate" : "good",
        freezingLevelMeter: Math.round(freezingLevel),
      },
      alertsJson: null,
      expiresAt,
    };
  });
}

export async function fetchSnowForZone(
  zone: ZoneCoords
): Promise<FetchedSnow | null> {
  // Fetch snow depth at multiple altitude points around the zone
  const altitudes = [1800, 2200, 2600, 3000];
  const depthByAltitude: Record<string, number> = {};

  // Open-Meteo supports elevation parameter for point forecasts
  for (const alt of altitudes) {
    const params = new URLSearchParams({
      latitude: String(zone.lat),
      longitude: String(zone.lng),
      hourly: "snow_depth",
      timezone: "Europe/Madrid",
      forecast_days: "7",
      elevation: String(alt),
    });

    try {
      const res = await fetch(`${BASE_URL}?${params}`);
      if (!res.ok) continue;

      const data = await res.json();
      // Get current snow depth (latest available value)
      const depths: number[] = data.hourly?.snow_depth ?? [];
      const currentDepth = depths.find((d: number) => d != null && d >= 0) ?? 0;
      // Convert from meters to cm
      depthByAltitude[String(alt)] = Math.round(currentDepth * 100);
    } catch {
      depthByAltitude[String(alt)] = 0;
    }
  }

  // Fetch snowfall totals from daily data
  const dailyParams = new URLSearchParams({
    latitude: String(zone.lat),
    longitude: String(zone.lng),
    daily: "snowfall_sum",
    timezone: "Europe/Madrid",
    past_days: "7",
    forecast_days: "1",
  });

  let snowfall24h: number | null = null;
  let snowfall48h: number | null = null;
  let snowfall7d: number | null = null;

  try {
    const res = await fetch(`${BASE_URL}?${dailyParams}`);
    if (res.ok) {
      const data = await res.json();
      const sums: number[] = data.daily?.snowfall_sum ?? [];
      // Last entries are most recent
      const len = sums.length;
      if (len >= 1) snowfall24h = Math.round((sums[len - 1] ?? 0) * 10) / 10;
      if (len >= 2) snowfall48h = Math.round(((sums[len - 1] ?? 0) + (sums[len - 2] ?? 0)) * 10) / 10;
      if (len >= 7) snowfall7d = Math.round(sums.slice(-7).reduce((a, b) => a + (b ?? 0), 0) * 10) / 10;
    }
  } catch {
    // Snowfall data optional
  }

  return {
    zoneId: zone.id,
    observationDate: new Date().toISOString().split("T")[0],
    source: "open_meteo",
    depthByAltitude,
    snowfall24hCm: snowfall24h,
    snowfall48hCm: snowfall48h,
    snowfall7dCm: snowfall7d,
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
  };
}
