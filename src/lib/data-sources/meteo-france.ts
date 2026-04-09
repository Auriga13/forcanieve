/**
 * Meteo-France BRA (Bulletin de Risque d'Avalanche) parser.
 * Fetches avalanche risk bulletins for Pyrenees massifs.
 *
 * BRA bulletins are published Nov-June, updated daily at ~16:00.
 * Data is in XML format from Meteo-France public data portal.
 *
 * Massif mapping to our zones:
 *   - ASPE-OSSAU → Ansó/Hecho, Canfranc
 *   - HAUTE-BIGORRE → Tena
 *   - AURE-LOURON → Ordesa, Bielsa
 *   - LUCHONNAIS → Benasque, Posets, Cerler
 */

import type { ZoneCoords } from "./types";

// BRA massif IDs for Pyrenees (Meteo-France codes)
const ZONE_MASSIF_MAP: Record<string, string> = {
  "anso-hecho": "ASPE_OSSAU",
  "canfranc": "ASPE_OSSAU",
  "tena": "HAUTE_BIGORRE",
  "ordesa": "AURE_LOURON",
  "bielsa": "AURE_LOURON",
  "benasque": "LUCHONNAIS",
  "posets": "LUCHONNAIS",
  "cerler": "LUCHONNAIS",
};

// Meteo-France BRA API endpoint
const BRA_BASE_URL = "https://donneespubliques.meteofrance.fr/donnees_libres/Pdf/BRA";

export interface AvalancheBulletin {
  zoneId: string;
  validDate: string;
  source: "meteo_france_bra";
  riskLevel: number;
  trend: "rising" | "stable" | "falling";
  rawContent: string;
  bulletinUrl: string;
  expiresAt: string;
}

/**
 * Fetch avalanche bulletins for all zones.
 * Since BRA is published as PDF/XML per massif, we fetch unique massifs
 * and map them back to our zones.
 */
export async function fetchAvalancheForZone(
  zone: ZoneCoords
): Promise<AvalancheBulletin | null> {
  const massif = ZONE_MASSIF_MAP[zone.slug];
  if (!massif) {
    console.log(`  BRA: No massif mapping for ${zone.slug}`);
    return null;
  }

  try {
    // Try to fetch the BRA page for this massif
    // Meteo-France publishes BRAs as PDFs, but also has a JSON API
    const apiUrl = `https://donneespubliques.meteofrance.fr/donnees_libres/Pdf/BRA/BRA.${massif}.json`;

    const res = await fetch(apiUrl, {
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) {
      // BRA might not be available (summer season, or API format changed)
      if (res.status === 404) {
        console.log(`  BRA: No bulletin for ${massif} (likely off-season)`);
        return null;
      }
      console.log(`  BRA: HTTP ${res.status} for ${massif}`);
      return null;
    }

    const data = await res.json();
    return parseBraResponse(zone.id, massif, data);
  } catch {
    // If the JSON endpoint doesn't work, try the alternative approach
    // by scraping the risk level from the summary page
    return fetchBraFallback(zone, massif);
  }
}

function parseBraResponse(
  zoneId: string,
  massif: string,
  data: Record<string, unknown>
): AvalancheBulletin | null {
  try {
    // BRA JSON structure varies — extract what we can
    const riskLevel = typeof data.risque === "number" ? data.risque
      : typeof data.risk_level === "number" ? data.risk_level
      : null;

    if (riskLevel === null || riskLevel < 1 || riskLevel > 5) return null;

    let trend: "rising" | "stable" | "falling" = "stable";
    if (typeof data.evolution === "string") {
      if (data.evolution.includes("hausse")) trend = "rising";
      else if (data.evolution.includes("baisse")) trend = "falling";
    }

    const rawContent = typeof data.texte === "string" ? data.texte
      : typeof data.bulletin_text === "string" ? data.bulletin_text
      : JSON.stringify(data);

    return {
      zoneId,
      validDate: new Date().toISOString().split("T")[0],
      source: "meteo_france_bra",
      riskLevel,
      trend,
      rawContent,
      bulletinUrl: `${BRA_BASE_URL}/BRA.${massif}.pdf`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}

async function fetchBraFallback(
  zone: ZoneCoords,
  massif: string
): Promise<AvalancheBulletin | null> {
  // Fallback: try to get risk level from Meteo-France's simplified endpoint
  try {
    const url = `https://donneespubliques.meteofrance.fr/donnees_libres/Pdf/BRA/risques_${massif}.json`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const riskLevel = Number(data?.risque ?? data?.risk ?? 0);
    if (riskLevel < 1 || riskLevel > 5) return null;

    return {
      zoneId: zone.id,
      validDate: new Date().toISOString().split("T")[0],
      source: "meteo_france_bra",
      riskLevel,
      trend: "stable",
      rawContent: JSON.stringify(data),
      bulletinUrl: `${BRA_BASE_URL}/BRA.${massif}.pdf`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  } catch {
    console.log(`  BRA fallback: No data for ${massif}`);
    return null;
  }
}
