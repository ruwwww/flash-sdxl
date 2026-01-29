import { EnqueueJobParams, ISdxlGateway } from "../../domain/repositories/ISdxlGateway";

export class HttpSdxlGateway implements ISdxlGateway {
  constructor(private readonly baseUrl: string, private readonly secret: string) {}

  async enqueueJob(payload: EnqueueJobParams): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/internal/queue/enqueue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': this.secret
      },
      body: JSON.stringify({
        job_id: payload.jobId,
        user_tier: payload.userTier,
        params: payload.params,
        // webhook_url will be added here or handled by environment variable in SDXL spec
      })
    });

    if (!res.ok) {
      throw new Error(`SDXL Server Error: ${res.statusText}`);
    }

    return true;
  }
}
