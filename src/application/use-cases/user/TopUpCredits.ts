import { IUserRepository } from "@/domain/repositories/IUserRepository";

export class TopUpCredits {
  constructor(private userRepo: IUserRepository) {}

  async execute(targetUserId: string, amount: number) {
    if (amount <= 0) throw new Error("Amount must be positive");
    await this.userRepo.addCredits(targetUserId, amount);
  }
}
