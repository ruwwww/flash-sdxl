import { IGenerationRepository } from "../../domain/repositories/IGenerationRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ISdxlGateway } from "../../domain/repositories/ISdxlGateway";

export interface CreateGenerationInput {
  userId: string;
  prompt: string;
  params: Record<string, any>; // width, height, cfg, etc.
}

export class CreateGenerationJob {
  constructor(
    private generationRepo: IGenerationRepository,
    private userRepo: IUserRepository,
    private sdxlGateway: ISdxlGateway
  ) {}

  async execute(input: CreateGenerationInput) {
    // 1. Calculate Cost (Simplification: Fixed cost for MVP)
    const cost = 1; 

    // 2. Check Credits
    const hasCredit = await this.userRepo.hasSufficientCredits(input.userId, cost);
    if (!hasCredit) {
      throw new Error("Insufficient credits");
    }

    // 3. Create Job in DB (Status: QUEUED)
    const job = await this.generationRepo.create({
      userId: input.userId,
      prompt: input.prompt,
      params: input.params,
      cost: cost
    });

    // 4. Send to SDXL Server
    // Determine tier based on logic (later refactor to User entity logic)
    const user = await this.userRepo.getById(input.userId);
    const tier = user?.role !== 'user' ? 'premium' : 'free'; // simplified

    try {
      await this.sdxlGateway.enqueueJob({
        jobId: job.id,
        params: input.params,
        userTier: tier
      });
    } catch (error) {
      // Revert/Mark failed if gateway fails
      await this.generationRepo.updateStatus(job.id, 'FAILED', 'Failed to dispatch to GPU Worker');
      throw new Error("Failed to start generation process");
    }

    // 5. Deduct Credits
    await this.userRepo.deductCredits(input.userId, cost);

    return job;
  }
}
