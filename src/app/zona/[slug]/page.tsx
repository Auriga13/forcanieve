import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ZoneHeader } from "@/components/zone/ZoneHeader";
import { WeatherForecast } from "@/components/zone/WeatherForecast";
import { SnowPanel } from "@/components/zone/SnowPanel";
import { AvalanchePanel } from "@/components/zone/AvalanchePanel";
import { RouteList } from "@/components/zone/RouteList";
import {
  calculateRouteCondition,
  getSnowDepthAtAltitude,
} from "@/lib/routes/condition-engine";
import type { RouteWithCondition } from "@/types/route";
import type { Metadata } from "next";

export const revalidate = 1800;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: zone } = await supabase
    .from("zones")
    .select("name")
    .eq("slug", slug)
    .single();

  return {
    title: zone ? `${zone.name} — ForcaNieve` : "Zona — ForcaNieve",
  };
}

export default async function ZonePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch zone
  const { data: zone } = await supabase
    .from("zones")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!zone) notFound();

  // Fetch weather, snow, avalanche, routes, summary in parallel
  const [weatherResult, snowResult, avalancheResult, routesResult, summaryResult] =
    await Promise.all([
      supabase
        .from("weather_data")
        .select("*")
        .eq("zone_id", zone.id)
        .order("valid_from", { ascending: true })
        .limit(10),
      supabase
        .from("snow_data")
        .select("*")
        .eq("zone_id", zone.id)
        .order("observation_date", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("avalanche_data")
        .select("*")
        .eq("zone_id", zone.id)
        .order("valid_date", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("routes")
        .select("*")
        .eq("zone_id", zone.id)
        .eq("is_active", true)
        .order("altitude_max", { ascending: false }),
      supabase
        .from("llm_summaries")
        .select("content, generated_at")
        .eq("zone_id", zone.id)
        .eq("summary_type", "zone")
        .order("generated_at", { ascending: false })
        .limit(1)
        .single(),
    ]);

  const weatherRows = weatherResult.data ?? [];
  const snowRow = snowResult.data;
  const avalancheRow = avalancheResult.data;
  const routeRows = routesResult.data ?? [];

  // Build forecast arrays
  const forecast = weatherRows.slice(0, 4).map((row) => ({
    date: row.valid_from,
    tempMin: row.forecast_data.tempMin ?? 0,
    tempMax: row.forecast_data.tempMax ?? 0,
    tempAltitudeMin: row.forecast_data.tempAltitudeMin ?? 0,
    tempAltitudeMax: row.forecast_data.tempAltitudeMax ?? 0,
    altitudeReference: row.forecast_data.altitudeReference ?? 2500,
    precipitationMm: row.forecast_data.precipitationMm ?? 0,
    snowLineMeter: row.forecast_data.snowLineMeter ?? 0,
    windSpeedKmh: row.forecast_data.windSpeedKmh ?? 0,
    windDirection: row.forecast_data.windDirection ?? "",
    cloudCoverPct: row.forecast_data.cloudCoverPct ?? 0,
    freezingLevelMeter: row.forecast_data.freezingLevelMeter ?? 0,
  }));

  const trend7d = weatherRows.slice(4, 7).map((row) => ({
    date: row.valid_from,
    tendency: (row.forecast_data.precipitationMm > 5
      ? "worsening"
      : row.forecast_data.precipitationMm > 1
        ? "stable"
        : "improving") as "improving" | "stable" | "worsening",
    tempRange: `${row.forecast_data.tempMin ?? 0}°/${row.forecast_data.tempMax ?? 0}°`,
  }));

  // Calculate route conditions
  const routes: RouteWithCondition[] = routeRows.map((r) => {
    const snowDepthAtAltitude = getSnowDepthAtAltitude(
      snowRow?.depth_by_altitude ?? null,
      r.altitude_min,
      r.altitude_max
    );
    const condition = calculateRouteCondition({
      route: r,
      avalanche: avalancheRow
        ? { riskLevel: avalancheRow.risk_level, trend: avalancheRow.trend }
        : null,
      snowDepthAtAltitude,
      weather: weatherRows[0]
        ? {
            windSpeedKmh: weatherRows[0].forecast_data.windSpeedKmh ?? 0,
            alertSeverity: weatherRows[0].alerts_json?.[0]?.severity ?? null,
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

  return (
    <>
      <ZoneHeader
        name={zone.name}
        imageUrl={zone.image_url}
        summary={summaryResult.data?.content ?? null}
        updatedAt={summaryResult.data?.generated_at ?? null}
      />

      <div className="container mx-auto px-4 py-8 space-y-6">
        {forecast.length > 0 && (
          <WeatherForecast forecast={forecast} trend7d={trend7d} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {snowRow && (
            <SnowPanel
              snow={{
                depthByAltitude: snowRow.depth_by_altitude ?? {},
                snowfall24h: snowRow.snowfall_24h_cm,
                snowfall48h: snowRow.snowfall_48h_cm,
                snowfall7d: snowRow.snowfall_7d_cm,
                lastUpdated: snowRow.fetched_at,
              }}
            />
          )}

          {avalancheRow && (
            <AvalanchePanel
              avalanche={{
                riskLevel: avalancheRow.risk_level,
                trend: avalancheRow.trend,
                bulletinSummary: avalancheRow.bulletin_summary ?? "",
                bulletinUrl: avalancheRow.bulletin_url ?? "",
                validDate: avalancheRow.valid_date,
                lastUpdated: avalancheRow.fetched_at,
              }}
            />
          )}
        </div>

        <RouteList routes={routes} />
      </div>
    </>
  );
}
