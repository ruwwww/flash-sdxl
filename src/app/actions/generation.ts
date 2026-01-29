'use server'

import { createClient } from "@/supabase/server";
import { CreateGenerationJob } from "@/application/use-cases/generation/CreateGenerationJob";
import { SupabaseGenerationRepository } from "@/infrastructure/repositories/SupabaseGenerationRepository";
import { SupabaseUserRepository } from "@/infrastructure/repositories/SupabaseUserRepository";
import { HttpSdxlGateway } from "@/infrastructure/gateways/HttpSdxlGateway";
import { MockSdxlGateway } from "@/infrastructure/gateways/MockSdxlGateway";
import { CreateGenerationSchema, GenerationJobResponse } from "@/application/dtos/generation.schema";
import { ApiResponse } from "@/application/dtos/shared.dto";
import { z } from "zod";
import { SupabaseSystemConfigRepository } from "@/infrastructure/repositories/SupabaseSystemConfigRepository";
import { GeneratedImageDto } from "@/domain/repositories/IGenerationRepository";
import { DEFAULT_FEATURE_CONFIG } from "@/domain/entities/Config";
import { GenerationJob } from "@/domain/entities/GenerationJob";

// Initialize Dependencies (In a real app, this might be a singleton container)
// Note: We use env vars for config. 
const sdxlUrl = process.env.SDXL_SERVER_URL || 'http://localhost:8000';
const sdxlSecret = process.env.SDXL_INTERNAL_SECRET || 'dev-secret';
const USE_MOCK = process.env.USE_MOCK_SDXL === 'true';

export async function generateImageAction(
  input: z.infer<typeof CreateGenerationSchema>
): Promise<ApiResponse<GenerationJobResponse>> {
  try {
    // 1. Auth Check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: "Unauthorized", code: "AUTH_REQUIRED" };
    }

    // 2. Input Validation (Double check on server side)
    const validData = CreateGenerationSchema.parse(input);

    // 3. Instantiate Use Case Stack
    const generationRepo = new SupabaseGenerationRepository();
    const userRepo = new SupabaseUserRepository();
    
    // Choose Gateway
    const sdxlGateway = USE_MOCK 
      ? new MockSdxlGateway() 
      : new HttpSdxlGateway(sdxlUrl, sdxlSecret);

    const useCase = new CreateGenerationJob(generationRepo, userRepo, sdxlGateway);

    // 4. Execute
    const job = await useCase.execute({
      userId: user.id,
      prompt: validData.prompt,
      params: {
        width: validData.width,
        height: validData.height,
        steps: validData.steps,
        cfg: validData.cfg,
        batch_size: validData.batch_size,
        // Backend decides the seed if not provided
        seed: validData.seed ?? Math.floor(Math.random() * 2147483647) 
      }
    });

    // 5. Return DTO
    return {
      success: true,
      data: {
        id: job.id,
        status: job.status,
        cost: job.cost
      }
    };

  } catch (error: any) {
    console.error("Generate Action Error:", error);
    
    // Distinguish between Domain Errors (Insufficient Credits) vs System Errors
    if (error.message === "Insufficient credits") {
      return { success: false, error: "You do not have enough credits.", code: "INSUFFICIENT_CREDITS" };
    }
    
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid parameters", code: "VALIDATION_ERROR" };
    }

    return { success: false, error: "Failed to start generation job.", code: "INTERNAL_ERROR" };
  }
}

import { GetGenerationStatus, JobStatusOutput } from "@/application/use-cases/generation/GetGenerationStatus";

export async function getJobStatusAction(jobId: string): Promise<ApiResponse<JobStatusOutput>> {
  try {
     const supabase = await createClient();
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return { success: false, error: "Unauthorized" };

     const repo = new SupabaseGenerationRepository();
     const useCase = new GetGenerationStatus(repo);
     
     const status = await useCase.execute(jobId, user.id);
     
     if (!status) return { success: false, error: "Job not found" };
     
     return { success: true, data: status };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


export async function getUserHistoryAction(): Promise<ApiResponse<GeneratedImageDto[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    // 1. Get Config
    const configRepo = new SupabaseSystemConfigRepository();
    const flags = await configRepo.getByKey('feature_flags') || DEFAULT_FEATURE_CONFIG;
    
    // 2. Check Permissions
    if (flags.history === 'disabled') {
      return { success: false, error: "History feature is currently disabled." };
    }

    if (flags.history === 'premium') {
      const userRepo = new SupabaseUserRepository();
      const profile = await userRepo.getById(user.id);
      
      const isPrivileged = profile?.is_premium || profile?.role === 'admin' || profile?.role === 'superadmin';
      
      if (!isPrivileged) {
        return { success: false, error: "History is a Premium feature. Upgrade to access." };
      }
    }

    // 3. Fetch History
    const genRepo = new SupabaseGenerationRepository();
    // Default limit
    const images = await genRepo.getImagesByUserId(user.id, 20); 

    return { success: true, data: images };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getUserJobsAction(): Promise<ApiResponse<GenerationJob[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const genRepo = new SupabaseGenerationRepository();
    const jobs = await genRepo.getJobsByUserId(user.id);

    return { success: true, data: jobs };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
