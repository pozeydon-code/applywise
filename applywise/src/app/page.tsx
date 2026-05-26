"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

const PIPELINE_STEPS = [
  "Parseando CV",
  "Analizando oferta laboral",
  "Evaluando compatibilidad",
  "Generando assets de carrera",
  "Armando kit de postulación",
];

type AnalysisSummary = {
  id: string;
  created_at: string;
  job_role: string | null;
  score: number;
};

type JobUrlImportResponse = {
  text: string;
};

function isJobUrlImportResponse(value: unknown): value is JobUrlImportResponse {
  return typeof value === "object" && value !== null && "text" in value && typeof value.text === "string";
}

export default function HomePage() {
  const router = useRouter();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isImportingJobUrl, setIsImportingJobUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobUrlMessage, setJobUrlMessage] = useState<string | null>(null);
  const [jobUrlPreview, setJobUrlPreview] = useState<string | null>(null);
  const [jobUrlError, setJobUrlError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisSummary[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analyses")
      .then((r) => r.json())
      .then((d) => setRecentAnalyses(d.analyses ?? []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!pdfFile || !jobDescription.trim()) return;

    setIsLoading(true);
    setError(null);
    setCurrentStep(0);

    try {
      const formData = new FormData();
      formData.append("cv", pdfFile);
      formData.append("jobDescription", jobDescription);

      const res = await fetch("/api/analyze", { method: "POST", body: formData });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Ocurrió un error al analizar el CV.");
        return;
      }

      const contentType = res.headers.get("content-type") ?? "";

      if (contentType.includes("text/event-stream")) {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";

          for (const chunk of chunks) {
            const line = chunk.trim();
            if (!line.startsWith("data: ")) continue;

            const payload = JSON.parse(line.slice(6));

            if (payload.type === "progress") {
              setCurrentStep(payload.step);
            } else if (payload.type === "result") {
              sessionStorage.setItem("analysisResult", JSON.stringify(payload.data));
              router.push("/analyze");
              return;
            } else if (payload.type === "error") {
              setError(payload.message);
              return;
            }
          }
        }
      } else {
        // JSON fallback — used by E2E mocks (page.route interception)
        const data = await res.json();
        sessionStorage.setItem("analysisResult", JSON.stringify(data));
        router.push("/analyze");
      }
    } catch {
      setError("No se pudo conectar con el servidor. Intentá de nuevo.");
    } finally {
      setIsLoading(false);
      setCurrentStep(0);
    }
  }

  async function handleImportJobUrl() {
    if (!jobUrl.trim() || isImportingJobUrl) return;

    setIsImportingJobUrl(true);
    setJobUrlMessage(null);
    setJobUrlPreview(null);
    setJobUrlError(null);

    try {
      const res = await fetch("/api/job-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl }),
      });
      const data: unknown = await res.json();

      if (!res.ok || !isJobUrlImportResponse(data)) {
        setJobUrlError("No pudimos leer esta página. Pegá el texto manualmente.");
        return;
      }

      setJobDescription(data.text);
      setJobUrlMessage(`Oferta importada. Se cargaron ${data.text.length} caracteres editables.`);
      setJobUrlPreview(data.text.slice(0, 220));
    } catch {
      setJobUrlError("No pudimos leer esta página. Pegá el texto manualmente.");
    } finally {
      setIsImportingJobUrl(false);
    }
  }

  function scoreColor(score: number) {
    if (score >= 70) return "text-emerald-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  }

  async function openAnalysis(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/analyses/${id}`);
      if (!res.ok) return;
      const { analysis } = await res.json();
      sessionStorage.setItem("analysisResult", JSON.stringify(analysis.result_snapshot));
      router.push("/analyze");
    } catch {
      // silently ignore — user stays on home
    } finally {
      setLoadingId(null);
    }
  }

  function formatDate(iso: string) {
    return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(iso));
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <header className="text-center">
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
            <label className="block text-sm font-medium text-slate-300">CV en PDF</label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                pdfFile
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-slate-600 hover:border-slate-500 bg-slate-900/40"
              }`}
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
            <label htmlFor="jobUrl" className="block text-sm font-medium text-slate-300">
              Importar oferta desde URL
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="jobUrl"
                type="url"
                value={jobUrl}
                onChange={(e) => {
                  setJobUrl(e.target.value);
                  setJobUrlMessage(null);
                  setJobUrlPreview(null);
                  setJobUrlError(null);
                }}
                placeholder="https://empresa.com/careers/frontend-engineer"
                className="min-w-0 flex-1 rounded-xl border border-slate-600 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleImportJobUrl}
                disabled={!jobUrl.trim() || isImportingJobUrl}
                className="rounded-xl bg-slate-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500"
              >
                {isImportingJobUrl ? "Importando..." : "Importar oferta"}
              </button>
            </div>
            {jobUrlMessage && (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                {jobUrlMessage}
              </p>
            )}
            {jobUrlPreview && (
              <p className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs text-slate-400">
                Vista previa: {jobUrlPreview}{jobUrlPreview.length === 220 ? "..." : ""}
              </p>
            )}
            {jobUrlError && (
              <p role="status" className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-200">
                {jobUrlError}
              </p>
            )}
          </div>

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

          {/* Pipeline progress */}
          {isLoading && currentStep > 0 && (
            <div className="space-y-2 py-1">
              {PIPELINE_STEPS.map((label, i) => {
                const step = i + 1;
                const done = currentStep > step;
                const active = currentStep === step;
                return (
                  <div
                    key={step}
                    className={`flex items-center gap-3 text-sm transition-colors ${
                      done
                        ? "text-emerald-400"
                        : active
                        ? "text-white"
                        : "text-slate-600"
                    }`}
                  >
                    <span className="w-4 flex-shrink-0 flex items-center justify-center font-mono">
                      {done ? "✓" : active ? (
                        <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : "·"}
                    </span>
                    {label}
                  </div>
                );
              })}
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm"
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!pdfFile || !jobDescription.trim() || isLoading}
            className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {isLoading && currentStep === 0 ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Iniciando análisis...
              </>
            ) : isLoading ? (
              "Analizando con IA local..."
            ) : (
              "Analizar CV"
            )}
          </button>

          <p className="text-center text-xs text-slate-500">
            Tu CV se procesa localmente. No se envía a servicios externos de IA.
          </p>
        </form>

        {/* Recent analyses from Supabase */}
        {recentAnalyses.length > 0 && (
          <section className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Análisis recientes
            </h2>
            <ul className="space-y-2">
              {recentAnalyses.slice(0, 5).map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => openAnalysis(a.id)}
                    disabled={loadingId === a.id}
                    className="w-full flex items-center justify-between gap-4 px-3 py-2 rounded-xl hover:bg-slate-700/50 transition-colors disabled:opacity-60 text-left"
                  >
                    <span className="text-slate-300 text-sm truncate">
                      {a.job_role ?? "Puesto sin nombre"}
                    </span>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className={`font-semibold text-sm ${scoreColor(a.score)}`}>
                        {a.score}%
                      </span>
                      <span className="text-slate-500 text-xs">{formatDate(a.created_at)}</span>
                      {loadingId === a.id ? (
                        <span className="inline-block w-3 h-3 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                      ) : (
                        <span className="text-slate-600 text-xs">→</span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
