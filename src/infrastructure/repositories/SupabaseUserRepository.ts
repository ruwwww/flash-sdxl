import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { User } from "../../domain/entities/User";
import { createClient } from "@/supabase/server";

export class SupabaseUserRepository implements IUserRepository {
  async getById(id: string): Promise<User | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    
    if (error || !data) {
      console.warn(`[SupabaseUserRepository] User not found or RLS blocked. ID: ${id}`, error);
      return null;
    }
    
    return {
      id: data.id,
      email: data.email,
      role: data.role,
      credits_balance: data.credits_balance
    };
  }

  async getAll(): Promise<User[]> {
    const supabase = await createClient();
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    return data ? data.map(row => ({
      id: row.id,
      email: row.email,
      role: row.role,
      credits_balance: row.credits_balance
    })) : [];
  }

  async deductCredits(id: string, amount: number): Promise<void> {
    // Note: This is not atomic in this simple implementation. 
    // Ideally use a Postgres Function increment/decrement RPC to avoid race conditions.
    const supabase = await createClient();
    
    // Using RPC is safer: create function decrement_credits(user_id uuid, amount int)
    const { error } = await supabase.rpc('decrement_credits', { 
      p_user_id: id, 
      p_amount: amount 
    });

    if (error) {
       // Fallback for MVP if RPC doesn't exist yet (though unsafe for race conditions)
       const user = await this.getById(id);
       if (user) {
         await supabase.from('profiles').update({ 
           credits_balance: user.credits_balance - amount 
         }).eq('id', id);
       }
    }
  }

  async addCredits(id: string, amount: number): Promise<void> {
    const supabase = await createClient();
    const user = await this.getById(id);
    if (user) {
        await supabase.from('profiles').update({ 
            credits_balance: user.credits_balance + amount 
        }).eq('id', id);
    }
  }

  async hasSufficientCredits(id: string, amount: number): Promise<boolean> {
    const user = await this.getById(id);
    if (!user) return false;
    return user.credits_balance >= amount;
  }
}
