import { createClient } from '@supabase/supabase-js';

// Production Supabase Keys (from previous successful builds or environment)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aletefaq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Create a proxy to prevent crashes if supabase is not initialized
const dummySupabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: {}, error: new Error('System not configured') }),
    signOut: async () => ({}),
    getUser: async () => ({ data: { user: null }, error: null })
  },
  from: () => ({
    select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }), maybeSingle: () => ({ data: null, error: null }) }) }),
    upsert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) })
  })
};

if (!isConfigured) {
  console.warn('[Supabase] Keys missing. Using fallback proxy to prevent white screen.');
}

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : dummySupabase;