import { createSupabaseServerClient } from "@/server/supabase/server";
import LogoutButton from "./logout-button";

export default async function Header() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-700 bg-slate-900 px-6 py-3 flex items-center justify-between">
      <span className="text-sm font-semibold text-white">
        Apply<span className="text-emerald-400">Wise</span>
      </span>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-400">{user.email}</span>
        <LogoutButton />
      </div>
    </header>
  );
}
