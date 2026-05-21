import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/types/database";

// Server-only — never import this file from client components or pages.
// The service-role key has full access and bypasses RLS.
// RLS still protects the table from direct browser/anon access.

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertServerEnv(): void {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing Supabase env vars. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }
}

function createAdminClient() {
  assertServerEnv();
  return createClient<Database>(supabaseUrl!, supabaseServiceKey!, {
    auth: {
      // Disable automatic session persistence — this is a server-side admin client
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Lazy singleton — instantiated on first use so missing env vars
// don't crash the server at startup during development.
let _client: ReturnType<typeof createAdminClient> | null = null;

export function getSupabaseAdmin() {
  if (!_client) {
    _client = createAdminClient();
  }
  return _client;
}
