# SDXL Server Specifications

> **⚠️ DEPRECATED:** This document has been superseded by the comprehensive [SDXL Backend API Specification](../SDXL_BACKEND_API_SPECIFICATION.md) located in the root directory.
> 
> **Please refer to `/SDXL_BACKEND_API_SPECIFICATION.md` for the complete and up-to-date specification.**

---

## Historical Notes (For Reference Only)

## Overview
This component is a high-performance Python application containerized with Docker. It serves as the "Backend for Frontend's Worker". It is responsible for GPU memory management, Model compilation, Inference, and Image Upload.

## Tech Stack
-   **Language**: Python 3.10+
-   **Framework**: FastAPI (for HTTP Interface) + Uvicorn
-   **Inference**: PyTorch 2.x (with TorchInductor/TensorRT) / Diffusers
-   **Queue/Concurrency**: `asyncio` priority queue (internal) or simple list for batching logic.
-   **Storage Client**: `boto3` or `minio` python client.

## Core Modules

### 1. API Interface (`server.py`)
-   **`POST /generate`**: Accepts JSON payload. Returns `job_id`.
    -   Payload: `prompt`, `negative_prompt`, `width`, `height`, `steps`, `seed`, `batch_size` (1 by default from user).
-   **`POST /config/model`**: Trigger model swap/load.
-   **`GET /health`**: Returns GPU stats (VRAM usage, temperature) and Queue depth.

### 2. The Coordinator (Batcher)
-   Runs a continuous loop (Consumer).
-   Pulls requests from the internal queue.
-   **Dynamic Batching Logic**:
    -   Wait `x` ms to see if more requests come in with *same resolution*.
    -   Group them into a tensor batch (max size defined in config).
    -   Send to Inference Engine.

### 3. Inference Engine
-   **Base Model**: SDXL 1.0 / Refiner / Turbo.
-   **Optimization**:
    -   FP8 Quantization (if hardware supports).
    -   `torch.compile()` mode.
    -   Flash Attention 2 integration.
-   **LoRA Handler**: Ability to merge LoRA weights on the fly or keep cached pipelines.

### 4. Storage Handler
-   Post-inference, images are tensors.
-   Convert to PNG/WebP (async CPU task, do not block GPU loop).
-   Upload to MinIO.
-   Return URL/Path to Coordinator to notify Database.

## Optimization Strategy (Recompilation)
-   **Cache**: Store compiled graphs (TRT engines or Inductor cache) on disk mapped volume.
-   **Swap**: When switching generic resolution buckets (e.g., 1024x1024 to 896x1152), rely on "Bucketing" to avoid full recompile if possible, or keep hot-loaded pipelines if VRAM allows.

## Docker Requirements (not finalized)
-   Base Image: `nvidia/cuda:12.1-cudnn8-runtime-ubuntu22.04`
-   Dependencies: `torch`, `xformers`, `diffusers`, `fastapi`, `boto3`.
