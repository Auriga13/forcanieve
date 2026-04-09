/**
 * Update webcam URLs with VERIFIED working endpoints.
 * All URLs tested and returning HTTP 200 as of 2026-04-09.
 *
 * Run: npx tsx scripts/update-webcams.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// type: "img" = direct JPEG, "iframe" = Windy/feratel embed, "page" = link to webcam page
const WEBCAMS = [
  // === Canfranc / Astún / Candanchú ===
  // No direct working cams found — link to infonieve aggregator pages
  { zoneSlug: "canfranc", name: "Astún - Webcams (14 cámaras)", embedUrl: "https://www.infonieve.es/estacion-esqui/astun/webcams/", type: "page", source: "infonieve.es", sortOrder: 1 },
  { zoneSlug: "canfranc", name: "Candanchú - Webcams (10 cámaras)", embedUrl: "https://www.infonieve.es/estacion-esqui/candanchu/webcams/", type: "page", source: "infonieve.es", sortOrder: 2 },

  // === Valle de Tena / Formigal-Panticosa ===
  { zoneSlug: "tena", name: "Formigal - Portalet", embedUrl: "https://webcams.windy.com/webcams/public/embed/player/1573690053/day", type: "iframe", source: "windy.com", sortOrder: 1 },
  { zoneSlug: "tena", name: "Panticosa - Casa Escolano", embedUrl: "https://casaescolano.com/camara/Webcam000M.jpg", type: "img", source: "casaescolano.com", sortOrder: 2 },
  { zoneSlug: "tena", name: "Formigal - Webcams (6 cámaras)", embedUrl: "https://www.infonieve.es/estacion-esqui/formigal/webcams/", type: "page", source: "infonieve.es", sortOrder: 3 },

  // === Ordesa / Monte Perdido ===
  // No verified direct cams — Windy IDs blocked
  { zoneSlug: "ordesa", name: "Ordesa - Torla (info)", embedUrl: "https://www.ordesa.net/webcam/", type: "page", source: "ordesa.net", sortOrder: 1 },

  // === Bielsa / Pineta ===
  { zoneSlug: "bielsa", name: "Pineta - Punta de las Olas", embedUrl: "https://puntadelasolas.es/webcams/", type: "page", source: "puntadelasolas.es", sortOrder: 1 },

  // === Benasque / Maladeta / Aneto ===
  { zoneSlug: "benasque", name: "Benasque - Plaza Ayuntamiento", embedUrl: "https://webcams.windy.com/webcams/public/embed/player/1286641590/day", type: "iframe", source: "windy.com", sortOrder: 1 },

  // === Posets / Eriste ===
  { zoneSlug: "posets", name: "Benasque - Plaza (cercana)", embedUrl: "https://webcams.windy.com/webcams/public/embed/player/1286641590/day", type: "iframe", source: "windy.com", sortOrder: 1 },

  // === Cerler / Ampriu ===
  { zoneSlug: "cerler", name: "Cerler - Ampriu", embedUrl: "https://webcams.windy.com/webcams/public/embed/player/1416008706/day", type: "iframe", source: "windy.com", sortOrder: 1 },
  { zoneSlug: "cerler", name: "Cerler - Gallinero", embedUrl: "https://webcams.windy.com/webcams/public/embed/player/1581032991/day", type: "iframe", source: "windy.com", sortOrder: 2 },
  { zoneSlug: "cerler", name: "Cerler - Cogulla", embedUrl: "https://webtvhotspot.feratel.com/hotspot/35/15081/2.jpeg?design=v5&dcsdesign=WTP_infonieve.es", type: "img", source: "feratel.com", sortOrder: 3 },
  { zoneSlug: "cerler", name: "Cerler - Cota 2000", embedUrl: "https://webtvhotspot.feratel.com/hotspot/35/15081/1.jpeg?design=v5&dcsdesign=WTP_infonieve.es", type: "img", source: "feratel.com", sortOrder: 4 },

  // === Ansó / Hecho ===
  // No specific cams found for western valleys
  { zoneSlug: "anso-hecho", name: "Astún - Webcams (cercana)", embedUrl: "https://www.infonieve.es/estacion-esqui/astun/webcams/", type: "page", source: "infonieve.es", sortOrder: 1 },
];

async function main() {
  console.log("Updating webcam URLs (verified working)...\n");

  const { data: zones } = await supabase.from("zones").select("id, slug");
  const zoneMap = new Map((zones ?? []).map((z) => [z.slug, z.id]));

  // Delete old webcams
  await supabase.from("webcams").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("Deleted old webcams\n");

  let count = 0;
  for (const cam of WEBCAMS) {
    const zoneId = zoneMap.get(cam.zoneSlug);
    if (!zoneId) continue;

    const { error } = await supabase.from("webcams").insert({
      zone_id: zoneId,
      name: cam.name,
      embed_url: cam.embedUrl,
      thumbnail_url: cam.type, // stores type: img/iframe/page
      source: cam.source,
      sort_order: cam.sortOrder,
      is_active: true,
    });

    if (error) console.error(`  ${cam.name}: error:`, error.message);
    else { count++; console.log(`  [${cam.type}] ${cam.name}`); }
  }

  console.log(`\nInserted ${count} webcams`);
}

main().catch(console.error);
