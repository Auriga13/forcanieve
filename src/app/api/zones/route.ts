import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ZonesApiResponse } from "@/types/api";
import type { ZoneSummary } from "@/types/zone";

export const revalidate = 1800; // ISR: 30 minutes

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("zone_latest_data")
      .select("*")
      .order("sort_order");

    if (error) {
      console.error("Error fetching zones:", error);
      return NextResponse.json(
        { error: "Error al obtener las zonas" },
        { status: 500 }
      );
    }

    const zones: ZoneSummary[] = (data ?? []).map((row) => ({
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

    return NextResponse.json<ZonesApiResponse>({ zones });
  } catch (err) {
    console.error("Unhandled error in /api/zones:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
