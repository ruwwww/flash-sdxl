export type UserRole = 'user' | 'admin' | 'superadmin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  credits_balance: number;
  is_premium: boolean;
}
