import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { WeatherResponse, DayForecast, TrendDay } from "@/types/weather";

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

    // Fetch weather data (latest 4 days + 7 day trend)
    const { data: weatherRows } = await supabase
      .from("weather_data")
      .select("*")
      .eq("zone_id", zoneId)
      .order("valid_from", { ascending: true })
      .limit(10);

    const forecast: DayForecast[] = (weatherRows ?? []).slice(0, 4).map((row) => ({
      date: row.valid_from,
      tempMin: row.forecast_data.tempMin,
      tempMax: row.forecast_data.tempMax,
      tempAltitudeMin: row.forecast_data.tempAltitudeMin,
      tempAltitudeMax: row.forecast_data.tempAltitudeMax,
      altitudeReference: row.forecast_data.altitudeReference,
      precipitationMm: row.forecast_data.precipitationMm,
      snowLineMeter: row.forecast_data.snowLineMeter,
      windSpeedKmh: row.forecast_data.windSpeedKmh,
      windDirection: row.forecast_data.windDirection,
      cloudCoverPct: row.forecast_data.cloudCoverPct,
      freezingLevelMeter: row.forecast_data.freezingLevelMeter,
    }));

    // Days 5-7 as simplified trend
    const trend7d: TrendDay[] = (weatherRows ?? []).slice(4, 7).map((row) => ({
      date: row.valid_from,
      tendency: row.forecast_data.precipitationMm > 5
        ? "worsening"
        : row.forecast_data.precipitationMm > 1
          ? "stable"
          : "improving",
      tempRange: `${row.forecast_data.tempMin}°/${row.forecast_data.tempMax}°`,
    }));

    // Latest alerts
    const latestWithAlerts = (weatherRows ?? []).find((r) => r.alerts_json);
    const alerts = latestWithAlerts?.alerts_json ?? null;

    const lastUpdated = weatherRows?.[0]?.fetched_at ?? new Date().toISOString();

    return NextResponse.json<WeatherResponse>({
      zone: { id: zone.id, name: zone.name, slug: zone.slug },
      forecast,
      trend7d,
      alerts,
      lastUpdated,
    });
  } catch (err) {
    console.error("Unhandled error in /api/weather:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
