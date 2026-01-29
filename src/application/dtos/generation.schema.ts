import { z } from 'zod';

// 1. Shared Zod Validation Schema (Used by FE React Hook Form & BE Server Action)
export const CreateGenerationSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(1000),
  negative_prompt: z.string().optional(),
  width: z.number().int().min(512).max(1536),
  height: z.number().int().min(512).max(1536),
  steps: z.number().int().min(10).max(50).default(30),
  cfg: z.number().min(1).max(20).default(7),
  seed: z.number().int().optional(), // Optional for FE (randomized by BE if missing)
  batch_size: z.number().int().min(1).max(4).default(1),
});

// 2. TypeScript Type (Inferred) - For FE Props / Component State
export type CreateGenerationInput = z.infer<typeof CreateGenerationSchema>;

// 3. Output DTO (What the FE receives after generation starts)
// We decouple this from the Domain Entity to control what we expose.
export interface GenerationJobResponse {
  id: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  queuePosition?: number;
  cost: number;
}
