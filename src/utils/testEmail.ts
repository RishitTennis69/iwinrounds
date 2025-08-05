import { supabase } from '../lib/supabase';

export const testMagicLink = async (email: string) => {
  console.log('🔍 TestEmail: Testing magic link for:', email);
  
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error('🔍 TestEmail: Error sending magic link:', error);
      return { success: false, error: error.message };
    }

    console.log('🔍 TestEmail: Magic link sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('🔍 TestEmail: Exception in testMagicLink:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}; 