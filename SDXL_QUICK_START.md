# SDXL Backend Quick Start Guide

This is a quick reference guide for developers implementing an SDXL backend server. For complete details, see [SDXL_BACKEND_API_SPECIFICATION.md](SDXL_BACKEND_API_SPECIFICATION.md).

## TL;DR - What You Need to Implement

### 1. One HTTP Endpoint (Receive Jobs)

```http
POST /internal/queue/enqueue
Header: X-Internal-Secret: <your-secret>
Body: { job_id, user_tier, params, webhook_url }
Response: 200 OK immediately
```

### 2. One Webhook (Send Results)

```http
POST <webhook_url>
Body: { job_id, status, results: [{seed, storage_path}] }
```

### 3. Core Flow

```
1. Receive job request → Return 200 OK immediately
2. Add to priority queue (premium users first)
3. Generate images using SDXL
4. Upload images to S3/MinIO
5. Send webhook with results
```

## Minimal Implementation Checklist

- [ ] HTTP server listening on port 8000
- [ ] Validate `X-Internal-Secret` header
- [ ] Parse request parameters (prompt, width, height, steps, cfg, seed, batch_size)
- [ ] Queue job for async processing
- [ ] Load SDXL model
- [ ] Generate images based on parameters
- [ ] Upload to S3 with path: `{first-2-chars-of-uuid}/{uuid}.png`
- [ ] POST webhook with results
- [ ] Handle errors and send failure webhook

## Required Environment Variables

```bash
INTERNAL_SECRET=your-secret-here
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=generated-images
DEFAULT_WEBHOOK_URL=http://app-server:3000/api/webhooks/sdxl
```

## Example Request

```bash
curl -X POST http://localhost:8000/internal/queue/enqueue \
  -H "X-Internal-Secret: dev-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_tier": "free",
    "params": {
      "prompt": "A beautiful sunset over mountains",
      "width": 1024,
      "height": 1024,
      "steps": 30,
      "cfg": 7.5,
      "seed": 42,
      "batch_size": 1
    }
  }'
```

## Example Webhook Response

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED",
  "duration_ms": 4500,
  "results": [
    {
      "seed": 42,
      "storage_path": "f4/f47ac10b-58cc-4372-a567-0e02b2c3d479.png",
      "mime_type": "image/png"
    }
  ]
}
```

## Key Requirements

### Parameters Validation
- `width`, `height`: 512-1536, divisible by 8
- `steps`: 10-50
- `cfg`: 1.0-20.0
- `batch_size`: 1-4
- `seed`: -1 (random) or 0-2147483647

### Storage Path Format
- Generate new UUID for each image
- Use first 2 chars as directory: `ab/abc123...png`
- Upload with MIME type: `image/png`

### Priority Queue
- `premium` users get higher priority
- `free` users use standard queue
- FIFO within same tier

### Error Handling
- Return 200 OK even if queue is busy
- Send webhook with `status: "FAILED"` on errors
- Retry webhook up to 3 times with exponential backoff

## Technology Recommendations

**Python + FastAPI** (Most Common)
```python
from fastapi import FastAPI, Header
import asyncio

app = FastAPI()

@app.post("/internal/queue/enqueue")
async def enqueue(request: JobRequest, x_internal_secret: str = Header(None)):
    # Validate secret
    # Queue job
    # Return immediately
    asyncio.create_task(process_job(request))
    return {"success": True}
```

**Required Python Libraries:**
- `fastapi` - HTTP server
- `torch` + `diffusers` - SDXL generation
- `boto3` - S3 uploads
- `uvicorn` - ASGI server

## Testing Your Implementation

1. **Start your server**: `python server.py`
2. **Send test request**: Use curl command above
3. **Verify**: Check that webhook is called with results
4. **Check storage**: Verify images are uploaded to S3/MinIO

## Performance Targets

| Metric | Target |
|--------|--------|
| Response time | < 100ms |
| Generation (1 image, 1024x1024, 30 steps) | 2-5s on RTX 4090 |
| Webhook delivery | < 1s |

## Common Pitfalls to Avoid

❌ **Don't** block the HTTP response waiting for generation to complete  
✅ **Do** return 200 OK immediately and process in background

❌ **Don't** upload images with user IDs or timestamps in path  
✅ **Do** use UUID-based sharded paths

❌ **Don't** forget to retry webhook on failure  
✅ **Do** implement exponential backoff retry logic

❌ **Don't** expose server to public internet  
✅ **Do** keep it on internal network with shared secret auth

## Next Steps

1. Read the [full specification](SDXL_BACKEND_API_SPECIFICATION.md)
2. Set up your development environment
3. Implement the minimal checklist above
4. Test with the provided examples
5. Optimize for performance (batching, caching, etc.)

## Getting Help

- Full specification: [SDXL_BACKEND_API_SPECIFICATION.md](SDXL_BACKEND_API_SPECIFICATION.md)
- Example implementation: See `src/infrastructure/gateways/` for reference
- Issues: Create an issue on GitHub

---

**Remember**: This is a quick start guide. Always refer to the complete specification for production deployments.
