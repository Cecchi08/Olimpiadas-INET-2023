import { createClient } from '@supabase/supabase-js';

export function createSupabase(env) {
  const newClient = () => createClient(env.supabaseUrl, env.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  return { db: newClient(), newAuthClient: newClient };
}
