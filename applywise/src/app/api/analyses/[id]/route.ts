import { NextResponse } from "next/server";
import { getAnalysisById } from "@/server/persistence/analyses";
import { createSupabaseServerClient } from "@/server/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = await createSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const analysis = await getAnalysisById(id);

  if (!analysis) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ analysis });
}
