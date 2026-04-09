/**
 * Cleanup script — calls the cleanup_expired_data() function in Supabase
 * to remove stale weather data and expired/unsubscribed users.
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("=== ForcaNieve Cleanup ===");
  console.log(`Started at: ${new Date().toISOString()}`);

  const { error } = await supabase.rpc("cleanup_expired_data");

  if (error) {
    console.error("Cleanup failed:", error);
    process.exit(1);
  }

  console.log("Cleanup completed successfully");
  console.log(`Completed at: ${new Date().toISOString()}`);
}

main().catch((err) => {
  console.error("Cleanup script failed:", err);
  process.exit(1);
});
