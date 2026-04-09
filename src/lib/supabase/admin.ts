import { createClient } from "@supabase/supabase-js";

// Service role client — bypasses RLS. Use ONLY in server-side code
// (API routes, cron scripts). NEVER expose to the browser.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
