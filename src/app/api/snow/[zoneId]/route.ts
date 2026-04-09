import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  calculateRouteCondition,
  getSnowDepthAtAltitude,
} from "@/lib/routes/condition-engine";
import type { SnowApiResponse } from "@/types/api";
import type { RouteWithCondition } from "@/types/route";

export const revalidate = 1800;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ zoneId: string }> }
) {
  try {
    const { zoneId } = await params;
    const supabase = await createServerSupabaseClient();

    // Fetch zone info
    const { data: zone, error: zoneError } = await supabase
      .from("zones")
      .select("id, name, slug")
      .eq("id", zoneId)
      .single();

    if (zoneError || !zone) {
      return NextResponse.json(
        { error: "Zona no encontrada" },
        { status: 404 }
      );
    }

    // Fetch latest snow data
    const { data: snowRow } = await supabase
      .from("snow_data")
      .select("*")
      .eq("zone_id", zoneId)
      .order("observation_date", { ascending: false })
      .limit(1)
      .single();

    // Fetch latest avalanche data
    const { data: avalancheRow } = await supabase
      .from("avalanche_data")
      .select("*")
      .eq("zone_id", zoneId)
      .order("valid_date", { ascending: false })
      .limit(1)
      .single();

    // Fetch latest weather for wind/alerts (for condition engine)
    const { data: weatherRow } = await supabase
      .from("weather_data")
      .select("forecast_data, alerts_json")
      .eq("zone_id", zoneId)
      .order("valid_from", { ascending: false })
      .limit(1)
      .single();

    // Fetch active routes for this zone
    const { data: routeRows } = await supabase
      .from("routes")
      .select("*")
      .eq("zone_id", zoneId)
      .eq("is_active", true)
      .order("altitude_max", { ascending: false });

    // Calculate conditions for each route
    const routes: RouteWithCondition[] = (routeRows ?? []).map((r) => {
      const snowDepthAtAltitude = getSnowDepthAtAltitude(
        snowRow?.depth_by_altitude ?? null,
        r.altitude_min,
        r.altitude_max
      );

      const alertSeverity =
        weatherRow?.alerts_json?.[0]?.severity ?? null;

      const condition = calculateRouteCondition({
        route: r,
        avalanche: avalancheRow
          ? { riskLevel: avalancheRow.risk_level, trend: avalancheRow.trend }
          : null,
        snowDepthAtAltitude,
        weather: weatherRow
          ? {
              windSpeedKmh: weatherRow.forecast_data.windSpeedKmh ?? 0,
              alertSeverity,
            }
          : null,
      });

      return {
        id: r.id,
        zoneId: r.zone_id,
        name: r.name,
        difficulty: r.difficulty,
        activityType: r.activity_type,
        altitudeMin: r.altitude_min,
        altitudeMax: r.altitude_max,
        altitudeGain: r.altitude_gain,
        description: r.description,
        coordinates: r.coordinates,
        aspects: r.aspects,
        season: r.season,
        isActive: r.is_active,
        conditionBadge: condition.badge,
        conditionReason: condition.reason,
      };
    });

    const response: SnowApiResponse = {
      zone: { id: zone.id, name: zone.name, slug: zone.slug },
      snow: {
        depthByAltitude: snowRow?.depth_by_altitude ?? {},
        snowfall24h: snowRow?.snowfall_24h_cm ?? null,
        snowfall48h: snowRow?.snowfall_48h_cm ?? null,
        snowfall7d: snowRow?.snowfall_7d_cm ?? null,
        lastUpdated: snowRow?.fetched_at ?? new Date().toISOString(),
      },
      avalanche: avalancheRow
        ? {
            riskLevel: avalancheRow.risk_level,
            trend: avalancheRow.trend,
            bulletinSummary: avalancheRow.bulletin_summary ?? "",
            bulletinUrl: avalancheRow.bulletin_url ?? "",
            validDate: avalancheRow.valid_date,
            lastUpdated: avalancheRow.fetched_at,
          }
        : null,
      routes,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("Unhandled error in /api/snow:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
