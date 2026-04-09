/**
 * Data pipeline orchestrator — fetches from external sources,
 * stores in Supabase, and optionally generates LLM summaries.
 *
 * Run: npx tsx scripts/fetch-all-data.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { fetchWeatherForZone, fetchSnowForZone } from "../src/lib/data-sources/open-meteo";
import type { ZoneCoords } from "../src/lib/data-sources/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("=== ForcaNieve Data Pipeline ===");
  console.log(`Started at: ${new Date().toISOString()}\n`);

  // Step 1: Get all zones
  const { data: zones, error: zonesError } = await supabase
    .from("zones")
    .select("id, name, slug, lat, lng");

  if (zonesError || !zones?.length) {
    console.error("No zones found:", zonesError);
    process.exit(1);
  }
  console.log(`Found ${zones.length} zones\n`);

  // Step 2: Fetch weather from Open-Meteo (parallel)
  console.log("--- Fetching Open-Meteo weather ---");
  let weatherCount = 0;
  const weatherPromises = zones.map(async (zone: ZoneCoords) => {
    try {
      const forecasts = await fetchWeatherForZone(zone);
      if (forecasts.length === 0) {
        console.log(`  ${zone.name}: no data`);
        return;
      }

      // Insert into Supabase
      const rows = forecasts.map((f) => ({
        zone_id: f.zoneId,
        valid_from: f.validFrom,
        valid_to: f.validTo,
        source: f.source,
        forecast_data: f.forecastData,
        alerts_json: f.alertsJson,
        expires_at: f.expiresAt,
      }));

      const { error } = await supabase.from("weather_data").insert(rows);
      if (error) {
        console.error(`  ${zone.name}: insert error:`, error.message);
      } else {
        weatherCount += rows.length;
        console.log(`  ${zone.name}: ${rows.length} forecast days stored`);
      }
    } catch (err) {
      console.error(`  ${zone.name}: fetch failed:`, err);
    }
  });

  await Promise.all(weatherPromises);
  console.log(`Total weather records: ${weatherCount}\n`);

  // Step 3: Fetch snow data (parallel)
  console.log("--- Fetching Open-Meteo snow ---");
  let snowCount = 0;
  const snowPromises = zones.map(async (zone: ZoneCoords) => {
    try {
      const snow = await fetchSnowForZone(zone);
      if (!snow) {
        console.log(`  ${zone.name}: no snow data`);
        return;
      }

      const { error } = await supabase.from("snow_data").insert({
        zone_id: snow.zoneId,
        observation_date: snow.observationDate,
        source: snow.source,
        depth_by_altitude: snow.depthByAltitude,
        snowfall_24h_cm: snow.snowfall24hCm,
        snowfall_48h_cm: snow.snowfall48hCm,
        snowfall_7d_cm: snow.snowfall7dCm,
        expires_at: snow.expiresAt,
      });

      if (error) {
        console.error(`  ${zone.name}: insert error:`, error.message);
      } else {
        snowCount++;
        const depths = Object.entries(snow.depthByAltitude)
          .map(([alt, d]) => `${alt}m:${d}cm`)
          .join(", ");
        console.log(`  ${zone.name}: ${depths}`);
      }
    } catch (err) {
      console.error(`  ${zone.name}: snow fetch failed:`, err);
    }
  });

  await Promise.all(snowPromises);
  console.log(`Total snow records: ${snowCount}\n`);

  // Step 4: Generate LLM summaries (if Claude API key available)
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "your_anthropic_api_key_here") {
    console.log("--- Generating LLM summaries ---");
    try {
      const { generateSummary } = await import("../src/lib/llm/client");
      const { sanitizeLlmOutput } = await import("../src/lib/llm/sanitize");
      const { SYSTEM_PROMPT, homepagePrompt, zonePrompt } = await import("../src/lib/llm/prompts");

      // Gather latest data for all zones
      const { data: latestData } = await supabase
        .from("zone_latest_data")
        .select("*");

      // Homepage summary
      const homepageSummary = await generateSummary(
        SYSTEM_PROMPT,
        homepagePrompt(Object.fromEntries(
          (latestData ?? []).map((z) => [z.name, { weather: z.weather, snow_depth: z.snow_depth, avalanche_risk: z.avalanche_risk }])
        ))
      );

      await supabase.from("llm_summaries").insert({
        zone_id: null,
        summary_type: "homepage",
        content: sanitizeLlmOutput(homepageSummary),
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      });
      console.log(`  Homepage summary: "${homepageSummary.slice(0, 80)}..."`);

      // Zone summaries
      for (const zone of latestData ?? []) {
        const summary = await generateSummary(
          SYSTEM_PROMPT,
          zonePrompt(zone.name, {
            weather: zone.weather,
            snow_depth: zone.snow_depth,
            avalanche_risk: zone.avalanche_risk,
          })
        );

        await supabase.from("llm_summaries").insert({
          zone_id: zone.zone_id,
          summary_type: "zone",
          content: sanitizeLlmOutput(summary),
          generated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        });
        console.log(`  ${zone.name}: "${summary.slice(0, 60)}..."`);
      }
    } catch (err) {
      console.error("LLM generation failed (non-fatal):", err);
    }
  } else {
    console.log("--- Skipping LLM summaries (no ANTHROPIC_API_KEY) ---");
  }

  console.log(`\n=== Pipeline complete at ${new Date().toISOString()} ===`);
}

main().catch((err) => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});
