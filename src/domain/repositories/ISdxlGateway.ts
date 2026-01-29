export interface EnqueueJobParams {
  jobId: string;
  params: Record<string, any>;
  userTier: 'free' | 'premium';
}

export interface ISdxlGateway {
  enqueueJob(payload: EnqueueJobParams): Promise<boolean>;
}
