import { IGenerationRepository, GeneratedImageDto } from "../../domain/repositories/IGenerationRepository";
import { GenerationJob } from "../../domain/entities/GenerationJob";
import { createClient } from "@/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseGenerationRepository implements IGenerationRepository {
  private customClient: SupabaseClient | null = null;

  constructor(client?: SupabaseClient) {
    if (client) this.customClient = client;
  }

  private async getClient() {
    if (this.customClient) return this.customClient;
    return await createClient();
  }

  async getImagesByJobId(jobId: string): Promise<GeneratedImageDto[]> {
    const supabase = await this.getClient();
    const { data } = await supabase.from('generated_images').select('*').eq('generation_id', jobId);
    
    if (!data) return [];
    
    return data.map(row => ({
      generationId: row.generation_id,
      userId: row.user_id,
      storagePath: row.storage_path,
      seed: row.seed
    }));
  }

  async getImagesByUserId(userId: string, limit = 50): Promise<GeneratedImageDto[]> {
    const supabase = await this.getClient();
    // Join with generation table if we want to sort by latest job, 
    // or assume we sort by generated_images created_at
    const { data } = await supabase
      .from('generated_images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map(row => ({
      generationId: row.generation_id,
      userId: row.user_id,
      storagePath: row.storage_path,
      seed: row.seed
    }));
  }

  async getJobsByUserId(userId: string): Promise<GenerationJob[]> {
    const supabase = await this.getClient();
    const { data } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!data) return [];

    return data.map(row => ({
      id: row.id,
      userId: row.user_id,
      prompt: row.prompt,
      negativePrompt: row.negative_prompt,
      params: row.params,
      status: row.status,
      cost: row.cost,
      createdAt: new Date(row.created_at),
      errorMessage: row.error_message,
      durationMs: row.duration_ms,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined
    }));
  }

  async create(job: Omit<GenerationJob, 'id' | 'createdAt' | 'status'>): Promise<GenerationJob> {
    const supabase = await this.getClient();
    
    const { data, error } = await supabase
      .from('generations')
      .insert({
        user_id: job.userId,
        prompt: job.prompt,
        params: job.params,
        cost: job.cost,
        status: 'QUEUED'
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      userId: data.user_id,
      prompt: data.prompt,
      params: data.params,
      status: data.status,
      cost: data.cost,
      createdAt: new Date(data.created_at)
    };
  }

  async updateStatus(id: string, status: GenerationJob['status'], errorMsg?: string): Promise<void> {
    const supabase = await this.getClient();
    await supabase
      .from('generations')
      .update({ 
        status: status,
        error_message: errorMsg,
        ...(status === 'COMPLETED' ? { completed_at: new Date().toISOString() } : {})
      })
      .eq('id', id);
  }

  async getById(id: string): Promise<GenerationJob | null> {
    const supabase = await this.getClient();
    const { data } = await supabase.from('generations').select('*').eq('id', id).single();
    if (!data) return null;
    
    return {
      id: data.id,
      userId: data.user_id,
      prompt: data.prompt,
      params: data.params,
      status: data.status,
      cost: data.cost,
      createdAt: new Date(data.created_at)
    };
  }

  async saveImages(images: { generationId: string; userId: string; storagePath: string; seed: number }[]): Promise<void> {
    const supabase = await this.getClient();
    
    // Map DTO to DB columns
    const records = images.map(img => ({
      generation_id: img.generationId,
      user_id: img.userId,
      storage_path: img.storagePath,
      seed: img.seed
    }));

    const { error } = await supabase.from('generated_images').insert(records);
    if (error) throw new Error("Failed to save images: " + error.message);
  }
}
