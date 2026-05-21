import type { AnalysisResult } from "@/shared/types/domain";
import type { AnalysisRow } from "@/shared/types/database";
import { getSupabaseAdmin } from "./supabase";

export type { AnalysisRow };

export async function saveAnalysis(result: AnalysisResult): Promise<AnalysisRow | null> {
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("analyses")
      .insert({
        job_role: result.jobOffer.role ?? null,
        score: result.matchAnalysis.score,
        result_snapshot: result,
      })
      .select()
      .single();

    if (error) {
      console.error("[persistence] saveAnalysis failed:", error.message);
      return null;
    }

    return data;
  } catch (err) {
    // Catches missing env vars or network failures — non-fatal
    console.error("[persistence] saveAnalysis error:", err);
    return null;
  }
}

export async function getRecentAnalyses(limit = 10): Promise<AnalysisRow[]> {
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("analyses")
      .select("id, created_at, job_role, score, result_snapshot")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[persistence] getRecentAnalyses failed:", error.message);
      return [];
    }

    return data ?? [];
  } catch (err) {
    console.error("[persistence] getRecentAnalyses error:", err);
    return [];
  }
}

export async function verifyConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const db = getSupabaseAdmin();
    const { error } = await db.from("analyses").select("id").limit(1);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
