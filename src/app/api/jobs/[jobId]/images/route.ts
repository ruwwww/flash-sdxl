import { NextRequest, NextResponse } from "next/server";
import { SupabaseGenerationRepository } from "@/infrastructure/repositories/SupabaseGenerationRepository";
import { createClient } from "@/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const repo = new SupabaseGenerationRepository();
    const images = await repo.getImagesByJobId(params.jobId);

    // Verify the job belongs to the user
    const job = await repo.getById(params.jobId);
    if (!job || job.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(images);
  } catch (error: any) {
    console.error("Error fetching job images:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}