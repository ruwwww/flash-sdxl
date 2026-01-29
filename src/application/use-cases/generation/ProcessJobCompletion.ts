import { IGenerationRepository } from "../../domain/repositories/IGenerationRepository";

export interface JobResult {
  seed: number;
  storage_path: string;
  mime_type: string;
}

export interface ProcessCompletionInput {
  jobId: string;
  status: 'COMPLETED' | 'FAILED';
  error?: string;
  durationMs?: number;
  results?: JobResult[];
}

export class ProcessJobCompletion {
  constructor(
    private generationRepo: IGenerationRepository
    // In real app, maybe notify websocket service here too
  ) {}

  async execute(input: ProcessCompletionInput) {
    if (input.status === 'FAILED') {
      await this.generationRepo.updateStatus(input.jobId, 'FAILED', input.error);
      return;
    }

    // 1. Save Images
    if (input.results && input.results.length > 0) {
      // We need to fetch the job first to get the userId? 
      // Or we can assume the webhook payload might NOT have userId, so we need to query db.
      const job = await this.generationRepo.getById(input.jobId);
      if (!job) throw new Error("Job not found");

      await this.generationRepo.saveImages(input.results.map(r => ({
        generationId: input.jobId,
        userId: job.userId,
        storagePath: r.storage_path,
        seed: r.seed
      })));
    }
    
    // 2. Update status to COMPLETED
    await this.generationRepo.updateStatus(input.jobId, 'COMPLETED');
  }
}
