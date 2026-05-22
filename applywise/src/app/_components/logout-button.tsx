"use client";

import { createSupabaseBrowserClient } from "@/server/supabase/browser";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-slate-400 hover:text-white transition-colors"
    >
      Salir
    </button>
  );
}
