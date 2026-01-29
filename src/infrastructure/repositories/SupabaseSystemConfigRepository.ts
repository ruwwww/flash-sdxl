import { ISystemConfigRepository } from "@/domain/repositories/ISystemConfigRepository";
import { createClient } from "@/supabase/server";

export class SupabaseSystemConfigRepository implements ISystemConfigRepository {
  async getByKey(key: string): Promise<any | null> {
    const supabase = await createClient();
    const { data } = await supabase.from('system_configs').select('value').eq('key', key).single();
    return data?.value || null;
  }

  async getAll(): Promise<Record<string, any>> {
    const supabase = await createClient();
    const { data } = await supabase.from('system_configs').select('key, value');
    
    if (!data) return {};
    
    // Transform array to object map
    return data.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, any>);
  }

  async setByKey(key: string, value: any): Promise<void> {
    const supabase = await createClient();
    // Upsert
    const { error } = await supabase.from('system_configs').upsert({
      key,
      value,
      updated_at: new Date().toISOString()
    });
    
    if (error) throw new Error(error.message);
  }
}
