import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPdf } from "@/server/pdf/extract";
import { getAiProvider } from "@/server/ai";
import { saveAnalysis } from "@/server/persistence/analyses";
import { CvProfileSchema, JobOfferSchema, MatchAnalysisSchema, GeneratedAssetsSchema } from "@/shared/schemas/ai-outputs";
import { buildCvNormalizationPrompt, buildJobOfferAnalysisPrompt, SYSTEM_NO_FABRICATION } from "@/features/cv-analysis/prompts";
import { buildMatchPrompt } from "@/features/job-matching/prompts";
import { buildAssetsPrompt } from "@/features/profile-generation/prompts";
import type { AnalysisResult } from "@/shared/types/domain";

export const maxDuration = 120;

type SseEvent =
  | { type: "progress"; step: number; total: number; label: string }
  | { type: "result"; data: AnalysisResult }
  | { type: "error"; message: string };

function sseStream(handler: (emit: (event: SseEvent) => void) => Promise<void>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function emit(event: SseEvent) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }
      try {
        await handler(emit);
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const pdfFile = formData.get("cv") as File | null;
  const jobDescription = formData.get("jobDescription") as string | null;

  if (!pdfFile || !jobDescription?.trim()) {
    return NextResponse.json(
      { error: "Se requiere un archivo PDF y una descripción del puesto." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await pdfFile.arrayBuffer());
  const pdfResult = await extractTextFromPdf(buffer);

  if (!pdfResult.success) {
    return NextResponse.json({ error: pdfResult.error }, { status: 422 });
  }

  const ai = getAiProvider();
  const isHealthy = await ai.healthCheck();
  if (!isHealthy) {
    return NextResponse.json(
      { error: "El servidor de IA local no está disponible. Asegurate de que Ollama esté corriendo." },
      { status: 503 }
    );
  }

  return sseStream(async (emit) => {
    try {
      emit({ type: "progress", step: 1, total: 4, label: "Parseando CV..." });
      const cvProfile = await ai.generateJson({
        prompt: buildCvNormalizationPrompt(pdfResult.text),
        systemPrompt: SYSTEM_NO_FABRICATION,
        schema: CvProfileSchema,
        maxTokens: 2048,
      });

      emit({ type: "progress", step: 2, total: 4, label: "Analizando oferta laboral..." });
      const jobOffer = await ai.generateJson({
        prompt: buildJobOfferAnalysisPrompt(jobDescription),
        systemPrompt: SYSTEM_NO_FABRICATION,
        schema: JobOfferSchema,
        maxTokens: 1024,
      });

      emit({ type: "progress", step: 3, total: 4, label: "Evaluando compatibilidad..." });
      const matchAnalysis = await ai.generateJson({
        prompt: buildMatchPrompt(cvProfile, jobOffer),
        systemPrompt: SYSTEM_NO_FABRICATION,
        schema: MatchAnalysisSchema,
        maxTokens: 1024,
      });

      emit({ type: "progress", step: 4, total: 4, label: "Generando assets de carrera..." });
      const generatedAssets = await ai.generateJson({
        prompt: buildAssetsPrompt(cvProfile, jobOffer, matchAnalysis),
        systemPrompt: SYSTEM_NO_FABRICATION,
        schema: GeneratedAssetsSchema,
        maxTokens: 2048,
      });

      const result: AnalysisResult = { cvProfile, jobOffer, matchAnalysis, generatedAssets };

      const saved = await saveAnalysis(result);
      if (saved?.id) {
        result.id = saved.id;
        result.createdAt = saved.created_at;
      }

      emit({ type: "result", data: result });
    } catch (err) {
      emit({
        type: "error",
        message: err instanceof Error ? err.message : "Error desconocido en el análisis.",
      });
    }
  });
}
