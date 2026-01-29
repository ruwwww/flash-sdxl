import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Note: This client uses the SERVICE_ROLE_KEY and should ONLY be used in server-side API routes / Actions
// blocked from public access. It bypasses RLS.
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
