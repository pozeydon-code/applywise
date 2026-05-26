import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { importJobDescriptionFromUrl } from "@/server/job-url/extract-job-description";

const JobUrlRequestSchema = z.object({
  url: z.string().min(1).max(2_000),
});

const FALLBACK_MESSAGE = "No pudimos leer esta página. Pegá el texto manualmente.";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = JobUrlRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: FALLBACK_MESSAGE }, { status: 400 });
  }

  const result = await importJobDescriptionFromUrl(parsed.data.url);

  if (!result.ok || !result.text) {
    return NextResponse.json({ error: FALLBACK_MESSAGE }, { status: 422 });
  }

  return NextResponse.json({ text: result.text });
}
