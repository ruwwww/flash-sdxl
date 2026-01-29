import { NextRequest, NextResponse } from "next/server";

// This endpoint simulates the "SDXL Server" + "Worker"
// It waits, then calls the real webhook.

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { jobId, params } = body;
  
  console.log(`[Mock Worker] Received Job ${jobId}. simulating processing...`);
  
  // Simulate delay (e.g. 5 seconds)
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Create fake result
  // Using a placeholder image service
  const fakeImages = [];
  const count = params.batch_size || 1;
  const width = params.width || 1024;
  const height = params.height || 1024;
  
  for (let i = 0; i < count; i++) {
    // Generate a consistent random seed based on job id if not provided
    const seed = params.seed || Math.floor(Math.random() * 10000000);
    // Use picsum or similar for visual placeholder
    const rand = Math.floor(Math.random() * 1000);
    fakeImages.push({
      seed: seed + i,
      // We use a public URL that looks like a storage path
      storage_path: `https://picsum.photos/seed/${seed+i}/${width}/${height}`, 
      mime_type: "image/jpeg"
    });
  }
  
  // Call the REAL webhook
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const webhookUrl = `${baseUrl}/api/webhooks/sdxl`;
  
  console.log(`[Mock Worker] Finished. Calling Webhook: ${webhookUrl}`);
  
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        status: 'COMPLETED',
        duration_ms: 5000,
        results: fakeImages
      })
    });
    
    if (!res.ok) {
       console.error("[Mock Worker] Webhook failed:", await res.text());
    }
  } catch (e) {
    console.error("[Mock Worker] Failed to call webhook", e);
  }

  return NextResponse.json({ success: true, message: "Simulation started" });
}
