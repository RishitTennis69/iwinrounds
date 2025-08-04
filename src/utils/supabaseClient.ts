import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helper functions
export const signInWithMagicLink = async (email: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

// Organization helper functions
export const createOrganization = async (name: string) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  // Create organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ name })
    .select()
    .single();

  if (orgError) throw orgError;

  // Add user as admin
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: user.user.id,
      role: 'admin'
    });

  if (memberError) throw memberError;

  // Update user profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.user.id,
      email: user.user.email,
      user_type: 'business_admin',
      organization_id: org.id
    });

  if (profileError) throw profileError;

  return org;
};

export const generateInviteCode = async (organizationId: string, role: 'coach' | 'student') => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

  const { data, error } = await supabase
    .from('invite_codes')
    .insert({
      organization_id: organizationId,
      code,
      role,
      created_by: user.user.id,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const useInviteCode = async (code: string) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  // Get invite code
  const { data: invite, error: inviteError } = await supabase
    .from('invite_codes')
    .select('*, organizations(*)')
    .eq('code', code)
    .is('used_by', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (inviteError) throw new Error('Invalid or expired invite code');

  // Mark invite as used
  const { error: updateError } = await supabase
    .from('invite_codes')
    .update({
      used_by: user.user.id,
      used_at: new Date().toISOString()
    })
    .eq('id', invite.id);

  if (updateError) throw updateError;

  // Add user to organization
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: invite.organization_id,
      user_id: user.user.id,
      role: invite.role
    });

  if (memberError) throw memberError;

  // Update user profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.user.id,
      email: user.user.email,
      user_type: invite.role,
      organization_id: invite.organization_id
    });

  if (profileError) throw profileError;

  return invite;
};

export const getOrganizationMembers = async (organizationId: string) => {
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      *,
      user:profiles(*)
    `)
    .eq('organization_id', organizationId);

  if (error) throw error;
  return data;
};

export const getStudentActivity = async (organizationId: string) => {
  // This would need to be implemented based on how you store debate sessions
  // For now, returning mock data structure
  const { data: members, error } = await supabase
    .from('organization_members')
    .select(`
      *,
      user:profiles(*)
    `)
    .eq('organization_id', organizationId)
    .eq('role', 'student');

  if (error) throw error;
  return members;
};