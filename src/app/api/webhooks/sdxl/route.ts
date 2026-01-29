import { NextRequest, NextResponse } from "next/server";
import { SupabaseGenerationRepository } from "@/infrastructure/repositories/SupabaseGenerationRepository";
import { ProcessJobCompletion } from "@/application/use-cases/generation/ProcessJobCompletion";
import { createAdminClient } from "@/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Use an Admin Client (Service Role) to properly bypass RLS during webhook handling
    const adminClient = createAdminClient();
    const repo = new SupabaseGenerationRepository(adminClient);
    
    const useCase = new ProcessJobCompletion(repo);

    await useCase.execute({
      jobId: body.job_id,
      status: body.status,
      error: body.error,
      durationMs: body.duration_ms,
      results: body.results
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook Error", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
