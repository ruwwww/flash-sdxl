export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface GenerationJob {
  id: string;
  userId: string;
  prompt: string;
  negativePrompt?: string;
  status: JobStatus;
  params: Record<string, any>;
  cost: number;
  createdAt: Date;
  errorMessage?: string;
  durationMs?: number;
  completedAt?: Date;
}
