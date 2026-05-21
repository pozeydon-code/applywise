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

  // Step 1: Normalize CV
  const cvProfile = await ai.generateJson({
    prompt: buildCvNormalizationPrompt(pdfResult.text),
    systemPrompt: SYSTEM_NO_FABRICATION,
    schema: CvProfileSchema,
    maxTokens: 2048,
  });

  // Step 2: Analyze job offer
  const jobOffer = await ai.generateJson({
    prompt: buildJobOfferAnalysisPrompt(jobDescription),
    systemPrompt: SYSTEM_NO_FABRICATION,
    schema: JobOfferSchema,
    maxTokens: 1024,
  });

  // Step 3: Match CV vs job offer
  const matchAnalysis = await ai.generateJson({
    prompt: buildMatchPrompt(cvProfile, jobOffer),
    systemPrompt: SYSTEM_NO_FABRICATION,
    schema: MatchAnalysisSchema,
    maxTokens: 1024,
  });

  // Step 4: Generate assets
  const generatedAssets = await ai.generateJson({
    prompt: buildAssetsPrompt(cvProfile, jobOffer, matchAnalysis),
    systemPrompt: SYSTEM_NO_FABRICATION,
    schema: GeneratedAssetsSchema,
    maxTokens: 2048,
  });

  const result: AnalysisResult = {
    cvProfile,
    jobOffer,
    matchAnalysis,
    generatedAssets,
  };

  // Step 5: Persist minimal metadata (non-blocking — failure doesn't break the response)
  const saved = await saveAnalysis(result);
  if (saved?.id) {
    result.id = saved.id;
    result.createdAt = saved.created_at;
  }

  return NextResponse.json(result);
}
