import { supabase } from '@/lib/supabase';
import { base44 as realClient } from './base44Client';

// Wrapper that mimics base44.auth interface using Supabase
const auth = {
  ...realClient.auth,
  async me() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    return profile ? { ...user, ...profile, full_name: profile.full_name, role: profile.role } : user;
  },

  async updateMe(updates) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async logout(redirectTo) {
    await supabase.auth.signOut();
    localStorage.removeItem('app_role');
    localStorage.removeItem('base44_access_token');
    localStorage.removeItem('token');
    if (redirectTo) window.location.href = redirectTo;
  },

  redirectToLogin() {
    window.location.href = '/login';
  },
};

// Combined export merging real client with custom overrides
// This ensures 'integrations', 'entities', and other SDK internal methods are available
export const base44 = {
  ...realClient,
  auth,
  functions: realClient.functions,
};