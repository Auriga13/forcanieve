/**
 * Run a SQL migration against Supabase.
 * Usage: npx tsx scripts/run-sql.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const sqlFile = process.argv[2];
  if (!sqlFile) {
    console.error("Usage: npx tsx scripts/run-sql.ts <path-to-sql-file>");
    process.exit(1);
  }

  const sql = readFileSync(sqlFile, "utf-8");
  console.log(`Running: ${sqlFile}`);

  const { error } = await supabase.rpc("exec_sql", { sql_text: sql });

  if (error) {
    // rpc exec_sql may not exist — fall back to individual statements
    console.log("rpc not available, running via REST...");
    // Use the Supabase SQL endpoint directly
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
      {
        method: "POST",
        headers: {
          "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql_text: sql }),
      }
    );
    if (!res.ok) {
      console.error("Failed. Please run this SQL manually in Supabase SQL Editor:");
      console.log(sql);
    } else {
      console.log("Done!");
    }
  } else {
    console.log("Done!");
  }
}

main().catch(console.error);
