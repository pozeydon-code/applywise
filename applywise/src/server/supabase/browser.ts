"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/shared/types/database";

// Browser client — uses the anon key, safe for client components.
// Only used for auth UI (sign in, sign out, session state).
// Never use this for database reads/writes — those go through server actions or API routes.
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
