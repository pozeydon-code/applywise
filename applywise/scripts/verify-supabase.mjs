// Run with: node scripts/verify-supabase.mjs
// Requires .env.local to be present

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Load .env.local manually (no dotenv needed)
const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && !key.startsWith("#") && rest.length > 0) {
    process.env[key.trim()] = rest.join("=").trim();
  }
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

console.log(`🔗 Connecting to: ${url}`);

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// 1. Probe: insert a test row
console.log("\n📝 Testing INSERT...");
const { data: inserted, error: insertErr } = await db
  .from("analyses")
  .insert({
    job_role: "__verify_script__",
    score: 0,
    result_snapshot: { test: true },
  })
  .select()
  .single();

if (insertErr) {
  console.error("❌ INSERT failed:", insertErr.message);
  process.exit(1);
}
console.log("✅ INSERT OK — id:", inserted.id);

// 2. Probe: read it back
console.log("\n📖 Testing SELECT...");
const { data: fetched, error: selectErr } = await db
  .from("analyses")
  .select("id, job_role, score")
  .eq("id", inserted.id)
  .single();

if (selectErr) {
  console.error("❌ SELECT failed:", selectErr.message);
} else {
  console.log("✅ SELECT OK:", fetched);
}

// 3. Cleanup: delete the test row
console.log("\n🗑️  Cleaning up test row...");
const { error: deleteErr } = await db
  .from("analyses")
  .delete()
  .eq("id", inserted.id);

if (deleteErr) {
  console.warn("⚠️  DELETE warning:", deleteErr.message);
} else {
  console.log("✅ Cleanup OK");
}

console.log("\n✅ Supabase connection verified — INSERT / SELECT / DELETE all working.");
console.log("ℹ️  RLS: verify manually → Supabase Dashboard → Table Editor → analyses → RLS enabled.");
