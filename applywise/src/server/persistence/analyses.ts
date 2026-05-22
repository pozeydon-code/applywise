import type { AnalysisResult } from "@/shared/types/domain";
import type { AnalysisRow } from "@/shared/types/database";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { getSupabaseAdmin } from "./supabase";

export type { AnalysisRow };

// Uses the SSR client (user JWT) so RLS enforces auth.uid() = user_id.
export async function saveAnalysis(
  result: AnalysisResult,
  userId: string
): Promise<AnalysisRow | null> {
  try {
    const db = await createSupabaseServerClient();
    const { data, error } = await db
      .from("analyses")
      .insert({
        job_role: result.jobOffer.role ?? null,
        score: result.matchAnalysis.score,
        result_snapshot: result,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("[persistence] saveAnalysis failed:", error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error("[persistence] saveAnalysis error:", err);
    return null;
  }
}

// Returns only the authenticated user's analyses (RLS enforces this).
export async function getRecentAnalyses(limit = 10): Promise<AnalysisRow[]> {
  try {
    const db = await createSupabaseServerClient();
    const { data, error } = await db
      .from("analyses")
      .select("id, created_at, job_role, score, result_snapshot, user_id")
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

// Returns a single analysis by id — RLS ensures only the owner can access it.
export async function getAnalysisById(id: string): Promise<AnalysisRow | null> {
  try {
    const db = await createSupabaseServerClient();
    const { data, error } = await db
      .from("analyses")
      .select("id, created_at, job_role, score, result_snapshot, user_id")
      .eq("id", id)
      .single();

    if (error) {
      console.error("[persistence] getAnalysisById failed:", error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error("[persistence] getAnalysisById error:", err);
    return null;
  }
}

// Health check uses the admin client — no user context needed.
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
