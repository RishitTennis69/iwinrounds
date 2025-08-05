import { supabase } from '../lib/supabase';

export const testMagicLink = async (email: string) => {
  console.log('🔍 TestEmail: Testing magic link for:', email);
  console.log('🔍 TestEmail: Environment check - VITE_SUPABASE_URL:', !!import.meta.env.VITE_SUPABASE_URL);
  console.log('🔍 TestEmail: Environment check - VITE_SUPABASE_ANON_KEY:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
  
  try {
    console.log('🔍 TestEmail: About to call signInWithOtp');
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
        shouldCreateUser: true,
      },
    });

    console.log('🔍 TestEmail: signInWithOtp response:', { data, error });

    if (error) {
      console.error('🔍 TestEmail: Error sending magic link:', error);
      console.error('🔍 TestEmail: Error details:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
      return { success: false, error: error.message };
    }

    console.log('🔍 TestEmail: Magic link sent successfully:', data);
    console.log('🔍 TestEmail: Response data details:', {
      user: !!data.user,
      session: !!data.session,
      messageId: data.messageId
    });
    return { success: true, data };
  } catch (error) {
    console.error('🔍 TestEmail: Exception in testMagicLink:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Test if Supabase email service is configured
export const testSupabaseEmailConfig = async () => {
  console.log('🔍 TestEmail: Testing Supabase email configuration');
  
  try {
    // Try to get the current project settings
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('🔍 TestEmail: Current user check:', { user: !!user, error: userError });
    
    // Try a simple auth operation to test connection
    const { data, error } = await supabase.auth.signInWithOtp({
      email: 'test@example.com',
      options: {
        emailRedirectTo: window.location.origin,
        shouldCreateUser: false, // Don't create user for this test
      },
    });
    
    console.log('🔍 TestEmail: Email config test result:', { data, error });
    
    if (error) {
      console.error('🔍 TestEmail: Email configuration error:', error);
      return { 
        success: false, 
        error: error.message,
        details: 'This suggests Supabase email service is not properly configured'
      };
    }
    
    return { 
      success: true, 
      message: 'Supabase email service appears to be working'
    };
  } catch (error) {
    console.error('🔍 TestEmail: Exception in email config test:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Connection or configuration issue with Supabase'
    };
  }
}; 