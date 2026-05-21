"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pdfFile || !jobDescription.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("cv", pdfFile);
      formData.append("jobDescription", jobDescription);

      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Ocurrió un error al analizar el CV.");
        return;
      }

      sessionStorage.setItem("analysisResult", JSON.stringify(data));
      router.push("/analyze");
    } catch {
      setError("No se pudo conectar con el servidor. Intentá de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Apply<span className="text-emerald-400">Wise</span>
          </h1>
          <p className="mt-3 text-slate-400 text-lg">
            Optimizá tu CV para cada oferta laboral con IA local y privada.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 space-y-6"
        >
          {/* PDF Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              CV en PDF
            </label>
            <div
              className={`
                relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
                ${pdfFile
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-slate-600 hover:border-slate-500 bg-slate-900/40"}
              `}
            >
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Subir CV en PDF"
              />
              {pdfFile ? (
                <p className="text-emerald-400 font-medium truncate">{pdfFile.name}</p>
              ) : (
                <div className="space-y-1">
                  <p className="text-slate-400">Arrastrá tu CV o hacé clic para seleccionarlo</p>
                  <p className="text-slate-500 text-sm">Solo archivos PDF</p>
                </div>
              )}
            </div>
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <label
              htmlFor="jobDescription"
              className="block text-sm font-medium text-slate-300"
            >
              Descripción del puesto
            </label>
            <textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Pegá aquí la descripción completa del puesto al que querés aplicar..."
              rows={8}
              className="w-full bg-slate-900/60 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!pdfFile || !jobDescription.trim() || isLoading}
            className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analizando con IA local...
              </>
            ) : (
              "Analizar CV"
            )}
          </button>

          <p className="text-center text-xs text-slate-500">
            Tu CV se procesa localmente. No se envía a servicios externos de IA.
          </p>
        </form>
      </div>
    </main>
  );
}
