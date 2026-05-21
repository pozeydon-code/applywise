import { NextResponse } from "next/server";
import { getRecentAnalyses } from "@/server/persistence/analyses";

export async function GET() {
  const analyses = await getRecentAnalyses(20);

  // Return only summary fields — never expose full result_snapshot in list view
  const summary = analyses.map(({ id, created_at, job_role, score }) => ({
    id,
    created_at,
    job_role,
    score,
  }));

  return NextResponse.json({ analyses: summary });
}
