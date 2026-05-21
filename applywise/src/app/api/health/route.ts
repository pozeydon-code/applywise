import { NextResponse } from "next/server";
import { getAiProvider } from "@/server/ai";
import { verifyConnection } from "@/server/persistence/analyses";

export async function GET() {
  const [aiAvailable, dbResult] = await Promise.all([
    getAiProvider().healthCheck(),
    verifyConnection(),
  ]);

  const status = aiAvailable && dbResult.ok ? "ok" : "degraded";

  return NextResponse.json({
    status,
    ai: aiAvailable ? "available" : "unavailable",
    database: dbResult.ok ? "connected" : `error: ${dbResult.error}`,
    timestamp: new Date().toISOString(),
  });
}
