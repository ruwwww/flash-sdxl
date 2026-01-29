import { User } from "../entities/User";

export interface IUserRepository {
  getById(id: string): Promise<User | null>;
  getAll(): Promise<User[]>; // For admin list
  deductCredits(id: string, amount: number): Promise<void>;
  addCredits(id: string, amount: number): Promise<void>;
  hasSufficientCredits(id: string, amount: number): Promise<boolean>;
}
