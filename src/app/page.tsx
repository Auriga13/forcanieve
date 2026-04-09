import { createServerSupabaseClient } from "@/lib/supabase/server";
import { HeroSummary } from "@/components/home/HeroSummary";
import { ZoneCardGrid } from "@/components/home/ZoneCardGrid";
import type { ZoneSummary } from "@/types/zone";

export const dynamic = "force-dynamic";
export const revalidate = 1800; // ISR: 30 minutes

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  // Fetch zones with latest data
  const { data: zoneRows } = await supabase
    .from("zone_latest_data")
    .select("*")
    .order("sort_order");

  const zones: ZoneSummary[] = (zoneRows ?? []).map((row) => ({
    id: row.zone_id,
    name: row.name,
    slug: row.slug,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
    weather: row.weather ?? null,
    alerts: row.alerts ?? null,
    snowDepth: row.snow_depth ?? null,
    snowfall24h: row.snowfall_24h ?? null,
    avalancheRisk: row.avalanche_risk ?? null,
    avalancheTrend: row.avalanche_trend ?? null,
    avalancheSummary: row.avalanche_summary ?? null,
    llmSummary: row.llm_summary ?? null,
    summaryUpdatedAt: row.summary_updated_at ?? null,
  }));

  // Fetch homepage LLM summary
  const { data: summaryRow } = await supabase
    .from("llm_summaries")
    .select("content, generated_at")
    .eq("summary_type", "homepage")
    .is("zone_id", null)
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  return (
    <>
      <HeroSummary
        summary={summaryRow?.content ?? null}
        updatedAt={summaryRow?.generated_at ?? null}
        imageUrl="https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=80"
      />

      <div id="mapa" className="container mx-auto px-4 py-10">
        <div className="rounded-2xl border bg-gray-50 p-8 text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">Mapa interactivo</p>
          <p className="text-sm">
            El mapa con las zonas del Pirineo se integrará con Mapbox/Leaflet.
            Por ahora, explora las zonas con las tarjetas de abajo.
          </p>
        </div>
      </div>

      <ZoneCardGrid zones={zones} />
    </>
  );
}
