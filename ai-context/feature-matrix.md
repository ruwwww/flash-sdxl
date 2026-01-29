# Feature Matrix & Premium Configurations

This document details the features supported by Flash-SDXL, focusing on **Optional Premium Features** and **Superadmin Configurations**.

## 1. Feature Strategy
The system gives Superadmin granular control over every feature using a **Tri-State Configuration**:
1.  **Disabled**: The feature is hidden seamlessly from the UI (or shown as "Coming Soon" if desired).
2.  **Enabled (Free)**: Available to all registered users (Standard Tier).
3.  **Enabled (Premium-Only)**: Visible to all, but locked for Standard users. Only "Premium" role can use it.

Additionally, enabling a feature doesn't mean it's free of charge. The **Credit Cost** is configured separately. A feature can be "Free Access" but still cost "5 Credits" to run.

## 2. Detailed Feature List

### A. Core Generation Features
| Feature | Description | Superadmin Config Options | Premium/Credit Logic |
| :--- | :--- | :--- | :--- |
| **Text-to-Image** | Basic generation using the active loaded model. | `Enable/Disable` | Base Cost (e.g., 1 Credit). |
| **Custom Aspect Ratios** | Non-square ratios (Portrait, Landscape, Cinematic). | `Access Level` (Free vs Premium), `Allowed Ratios List`. | Can cost extra (e.g., +1 Credit for non-standard). |
| **Steps & CFG Control** | Advanced control over generation steps and guidance scale. | `Max Steps Limit` (to prevent GPU hogging). | High steps (>30) can cost multiplier credits. |

### B. Advanced / Premium Features
These features require more GPU resources or external API calls, making them candidates for monetization/restriction.

| Feature | Description | Superadmin Config Options | Billing / Restriction |
| :--- | :--- | :--- | :--- |
| **Hires Fix (Upscale)** | Latent upscaling immediately after generation to fix artifacts/add detail. | `Access Level` (Free vs Premium), `Upscale Factor Limit`. | **Heavy feature**. Typically +2 to +4 Credits. |
| **LoRA Injection** | Applying Low-Rank Adaptations to the base model (Styles, Characters). | `Access Level` (Free vs Premium), `Manage LoRA List`. | Surcharge (e.g., +1 Credit per LoRA used). |
| **Refiner Model** | Using a secondary SDXL Refiner model for the last 20% of steps. | `Access Level` (Free vs Premium). | Multiplier cost (uses 2 models in VRAM). |
| **LLM Prompt Enhancer** | Uses external LLM (vLLM/Ollama) to rewrite simple prompts into detailed descriptions. | `Access Level` (Free vs Premium, `LLM Provider URL`. | Cost per request (optional). |
| **Private History / Storage** | Storing images indefinitely vs auto-deletion. | `Retention Policy` (e.g., 7 days for free). | Premium users get indefinite storage. |

### C. Operational / System Features

| Feature | Description | Config |
| :--- | :--- | :--- |
| **Priority Queue** | System processes requests from VIP users before others. | N/A (Logic handled in SDXL Server) | Premium Users get specific flag sent to `enqueue` endpoint. |
| **Concurrent Requests** | How many requests a user can queue at once. | `Max Concurrent Jobs` per user role. | Free: 1 job. Premium: 3 jobs parallel. |

---

## 3. Superadmin Configuration Dashboard (Specs)

The Superadmin will have a dedicated `/admin/configuration` page to manage these dynamic settings. These settings are stored in the `system_configs` database table.

### Section 1: Monetization Strategy
-   **Credit System Mode**: `[ OFF | ON ]`
    -   *If OFF*: All validated users can generate unlimitedly.
    -   *If ON*: Users must have balance.
-   **Default New User Balance**: `(Integer)` (e.g., 50 credits on signup).

### Section 2: Cost Table (Dynamic Pricing)
Allows the admin to fine-tune the economy without code changes.
-   `Base Generation Price`: 1
-   `Upscale Multiplier`: 2x
-   `LoRA Surcharge`: +1
-   `Refiner Surcharge`: +1

### Section 3: Technical Constraints
-   `Active Model`: [Dropdown of available models on SDXL Server]
-   `Allowed Resolutions`: [1024x1024, 896x1152, 1152x896, ...]
-   `Max Steps`: 50
-   `Maintenance Mode`: `[ ON/OFF ]` (Rejects all new jobs with "System Updating" message).

## 4. Implementation Details

### Database: `system_configs`
Stores key-value pairs for these settings.
```json
{
  "key": "pricing_strategy",
  "value": {
    "base_cost": 1,
    "hires_fix_cost": 2,
    "lora_cost": 1
  }
}
```

### Backend Logic (`CreditCalculator`)
A domain service in the `applications/` layer will calculate cost *before* generation.
```typescript
class CostCalculator {
    calculate(params: GenParams, config: Config): number {
        let cost = config.base_cost;
        if (params.use_hires_fix) cost += config.hires_fix_cost;
        if (params.use_lora) cost += config.lora_cost;
        return cost;
    }
}
```
