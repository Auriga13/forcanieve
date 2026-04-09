/**
 * AEMET OpenData API client.
 * Spanish national weather service — official forecasts and alerts.
 *
 * AEMET uses a two-step API: first request returns a URL to the actual data.
 * Free API key required (register at https://opendata.aemet.es).
 * Rate limit: 50 requests/minute.
 *
 * Docs: https://opendata.aemet.es/dist/index.html
 */

import type { FetchedWeather, ZoneCoords } from "./types";

const BASE_URL = "https://opendata.aemet.es/opendata/api";

// Map our zones to AEMET municipality codes (INE codes for representative towns)
// AEMET uses 5-digit INE municipality codes
const ZONE_MUNICIPALITY_CODES: Record<string, string> = {
  "anso-hecho": "22031",    // Ansó (id22031)
  "canfranc": "22090",      // Canfranc
  "tena": "22168",          // Panticosa (id22168)
  "ordesa": "22252",        // Torla-Ordesa (id22252)
  "bielsa": "22057",        // Bielsa
  "benasque": "22054",      // Benasque
  "posets": "22130",        // Gistaín (closest to Posets)
  "cerler": "22054",        // Benasque (Cerler is part of Benasque)
};

// Map zones to AEMET mountain area codes for alerts
const ZONE_AREA_CODES: Record<string, string> = {
  "anso-hecho": "ara221",
  "canfranc": "ara221",
  "tena": "ara222",
  "ordesa": "ara222",
  "bielsa": "ara223",
  "benasque": "ara223",
  "posets": "ara223",
  "cerler": "ara223",
};

interface AemetResponse {
  estado: number;
  datos: string;
  metadatos: string;
}

interface AemetDayForecast {
  fecha: string;
  temperatura: { maxima: string; minima: string };
  viento: Array<{
    direccion: string;
    velocidad: string;
    periodo?: string;
  }>;
  probPrecipitacion: Array<{
    value: string;
    periodo?: string;
  }>;
  cotaNieveProv: Array<{
    value: string;
    periodo?: string;
  }>;
  estadoCielo: Array<{
    value: string;
    descripcion: string;
    periodo?: string;
  }>;
}

interface AemetMunicipalityForecast {
  prediccion: {
    dia: AemetDayForecast[];
  };
}

async function aemetFetch(url: string): Promise<unknown> {
  const apiKey = process.env.AEMET_API_KEY;
  if (!apiKey || apiKey === "your_aemet_api_key_here") {
    throw new Error("AEMET_API_KEY not configured");
  }

  // Step 1: Get data URL
  const res1 = await fetch(url, {
    headers: { "api_key": apiKey },
  });

  if (!res1.ok) {
    throw new Error(`AEMET API error: ${res1.status} ${res1.statusText}`);
  }

  const meta: AemetResponse = await res1.json();
  if (meta.estado !== 200 || !meta.datos) {
    throw new Error(`AEMET response error: estado=${meta.estado}`);
  }

  // Step 2: Fetch actual data from the returned URL
  const res2 = await fetch(meta.datos);
  if (!res2.ok) {
    throw new Error(`AEMET data fetch error: ${res2.status}`);
  }

  return res2.json();
}

function windDirectionToCompass(dir: string): string {
  const map: Record<string, string> = {
    N: "N", NE: "NE", E: "E", SE: "SE",
    S: "S", SO: "SW", O: "W", NO: "NW",
    C: "Calm",
  };
  return map[dir] ?? dir;
}

