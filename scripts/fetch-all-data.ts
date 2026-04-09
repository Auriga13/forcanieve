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
import { fetchAemetWeatherForZone, fetchAemetAlertsForZone } from "../src/lib/data-sources/aemet";
import { fetchAvalancheForZone } from "../src/lib/data-sources/meteo-france";
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

  // Step 3b: Fetch AEMET weather (if API key available)
  const hasAemet = process.env.AEMET_API_KEY && process.env.AEMET_API_KEY !== "your_aemet_api_key_here";
  if (hasAemet) {
    console.log("--- Fetching AEMET weather ---");
    let aemetCount = 0;
    for (const zone of zones as ZoneCoords[]) {
      try {
        const forecasts = await fetchAemetWeatherForZone(zone);
        if (forecasts.length === 0) continue;

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
          aemetCount += rows.length;
          console.log(`  ${zone.name}: ${rows.length} AEMET forecast days`);
        }

        // Fetch alerts
        const alerts = await fetchAemetAlertsForZone(zone);
        if (alerts.length > 0) {
          // Update the latest weather row with alerts
          const { data: latestWeather } = await supabase
            .from("weather_data")
            .select("id")
            .eq("zone_id", zone.id)
            .eq("source", "aemet")
            .order("valid_from", { ascending: false })
            .limit(1)
            .single();

          if (latestWeather) {
            await supabase
              .from("weather_data")
              .update({ alerts_json: alerts })
              .eq("id", latestWeather.id);
            console.log(`  ${zone.name}: ${alerts.length} alert(s)`);
          }
        }
      } catch (err) {
        console.error(`  ${zone.name}: AEMET failed:`, err);
      }
      // Small delay to respect AEMET rate limits
      await new Promise((r) => setTimeout(r, 500));
    }
    console.log(`Total AEMET records: ${aemetCount}\n`);
  } else {
    console.log("--- Skipping AEMET (no API key) ---\n");
  }

  // Step 3c: Fetch avalanche bulletins (Meteo-France BRA)
  console.log("--- Fetching Meteo-France BRA ---");
  let avalancheCount = 0;
  const fetchedMassifs = new Set<string>();
  for (const zone of zones as ZoneCoords[]) {
    try {
      const bulletin = await fetchAvalancheForZone(zone);
      if (!bulletin) continue;

      // Avoid duplicate inserts for same massif
      const key = `${bulletin.riskLevel}-${zone.slug}`;
      if (fetchedMassifs.has(key)) continue;
      fetchedMassifs.add(key);

      const { error } = await supabase.from("avalanche_data").insert({
        zone_id: bulletin.zoneId,
        valid_date: bulletin.validDate,
        source: bulletin.source,
        risk_level: bulletin.riskLevel,
        trend: bulletin.trend,
        bulletin_summary: null, // Will be filled by LLM
        bulletin_url: bulletin.bulletinUrl,
        raw_bulletin: { content: bulletin.rawContent },
        expires_at: bulletin.expiresAt,
      });

      if (error) {
        console.error(`  ${zone.name}: insert error:`, error.message);
      } else {
        avalancheCount++;
        console.log(`  ${zone.name}: Risk level ${bulletin.riskLevel}`);
      }
    } catch (err) {
      console.error(`  ${zone.name}: BRA failed:`, err);
    }
  }
  console.log(`Total avalanche records: ${avalancheCount}\n`);

  // Step 4: Generate LLM summaries (if Claude API key available)
  // COST GUARD: Only regenerate if existing summaries have expired.
  // Summaries are set to expire after 12 hours. If a valid summary exists,
  // we skip the LLM call entirely — this caps Claude API usage to ~2 calls/day
  // per zone regardless of how often the pipeline runs.
  const LLM_TTL_HOURS = 12;

  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "your_groq_api_key_here") {
    console.log("--- LLM Summaries (cost-guarded) ---");

    // Check if homepage summary is still valid
    const { data: existingHomepage } = await supabase
      .from("llm_summaries")
      .select("id, expires_at")
      .eq("summary_type", "homepage")
      .is("zone_id", null)
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    const homepageExpired = !existingHomepage || new Date(existingHomepage.expires_at) < new Date();

    if (!homepageExpired) {
      console.log("  Homepage summary still valid — skipping LLM call");
    } else {
      try {
        const { generateSummary } = await import("../src/lib/llm/client");
        const { sanitizeLlmOutput } = await import("../src/lib/llm/sanitize");
        const { SYSTEM_PROMPT, homepagePrompt } = await import("../src/lib/llm/prompts");

        const { data: latestData } = await supabase
          .from("zone_latest_data")
          .select("*");

        const homepageSummary = await generateSummary(
          SYSTEM_PROMPT,
          homepagePrompt(Object.fromEntries(
            (latestData ?? []).map((z) => [z.name, { weather: z.weather, snow_depth: z.snow_depth, avalanche_risk: z.avalanche_risk }])
          ))
        );

        const expiresAt = new Date(Date.now() + LLM_TTL_HOURS * 60 * 60 * 1000).toISOString();
        await supabase.from("llm_summaries").insert({
          zone_id: null,
          summary_type: "homepage",
          content: sanitizeLlmOutput(homepageSummary),
          generated_at: new Date().toISOString(),
          expires_at: expiresAt,
        });
        console.log(`  Homepage: GENERATED (expires in ${LLM_TTL_HOURS}h)`);
        console.log(`    "${homepageSummary.slice(0, 80)}..."`);
      } catch (err) {
        console.error("  Homepage LLM failed (non-fatal):", err);
      }
    }

    // Zone summaries — only regenerate expired ones
    const { data: latestData } = await supabase
      .from("zone_latest_data")
      .select("*");

    for (const zone of latestData ?? []) {
      const { data: existingZone } = await supabase
        .from("llm_summaries")
        .select("id, expires_at")
        .eq("summary_type", "zone")
        .eq("zone_id", zone.zone_id)
        .order("generated_at", { ascending: false })
        .limit(1)
        .single();

      const zoneExpired = !existingZone || new Date(existingZone.expires_at) < new Date();

      if (!zoneExpired) {
        console.log(`  ${zone.name}: still valid — skipped`);
        continue;
      }

      try {
        const { generateSummary } = await import("../src/lib/llm/client");
        const { sanitizeLlmOutput } = await import("../src/lib/llm/sanitize");
        const { SYSTEM_PROMPT, zonePrompt } = await import("../src/lib/llm/prompts");

        const summary = await generateSummary(
          SYSTEM_PROMPT,
          zonePrompt(zone.name, {
            weather: zone.weather,
            snow_depth: zone.snow_depth,
            avalanche_risk: zone.avalanche_risk,
          })
        );

        const expiresAt = new Date(Date.now() + LLM_TTL_HOURS * 60 * 60 * 1000).toISOString();
        await supabase.from("llm_summaries").insert({
          zone_id: zone.zone_id,
          summary_type: "zone",
          content: sanitizeLlmOutput(summary),
          generated_at: new Date().toISOString(),
          expires_at: expiresAt,
        });
        console.log(`  ${zone.name}: GENERATED`);
        console.log(`    "${summary.slice(0, 60)}..."`);
      } catch (err) {
        console.error(`  ${zone.name}: LLM failed (non-fatal):`, err);
      }
    }
  } else {
    console.log("--- Skipping LLM summaries (no GROQ_API_KEY) ---");
  }

  console.log(`\n=== Pipeline complete at ${new Date().toISOString()} ===`);
}

main().catch((err) => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});
