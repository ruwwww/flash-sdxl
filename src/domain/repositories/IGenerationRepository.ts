import { GenerationJob } from "../entities/GenerationJob";

export interface IGenerationRepository {
  create(job: Omit<GenerationJob, 'id' | 'createdAt' | 'status'>): Promise<GenerationJob>;
  updateStatus(id: string, status: GenerationJob['status'], error?: string): Promise<void>;
  getById(id: string): Promise<GenerationJob | null>;
  
  // New method for saving results
  saveImages(images: GeneratedImageDto[]): Promise<void>;
  
  getImagesByJobId(jobId: string): Promise<GeneratedImageDto[]>;
}

export interface GeneratedImageDto {
  generationId: string;
  userId: string;
  storagePath: string;
  seed: number;
}
