import { createClient } from '@supabase/supabase-js';

export function createSupabase(env) {
  const newClient = () => createClient(env.supabaseUrl, env.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, options = {}) => fetch(input, {
        ...options,
        signal: options.signal
          ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)])
          : AbortSignal.timeout(15000)
      })
    }
  });
  return { db: newClient(), newAuthClient: newClient };
}
