import { supabase } from '@/lib/supabase';

// Wrapper that mimics base44.auth interface using Supabase
export const auth = {
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

  redirectToLogin(returnUrl) {
    window.location.href = '/login';
  },
};

// Wrapper for base44.functions — these are cloud functions that won't work without Base44
// For now, return empty/mock responses so the app doesn't crash
export const functions = {
  async invoke(functionName, params) {
    console.warn(`[functions.invoke] "${functionName}" not available — Base44 cloud functions not migrated yet`);
    
    // Return safe defaults based on function name
    switch (functionName) {
      case 'createStripeCheckout':
      case 'createRetainerCheckout':
        return { url: null, error: 'Payment not configured yet' };
      case 'generateLawyerReportPDF':
        return { url: null, error: 'PDF generation not available yet' };
      case 'legalAssistant':
        return { message: 'المساعد القانوني غير متوفر حالياً' };
      case 'sendTestNotification':
      case 'invoiceDueDateReminder':
        return { success: false, message: 'Notifications not configured yet' };
      default:
        return { error: `Function "${functionName}" not available` };
    }
  },
};

// Combined export mimicking base44 client shape
export const base44 = {
  auth,
  functions,
};
