'use server'

import { createClient } from "@/supabase/server";
import { SupabaseSystemConfigRepository } from "@/infrastructure/repositories/SupabaseSystemConfigRepository";
import { FeatureConfig, DEFAULT_FEATURE_CONFIG } from "@/domain/entities/Config";
import { ApiResponse } from "@/application/dtos/shared.dto";

// Get All Configs
export async function getSystemConfigsAction(): Promise<ApiResponse<FeatureConfig>> {
  try {
    const repo = new SupabaseSystemConfigRepository();
    const data = await repo.getByKey('feature_flags');
    
    // Merge with default to ensure extensive type safety
    return { success: true, data: { ...DEFAULT_FEATURE_CONFIG, ...data } };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// Update Config
export async function updateSystemConfigAction(newConfig: FeatureConfig): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Auth Check
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
    
    // Debug Logging
    if (!profile || (profile.role !== 'superadmin' && profile.role !== 'admin')) {
      console.error("[ConfigAction] Unauthorized Access Attempt", { 
        userId: user?.id, 
        profileFound: !!profile, 
        role: profile?.role 
      });
      return { success: false, error: `Unauthorized (Role: ${profile?.role || 'none'})` };
    }

    const repo = new SupabaseSystemConfigRepository();
    await repo.setByKey('feature_flags', newConfig);
    
    return { success: true, data: undefined };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
