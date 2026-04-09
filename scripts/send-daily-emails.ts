/**
 * Daily email sender — queries subscribers with daily frequency,
 * generates personalized LLM summaries, and sends via Resend.
 *
 * Run manually: npx tsx scripts/send-daily-emails.ts
 * Runs on cron via GitHub Actions at 07:00 CET daily.
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("=== ForcaNieve Daily Email Sender ===");
  console.log(`Started at: ${new Date().toISOString()}`);

  // Query active daily subscribers
  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("*")
    .eq("is_active", true)
    .eq("is_verified", true)
    .eq("frequency", "daily");

  console.log(`Found ${subscribers?.length ?? 0} daily subscribers`);

  // TODO: For each subscriber:
  // 1. Gather latest data for their selected zones
  // 2. Call Claude Haiku to generate personalized summary
  // 3. Send email via Resend
  // 4. Update last_sent_at
  console.log("TODO: Implement email sending (Phase 4)");

  console.log(`\nCompleted at: ${new Date().toISOString()}`);
}

main().catch((err) => {
  console.error("Email sender failed:", err);
  process.exit(1);
});
