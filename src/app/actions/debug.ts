'use server'

import { createClient } from "@/supabase/server";

export async function getDebugInfoAction() {
  const supabase = await createClient();
  
  // 1. Auth User
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  // 2. Profile Fetch
  let profile = null;
  let profileError = null;
  
  if (user) {
    const res = await supabase.from('profiles').select('*').eq('id', user.id).single();
    profile = res.data;
    profileError = res.error;
  }
  
  // 3. Test RLS bypass (admin check)
  // Use head:true to just get count/check access without fetching data payload if restricted
  const { count, error: configError } = await supabase.from('system_configs').select('*', { count: 'exact', head: true });

  return {
    auth: {
      id: user?.id,
      email: user?.email,
      role: user?.role,
      error: authError
    },
    profile: {
      found: !!profile,
      data: profile,
      error: profileError
    },
    system: {
      configAccess: !configError,
      configError
    }
  };
}
