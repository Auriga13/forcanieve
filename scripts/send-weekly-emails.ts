/**
 * Weekly email sender — same as daily but for weekly subscribers (Monday).
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("=== ForcaNieve Weekly Email Sender ===");
  console.log(`Started at: ${new Date().toISOString()}`);

  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("*")
    .eq("is_active", true)
    .eq("is_verified", true)
    .eq("frequency", "weekly");

  console.log(`Found ${subscribers?.length ?? 0} weekly subscribers`);
  console.log("TODO: Implement email sending (Phase 4)");

  console.log(`\nCompleted at: ${new Date().toISOString()}`);
}

main().catch((err) => {
  console.error("Weekly email sender failed:", err);
  process.exit(1);
});
