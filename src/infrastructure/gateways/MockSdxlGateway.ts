import { EnqueueJobParams, ISdxlGateway } from "../../domain/repositories/ISdxlGateway";

export class MockSdxlGateway implements ISdxlGateway {
  // We don't really use auth params here, but constructor matches logic
  constructor() {}

  async enqueueJob(payload: EnqueueJobParams): Promise<boolean> {
    console.log("[MockSdxlGateway] Enqueuing Job:", payload.jobId);
    
    // Simulate async processing
    // In a real server action, we can't await a setTimeout comfortably without blocking response.
    // However, since we want to return "ID: 123, Status: QUEUED" to the user immediately,
    // we must NOT await the simulation here if we want non-blocking UI.
    
    // BUT Vercel/NextJS serverless functions will freeze background tasks.
    // OPTION 1: Just pretend it worked. You must manually call the webhook via curl / Postman.
    // OPTION 2: Use `fetch` (fire and forget) to a helper API route that sleeps then calls webhook.
    
    // We choose Option 2 for better DX.
    // Sending a request to our own API to simulate the worker.
    // Note: Assuming running on localhost:3000
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // We Fire-and-forget this fetch (don't await it strictly, or catch error so main flow proceeds)
    // Actually, to ensure it fires in serverless, we usually rely on specialized queues (QStash).
    // For local docker dev, a fetch is fine.
    
    fetch(`${baseUrl}/api/mock/sdxl-worker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.error("Mock worker trigger failed", err));

    return true;
  }
}
