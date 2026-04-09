/**
 * Update webcam URLs with real working endpoints.
 * Run: npx tsx scripts/update-webcams.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// type: "img" = direct JPEG refresh, "iframe" = Windy embed player
const WEBCAMS = [
  // Canfranc / Astún — direct JPEG (astuncandanchu.com)
  { zoneSlug: "canfranc", name: "Astún - Canal Roya", embedUrl: "https://astuncandanchu.com/camara/canalroya.jpg", type: "img", source: "astuncandanchu.com", sortOrder: 1 },
  { zoneSlug: "canfranc", name: "Astún - Truchas", embedUrl: "https://astuncandanchu.com/camara/truchas.jpg", type: "img", source: "astuncandanchu.com", sortOrder: 2 },
  { zoneSlug: "canfranc", name: "Astún - Cima Raca", embedUrl: "https://astuncandanchu.com/camara/cimaraca.jpg", type: "img", source: "astuncandanchu.com", sortOrder: 3 },
  { zoneSlug: "canfranc", name: "Candanchú", embedUrl: "https://webcams.windy.com/webcams/public/embed/player/1265992381/day", type: "iframe", source: "windy.com", sortOrder: 4 },
  // Valle de Tena — Windy embeds
  { zoneSlug: "tena", name: "Formigal - Portalet", embedUrl: "https://webcams.windy.com/webcams/public/embed/player/1573690053/day", type: "iframe", source: "windy.com", sortOrder: 1 },
  { zoneSlug: "tena", name: "Formigal - Anayet", embedUrl: "https://webcams.windy.com/webcams/public/embed/player/1234689983/day", type: "iframe", source: "windy.com", sortOrder: 2 },
  { zoneSlug: "tena", name: "Panticosa - Valle", embedUrl: "https://webcams.windy.com/webcams/public/embed/player/1264356344/day", type: "iframe", source: "windy.com", sortOrder: 3 },
  // Ordesa — Windy embeds
  { zoneSlug: "ordesa", name: "Ordesa - Parque Nacional", embedUrl: "https://webcams.windy.com/webcams/public/embed/player/1659037142/day", type: "iframe", source: "windy.com", sortOrder: 1 },
  { zoneSlug: "ordesa", name: "Torla - Norte", embedUrl: "https://webcams.windy.com/webcams/public/embed/player/1655128751/day", type: "iframe", source: "windy.com", sortOrder: 2 },
  // Bielsa — limited coverage, use nearby Ordesa cam
  { zoneSlug: "bielsa", name: "Ordesa - Camping", embedUrl: "https://webcams.windy.com/webcams/public/embed/player/1716281982/day", type: "iframe", source: "windy.com", sortOrder: 1 },
  // Benasque — Windy embeds
  { zoneSlug: "benasque", name: "Benasque - Plaza", embedUrl: "https://webcams.windy.com/webcams/public/embed/player/1286641590/day", type: "iframe", source: "windy.com", sortOrder: 1 },
  { zoneSlug: "benasque", name: "Llanos del Hospital", embedUrl: "https://webcams.windy.com/webcams/public/embed/player/1193073269/day", type: "iframe", source: "windy.com", sortOrder: 2 },
  { zoneSlug: "benasque", name: "Benasque - Hostal Parque", embedUrl: "https://webcams.windy.com/webcams/public/embed/player/1505286619/day", type: "iframe", source: "windy.com", sortOrder: 3 },
  // Posets — use Benasque area cam
  { zoneSlug: "posets", name: "Benasque - Hostal Parque", embedUrl: "https://webcams.windy.com/webcams/public/embed/player/1505286619/day", type: "iframe", source: "windy.com", sortOrder: 1 },
  // Cerler — Windy embeds
  { zoneSlug: "cerler", name: "Cerler - Ampriu", embedUrl: "https://webcams.windy.com/webcams/public/embed/player/1416008706/day", type: "iframe", source: "windy.com", sortOrder: 1 },
  { zoneSlug: "cerler", name: "Cerler - Gallinero", embedUrl: "https://webcams.windy.com/webcams/public/embed/player/1581032991/day", type: "iframe", source: "windy.com", sortOrder: 2 },
  // Ansó/Hecho — no specific cam found, placeholder
  { zoneSlug: "anso-hecho", name: "Astún - Prado Blanco", embedUrl: "https://astuncandanchu.com/camara/pradoblanco.jpg", type: "img", source: "astuncandanchu.com", sortOrder: 1 },
];

async function main() {
  console.log("Updating webcam URLs...\n");

  const { data: zones } = await supabase.from("zones").select("id, slug");
  const zoneMap = new Map((zones ?? []).map((z) => [z.slug, z.id]));

  // Delete old webcams
  const { error: delError } = await supabase.from("webcams").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delError) console.error("Delete error:", delError.message);
  else console.log("Deleted old webcams");

  let count = 0;
  for (const cam of WEBCAMS) {
    const zoneId = zoneMap.get(cam.zoneSlug);
    if (!zoneId) continue;

    const { error } = await supabase.from("webcams").insert({
      zone_id: zoneId,
      name: cam.name,
      embed_url: cam.embedUrl,
      thumbnail_url: cam.type, // reuse field to store type (img/iframe)
      source: cam.source,
      sort_order: cam.sortOrder,
      is_active: true,
    });

    if (error) console.error(`  ${cam.name}: error:`, error.message);
    else { count++; console.log(`  ${cam.name} (${cam.type})`); }
  }

  console.log(`\nInserted ${count} webcams across ${new Set(WEBCAMS.map(w => w.zoneSlug)).size} zones`);
}

main().catch(console.error);