export async function fetchAemetWeatherForZone(
  zone: ZoneCoords
): Promise<FetchedWeather[]> {
  const munCode = ZONE_MUNICIPALITY_CODES[zone.slug];
  if (!munCode) {
    console.log(`  AEMET: No municipality code for ${zone.slug}`);
    return [];
  }

  try {
    const data = await aemetFetch(
      `${BASE_URL}/prediccion/especifica/municipio/diaria/${munCode}`
    ) as AemetMunicipalityForecast[];

    if (!data?.[0]?.prediccion?.dia) return [];

    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
    const days = data[0].prediccion.dia;

    return days.map((day) => {
      const tempMax = parseInt(day.temperatura.maxima) || 0;
      const tempMin = parseInt(day.temperatura.minima) || 0;

      // Get dominant wind (first entry or midday period)
      const wind = day.viento?.[0];
      const windSpeed = parseInt(wind?.velocidad ?? "0") || 0;
      const windDir = windDirectionToCompass(wind?.direccion ?? "C");

      // Get snow line (first available value)
      const snowLine = day.cotaNieveProv?.find((c) => c.value)?.value;
      const snowLineMeter = parseInt(snowLine ?? "0") || 0;

      // Get cloud cover description
      const skyState = day.estadoCielo?.find((s) => s.descripcion)?.descripcion ?? "";
      const cloudCoverPct = skyState.toLowerCase().includes("despejado") ? 10
        : skyState.toLowerCase().includes("nuboso") ? 60
        : skyState.toLowerCase().includes("cubierto") ? 90
        : 40;

      // Estimate precipitation from probability
      const precipProb = parseInt(day.probPrecipitacion?.[0]?.value ?? "0") || 0;
      const precipMm = precipProb > 70 ? 10 : precipProb > 40 ? 3 : precipProb > 20 ? 1 : 0;

      // Estimate altitude temps (rough: -6.5°C per 1000m)
      const altRef = 2500;
      const altDiff = (altRef - 800) / 1000; // ~1700m above valley
      const tempAltMax = Math.round(tempMax - altDiff * 6.5);
      const tempAltMin = Math.round(tempMin - altDiff * 6.5);

      // Estimate freezing level from snow line + temps
      const freezingLevel = snowLineMeter > 0 ? snowLineMeter + 200 : Math.round(1000 + (tempMax + tempMin) / 2 * 150);

      // day.fecha may be "2026-04-09" or "2026-04-09T00:00:00"
      const dateStr = day.fecha.split("T")[0];

      return {
        zoneId: zone.id,
        validFrom: `${dateStr}T06:00:00Z`,
        validTo: `${dateStr}T23:59:59Z`,
        source: "aemet" as const,
        forecastData: {
          tempMin,
          tempMax,
          tempAltitudeMin: tempAltMin,
          tempAltitudeMax: tempAltMax,
          altitudeReference: altRef,
          precipitationMm: precipMm,
          snowLineMeter,
          windSpeedKmh: windSpeed,
          windDirection: windDir,
          cloudCoverPct,
          visibility: cloudCoverPct > 80 ? "poor" : cloudCoverPct > 50 ? "moderate" : "good",
          freezingLevelMeter: freezingLevel,
        },
        alertsJson: null,
        expiresAt,
      };
    });
  } catch (err) {
    console.error(`  AEMET fetch failed for ${zone.name}:`, err);
    return [];
  }
}

interface AemetAlert {
  tipo: string;
  nivel: string;
  fenomeno: string;
  texto: string;
  inicio: string;
  fin: string;
}

export async function fetchAemetAlertsForZone(
  zone: ZoneCoords
): Promise<Array<{ type: string; severity: string; message: string; validUntil: string }>> {
  const areaCode = ZONE_AREA_CODES[zone.slug];
  if (!areaCode) return [];

  try {
    const data = await aemetFetch(
      `${BASE_URL}/avisos/cap/area/${areaCode}`
    ) as AemetAlert[];

    if (!Array.isArray(data) || data.length === 0) return [];

    return data.map((alert) => ({
      type: mapAlertType(alert.fenomeno),
      severity: mapAlertSeverity(alert.nivel),
      message: alert.texto ?? alert.fenomeno,
      validUntil: alert.fin,
    }));
  } catch {
    // Alerts endpoint often returns empty/error when there are none
    return [];
  }
}

function mapAlertType(fenomeno: string): string {
  const f = fenomeno.toLowerCase();
  if (f.includes("viento")) return "wind";
  if (f.includes("nieve") || f.includes("nevada")) return "snow";
  if (f.includes("lluvia") || f.includes("precipitacion")) return "rain";
  if (f.includes("frío") || f.includes("temperatura")) return "cold";
  if (f.includes("tormenta")) return "storms";
  return "wind";
}

function mapAlertSeverity(nivel: string): string {
  const n = nivel.toLowerCase();
  if (n.includes("rojo") || n.includes("red")) return "red";
  if (n.includes("naranja") || n.includes("orange")) return "orange";
  return "yellow";
}
