"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AnalysisResult } from "@/shared/types/domain";

export default function AnalyzePage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<"match" | "assets">("match");

  useEffect(() => {
    const raw = sessionStorage.getItem("analysisResult");
    if (!raw) {
      router.push("/");
      return;
    }
    try {
      setResult(JSON.parse(raw));
    } catch {
      router.push("/");
    }
  }, [router]);

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Cargando resultados...
      </div>
    );
  }

  const { matchAnalysis: match, generatedAssets: assets } = result;

  return (
    <main className="min-h-screen bg-slate-900 text-slate-200 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            Apply<span className="text-emerald-400">Wise</span> — Resultados
          </h1>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Nueva búsqueda
          </button>
        </div>

        {/* Score */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex items-center gap-6">
          <ScoreRing score={match.score} />
          <div>
            <p className="text-slate-400 text-sm">Compatibilidad con el puesto</p>
            <p className="text-3xl font-bold text-white">{match.score}%</p>
            <p className="text-slate-500 text-xs mt-1">
              Basado únicamente en información verificable de tu CV.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <TabButton active={activeTab === "match"} onClick={() => setActiveTab("match")}>
            Análisis
          </TabButton>
          <TabButton active={activeTab === "assets"} onClick={() => setActiveTab("assets")}>
            Contenido generado
          </TabButton>
        </div>

        {activeTab === "match" && (
          <div className="space-y-6">
            <Section title="Fortalezas" color="emerald" items={match.strengths} />
            <Section title="Brechas" color="amber" items={match.gaps} />
            <Section title="Keywords faltantes" color="rose" items={match.missingKeywords} />
            <Section title="Recomendaciones" color="sky" items={match.recommendations} />
          </div>
        )}

        {activeTab === "assets" && (
          <div className="space-y-6">
            <TextCard title="Resumen profesional optimizado" content={assets.optimizedSummary} />
            <TextCard title="LinkedIn Headline" content={assets.linkedinHeadline} />
            <TextCard title="LinkedIn About" content={assets.linkedinAbout} />
            <TextCard title="Cover Letter" content={assets.coverLetter} />
          </div>
        )}
      </div>
    </main>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? "emerald" : score >= 50 ? "amber" : "rose";
  const colorMap = { emerald: "#10b981", amber: "#f59e0b", rose: "#f43f5e" };
  const r = 30;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <svg width="80" height="80" className="shrink-0">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke={colorMap[color]}
        strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
      />
    </svg>
  );
}

function TabButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-emerald-400 text-emerald-400"
          : "border-transparent text-slate-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Section({
  title,
  color,
  items,
}: {
  title: string;
  color: "emerald" | "amber" | "rose" | "sky";
  items: string[];
}) {
  const colorMap = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    sky: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  };

  if (!items.length) return null;

  return (
    <div className={`rounded-xl border p-5 ${colorMap[color]}`}>
      <h3 className="font-semibold mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-slate-300 text-sm flex gap-2">
            <span className="mt-0.5 shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TextCard({ title, content }: { title: string; content: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-200">{title}</h3>
        <button
          onClick={copy}
          className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
        >
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>
      <p className="text-slate-400 text-sm whitespace-pre-wrap">{content}</p>
    </div>
  );
}
