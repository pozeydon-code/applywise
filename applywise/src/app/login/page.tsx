"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/server/supabase/browser";

type Mode = "password" | "magic";
type PasswordView = "login" | "register";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("password");
  const [view, setView] = useState<PasswordView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
    setPassword("");
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const supabase = createSupabaseBrowserClient();

    try {
      if (view === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); return; }
        window.location.replace("/");
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) { setError(error.message); return; }
        // session is null when email confirmation is required
        if (data.session) {
          window.location.replace("/");
        } else {
          setInfo("Revisá tu email para confirmar la cuenta y luego ingresá.");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const supabase = createSupabaseBrowserClient();
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) { setError(error.message); return; }
      setInfo("Revisá tu email — te mandamos un link para ingresar.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full bg-slate-900/60 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Apply<span className="text-emerald-400">Wise</span>
          </h1>
          <p className="mt-2 text-slate-400 text-sm">
            {view === "login" || mode === "magic" ? "Ingresá a tu cuenta" : "Creá tu cuenta"}
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 space-y-5">
          {/* Mode tabs */}
          <div className="flex rounded-lg border border-slate-700 p-1 gap-1">
            <button
              type="button"
              onClick={() => switchMode("password")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "password"
                  ? "bg-emerald-500 text-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Contraseña
            </button>
            <button
              type="button"
              onClick={() => switchMode("magic")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "magic"
                  ? "bg-emerald-500 text-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Link mágico
            </button>
          </div>

          {/* Password mode */}
          {mode === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vos@ejemplo.com"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className={inputClass}
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}
              {info && <p className="text-emerald-400 text-sm">{info}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
              >
                {loading
                  ? view === "login" ? "Ingresando..." : "Registrando..."
                  : view === "login" ? "Ingresar" : "Registrarse"}
              </button>

              <p className="text-center text-sm text-slate-500">
                {view === "login" ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}{" "}
                <button
                  type="button"
                  onClick={() => { setView(view === "login" ? "register" : "login"); setError(null); setInfo(null); }}
                  className="text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  {view === "login" ? "Registrate" : "Iniciá sesión"}
                </button>
              </p>
            </form>
          )}

          {/* Magic link mode */}
          {mode === "magic" && (
            <form onSubmit={handleMagicSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="email-magic" className="block text-sm font-medium text-slate-300">
                  Email
                </label>
                <input
                  id="email-magic"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vos@ejemplo.com"
                  className={inputClass}
                />
              </div>
              <p className="text-xs text-slate-500">
                Te mandamos un link a tu email — sin contraseña.
              </p>

              {error && <p className="text-red-400 text-sm">{error}</p>}
              {info && <p className="text-emerald-400 text-sm">{info}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
              >
                {loading ? "Enviando..." : "Enviar link mágico"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
