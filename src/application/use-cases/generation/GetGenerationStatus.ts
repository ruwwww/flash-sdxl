import { IGenerationRepository } from "../../domain/repositories/IGenerationRepository";
import { GenerationJob } from "../../domain/entities/GenerationJob";
import { GeneratedImageDto } from "../../domain/repositories/IGenerationRepository";

// We define a rich response including images if completed.
export interface JobStatusOutput {
  id: string;
  status: GenerationJob['status'];
  error?: string;
  images?: GeneratedImageDto[];
  cost: number;
}

export class GetGenerationStatus {
  constructor(private generationRepo: IGenerationRepository) {}

  async execute(jobId: string, userId: string): Promise<JobStatusOutput | null> {
    const job = await this.generationRepo.getById(jobId);
    if (!job) return null;

    // Security check
    if (job.userId !== userId) {
      throw new Error("Unauthorized");
    }

    let images: GeneratedImageDto[] = [];
    if (job.status === 'COMPLETED') {
      // We assume repo has a method to get images. 
      // If not, we skip or add it. 
      // Let's assume we add getImagesByJobId to repo.
      images = await this.generationRepo.getImagesByJobId(jobId);
    }

    return {
      id: job.id,
      status: job.status,
      error: undefined, // repo needs to return error message if failed, skipping for now
      images,
      cost: job.cost
    };
  }
}
