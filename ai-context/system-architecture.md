# System Architecture: Flash-SDXL

## 1. High-Level Architecture
The system adopts a **Microservices-lite** approach suited for Docker Compose initially, but scalable to Cloud Native (Kubernetes/Serverless GPU) later.

### Components
1.  **Client (Browser)**: Next.js Frontend. Handles UI, Auth state, and WebSocket connections.
2.  **App Server (Next.js Backend)**:
    -   Orchestrator & API Gateway.
    -   Handles Auth (Supabase Auth).
    -   Manages Credits/Quota logic.
    -   Interacts with Database (Supabase/Postgres).
    -   Proxies requests to SDXL Server (hides GPU infrastructure from public).
    -   Handles Storage generic operations (Presigned URLs for MinIO).
3.  **Inference Engine (SDXL Server - Python/FastAPI)**:
    -   **Computing Unit**. Purely receives JSON prompts, returns status/images.
    -   Internal Priority Queue & Dynamic Batching.
    -   Model State Management (Hot-swap/Caching).
4.  **Database (PostgreSQL / Supabase)**:
    -   Single source of truth for Users, Credits, configurations, and **Generation Jobs**.
5.  **Object Storage (MinIO / S3)**:
    -   Stores generated raw images, upscaled images, and custom model weights (LoRAs).
6.  **Message Broker / Event Bus (Optional/Future)**:
    -   Currently managed via Direct API + polling/WS, but logical slot for Redis/RabbitMQ.

---

## 2. Communication Flow

### A. Generation Request (The "Job" Flow)
1.  **User** configures parameters and clicks "Generate".
2.  **Next.js FE** calls Server Action `generateImage(params)`.
3.  **Next.js BE**:
    -   Validates generic inputs.
    -   Checks/Deducts User Credits.
    -   Creates a row in DB Table `generations` (Status: `QUEUED`).
    -   Sends HTTP POST payload to **SDXL Server** (`/internal/enqueue`).
4.  **SDXL Server**:
    -   Acknowledges request immediately (returns `200 OK` with `job_id`).
    -   Pushes payload to Internal RAM Queue (Batcher).
5.  **SDXL Worker (Background)**:
    -   Picks up jobs, forms a batch.
    -   Runs Inference.
    -   Uploads result images directly to **MinIO** (bucket: `generated-images`).
    -   Inserts records into `generated_images` table (stores specific seed & storage path per image).
    -   Updates DB Table `generations` (Status: `COMPLETED`).
    -   (Optional) Broadcasts "Job Done" event via WebSocket.

### B. Real-time Feedback
-   **WebSocket Server**: Hosted on Next.js (using a separate WS handler or service like Pusher/Supabase Realtime).
-   **Flow**:
    -   SDXL Server sends specific progress updates (Step 5/30) to Next.js webhook.
    -   Next.js forwards to specific connected Client User.

### C. Admin & Configuration (Recompilation)
-   **Admin** changes Model setting in WebUI.
-   **Next.js BE** saves config to DB `model_configs`.
-   **Next.js BE** sends signal `POST /control/swap-model` to SDXL Server.
-   **SDXL Server**:
    -   Checks cache. If compiled model exists, hot-swap.
    -   If not, triggers compilation (status: `OPTIMIZING`).
    -   Requests during `OPTIMIZING` are queued or returned with "Server Busy" depending on strategy.

---

## 3. Database Schema Design (Key Tables)

### `profiles` (Standard Supabase)
- `id` (uuid, PK)
- `email`
- `credits_balance` (int)
- `role` (enum: user, admin, superadmin)

### `generations` (The Job Request)
- `id` (uuid, PK)
- `user_id` (fk -> profiles)
- `prompt` (text)
- `params` (jsonb) -- { batch_size, width, height, steps, cfg, sampler }
- `status` (enum: QUEUED, PROCESSING, COMPLETED, FAILED)
- `duration_ms` (int)
- `cost` (int)
- `created_at`
- `completed_at`

### `generated_images` (Individual Results)
- `id` (uuid, PK)
- `generation_id` (fk -> generations)
- `storage_path` (text) -- MinIO path
- `seed` (bigint) -- The specific seed used for this image
- `created_at`

### `system_configs`
- `key` (varchar) -- e.g., 'active_model', 'batch_size'
- `value` (jsonb)

---

## 4. Environment Variables (Draft)

### Next.js
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SDXL_SERVER_URL=http://sdxl-gpu:8000
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
```

### SDXL Server
```env
# Database access to update status directly (faster) OR verify JWT
DATABASE_URL=postgresql://... 
S3_ENDPOINT=...
MODEL_CACHE_DIR=/models
```
