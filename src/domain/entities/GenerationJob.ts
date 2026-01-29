export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface GenerationJob {
  id: string;
  userId: string;
  prompt: string;
  status: JobStatus;
  params: Record<string, any>;
  cost: number;
  createdAt: Date;
}
