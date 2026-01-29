# Technical Specifications (Final)

This document serves as the "Source of Truth" for Database Schema, API Contracts, Storage, and Security Rules. It consolidates previous planning into actionable implementation details.

---

## 1. Database Schema (Supabase/PostgreSQL)

### Enum Types
```sql
CREATE TYPE user_role AS ENUM ('user', 'admin', 'superadmin');
CREATE TYPE job_status AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
```

### Tables & DDL

#### 1.1 Profiles (User Data)
Extends Supabase `auth.users`.
```sql
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  role user_role DEFAULT 'user'::user_role,
  credits_balance int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 1.2 System Configs (Dynamic Settings)
Stores feature flags, pricing, and technical constraints.
```sql
CREATE TABLE public.system_configs (
  key text PRIMARY KEY, -- e.g., 'pricing_strategy', 'active_model_config'
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);
```

#### 1.3 Generations (Job Requests)
The header/parent of a generation task.
```sql
CREATE TABLE public.generations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  
  -- Inputs
  prompt text NOT NULL,
  negative_prompt text,
  params jsonb NOT NULL DEFAULT '{}'::jsonb, 
  /* params schema: { 
     width: int, height: int, steps: int, cfg: float, 
     sampler: str, batch_size: int, use_upscale: bool 
  } */

  -- State
  status job_status DEFAULT 'QUEUED'::job_status,
  error_message text,
  
  -- Metrics
  cost int DEFAULT 0,
  duration_ms int,
  
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Index for history queries
CREATE INDEX idx_generations_user_created ON public.generations(user_id, created_at DESC);
```

#### 1.4 Generated Images (Outputs)
The actual files produced. Denormalized `user_id` key included for efficient RLS.
```sql
CREATE TABLE public.generated_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id uuid REFERENCES public.generations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) NOT NULL, -- optimization for RLS
  
  storage_path text NOT NULL, -- e.g., "ab/c1/abc123...png"
  seed bigint NOT NULL,
  
  -- Metadata
  width int,
  height int,
  
  created_at timestamptz DEFAULT now()
);
```

---

## 2. Security & RLS Policies

**Principle**: "Deny All" by default. Explicitly enable access.

### 2.1 Profiles
- **SELECT**: Users see their own. Admins see all.
  - `auth.uid() = id OR auth.jwt()->>'role' IN ('admin', 'superadmin')`
- **UPDATE**: Users can update non-critical fields (none for now). System (Service Role) updates credits.

### 2.2 Generations & Generated Images
- **SELECT**: Users see their own rows.
  - `auth.uid() = user_id`
- **INSERT**: Users can insert their own rows (via Server Action/Backend generally, but if RLS enabled for client, must strict). 
  - *Note*: In our Clean Arch, we use Server Actions. The BE usually runs with high privilege or context. If pure RLS: `auth.uid() = user_id`.

### 2.3 System Configs
- **SELECT**: Accessible to Authenticated users (for reading feature flags) OR restricted to Service Role (BE passes config to FE).
  - *Recommendation*: Public/Auth Read.
- **UPDATE/INSERT**: Superadmin ONLY.

---

## 3. Storage Strategy (MinIO/S3)

**Bucket Name**: `generated-images`

### Path Naming Convention
To ensure massive scalability and avoid filesystem hotspots/exposing user info, we use a **Content-Addressable** or **UUID Sharded** approach.

**Format**: `/{shard_prefix}/{image_uuid}.png`

- `image_uuid`: A generic UUIDv4 generated for the image.
- `shard_prefix`: First 2 characters of the UUID.

**Example**:
- UUID: `f47ac10b-58cc-4372-a567-0e02b2c3d479`
- Path: `f4/f47ac10b-58cc-4372-a567-0e02b2c3d479.png`

**Why?**
1.  **Efficient**: No timestamps or User IDs deep in the path suitable for fast object lookups.
2.  **Private**: URL does not reveal who owns it or when it was made.
3.  **Flat**: Easy to migrate.

---

## 4. API Contracts

### 4.1 FE -> BE (Server Action / Internal API)
**Function**: `createGenerationJob(data)`
**Input (Zod)**:
```typescript
{
  prompt: string.min(1),
  negative_prompt?: string,
  width: number, // validated against allowed list
  height: number,
  steps: number.min(10).max(50),
  cfg: number,
  seed?: number,
  batch_size: number.min(1).max(4)
}
```

### 4.2 BE -> SDXL Server (HTTP POST)
**Endpoint**: `POST /internal/queue/enqueue`
**Header**: `X-Internal-Secret: <Shared_Secret>`
**Payload**:
```json
{
  "job_id": "uuid-string",
  "user_tier": "premium", // used for priority queue
  "params": {
    "prompt": "cyborg panda...",
    "negative_prompt": "blurry",
    "width": 1024,
    "height": 1024,
    "steps": 30,
    "cfg": 7.0,
    "seed": 123456789, // if -1, SDXL chooses and returns it
    "batch_size": 2,
    "sampler": "Euler a"
  },
  "webhook_url": "http://next-app:3000/api/internal/webhook/job-result"
}
```

### 4.3 SDXL Server -> BE (Webhook)
**Endpoint**: `POST /api/internal/webhook/job-result`
**Payload**:
```json
{
  "job_id": "uuid-string",
  "status": "COMPLETED", // or FAILED
  "error": null,
  "duration_ms": 4500,
  "results": [
    {
      "seed": 123456789,
      "storage_path": "f4/f47ac10b-58cc-4372-a567-0e02b2c3d479.png",
      "mime_type": "image/png"
    },
    {
      "seed": 123456790,
      "storage_path": "a1/a1b2c3d4-....png",
      "mime_type": "image/png"
    }
  ]
}
```
