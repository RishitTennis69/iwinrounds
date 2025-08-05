import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  supabase: typeof supabase;
  signIn: (email: string, password: string, firstName?: string, lastName?: string, userType?: 'organizer' | 'student', organizationName?: string, inviteCode?: string) => Promise<{ isNewUser: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  checkUserExists: (email: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  createInviteCode: (organizationId: string, email: string) => Promise<string>;
  useInviteCode: (code: string, userId: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('🔍 AuthProvider: Component rendering');
  console.log('🔍 AuthProvider: Current URL:', window.location.href);
  
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileCache, setProfileCache] = useState<Map<string, Profile>>(new Map());

  console.log('🔍 AuthProvider: Initial state:', { user: !!user, profile: !!profile, loading, profileLoading });

  useEffect(() => {
    console.log('🔍 AuthProvider: useEffect running');
    
    // Set a timeout to prevent endless loading
    const loadingTimeout = setTimeout(() => {
      console.log('🔍 AuthProvider: Loading timeout reached, forcing loading to false');
      setLoading(false);
    }, 3000); // Reduced to 3 seconds
    
    // Get initial session with better error handling
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔍 AuthProvider: Error getting initial session:', error);
          setLoading(false);
          return;
        }
        
        console.log('🔍 AuthProvider: Initial session result:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('🔍 AuthProvider: User found, fetching profile');
          await fetchProfile(session.user.id);
        } else {
          console.log('🔍 AuthProvider: No user found, setting loading to false');
          setLoading(false);
        }
      } catch (error) {
        console.error('🔍 AuthProvider: Error getting initial session:', error);
        setLoading(false);
      }
    };

    // Get initial session
    getInitialSession();
    
    // Listen for auth changes with better error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔍 AuthProvider: Auth state change event:', event, 'session:', !!session);
      console.log('🔍 AuthProvider: Auth state change details:', {
        event,
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      });
      
      try {
        // Handle different auth events
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('🔍 AuthProvider: User signed in or token refreshed');
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log('🔍 AuthProvider: User in auth state change, fetching profile');
            await fetchProfile(session.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('🔍 AuthProvider: User signed out');
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        } else {
          console.log('🔍 AuthProvider: Other auth event:', event);
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log('🔍 AuthProvider: User in auth state change, fetching profile');
            await fetchProfile(session.user.id);
          } else {
            console.log('🔍 AuthProvider: No user in auth state change, clearing profile');
            setProfile(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('🔍 AuthProvider: Error in auth state change:', error);
        setLoading(false);
      }
    });
    
    console.log('🔍 AuthProvider: Auth state change listener set up successfully');
    
    return () => {
      console.log('🔍 AuthProvider: Cleaning up subscription and timeout');
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    console.log('🔍 AuthProvider: fetchProfile called for userId:', userId);
    
    // Check cache first
    if (profileCache.has(userId)) {
      console.log('🔍 AuthProvider: Using cached profile');
      setProfile(profileCache.get(userId)!);
      setLoading(false);
      return;
    }

    setProfileLoading(true);
    
    try {
      console.log('🔍 AuthProvider: Fetching profile from database');
      
      // Add timeout to prevent hanging
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000);
      });
      
      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

      if (error) {
        console.error('🔍 AuthProvider: Error fetching profile:', error);
        
        // If profile doesn't exist, create one
        if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') {
          console.log('🔍 AuthProvider: Profile not found, creating new profile');
          
          // Check for pending user info before creating profile
          const pendingInfo = localStorage.getItem('pending_user_info');
          let firstName, lastName;
          
          if (pendingInfo) {
            try {
              const parsed = JSON.parse(pendingInfo);
              firstName = parsed.firstName;
              lastName = parsed.lastName;
              console.log('🔍 AuthProvider: Found pending info for profile creation:', { firstName, lastName });
            } catch (error) {
              console.error('🔍 AuthProvider: Error parsing pending info:', error);
            }
          }
          
          await createProfile(userId, firstName, lastName);
        } else {
          // For other errors, still set loading to false
          console.log('🔍 AuthProvider: Profile fetch failed, setting loading to false');
          setLoading(false);
        }
      } else {
        console.log('🔍 AuthProvider: Profile fetched successfully:', data);
        setProfile(data);
        
        // Cache the profile
        setProfileCache(prev => new Map(prev.set(userId, data)));
        setLoading(false);
      }
    } catch (timeoutError) {
      console.error('🔍 AuthProvider: Profile fetch timed out:', timeoutError);
      console.log('🔍 AuthProvider: Setting loading to false due to timeout');
      
      // Even if profile fetch fails, keep the user logged in
      console.log('🔍 AuthProvider: Keeping user logged in despite profile fetch timeout');
      setLoading(false);
    } finally {
      setProfileLoading(false);
    }
  };

  const createProfile = async (userId: string, firstName?: string, lastName?: string) => {
    try {
      console.log('🔍 AuthProvider: createProfile called with:', { userId, firstName, lastName });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('🔍 AuthProvider: No user found, skipping profile creation');
        return;
      }

      console.log('🔍 AuthProvider: Current user:', { id: user.id, email: user.email });

      // Check for pending user info to get the correct user_type
      const pendingInfo = localStorage.getItem('pending_user_info');
      let userType = 'student'; // Default to student
      let organizationId = null;
      let inviteCode = null;
      
      console.log('🔍 AuthProvider: Pending info from localStorage:', pendingInfo);
      
      if (pendingInfo) {
        try {
          const { userType: pendingUserType, organizationName, inviteCode: pendingInviteCode } = JSON.parse(pendingInfo);
          userType = pendingUserType || 'student';
          inviteCode = pendingInviteCode;
          
          console.log('🔍 AuthProvider: Parsed pending info:', { userType, organizationName, inviteCode });
          
          // If it's an organizer, check for existing organization first
          if (userType === 'organizer' && organizationName) {
            console.log('🔍 AuthProvider: Checking for existing organization for email:', user.email);
            
            // Check if user already has an organization
            const { data: existingOrg, error: orgCheckError } = await supabase
              .from('organizations')
              .select('id, name')
              .eq('creator_email', user.email)
              .single();
            
            if (orgCheckError && orgCheckError.code !== 'PGRST116') {
              console.error('🔍 AuthProvider: Error checking existing organization:', orgCheckError);
            }
            
            if (existingOrg) {
              console.log('🔍 AuthProvider: Found existing organization:', existingOrg);
              organizationId = existingOrg.id;
              
              // Check if user is already a member
              const { data: existingMember, error: memberCheckError } = await supabase
                .from('organization_members')
                .select('id')
                .eq('organization_id', organizationId)
                .eq('user_id', userId)
                .single();
              
              if (memberCheckError && memberCheckError.code !== 'PGRST116') {
                console.error('🔍 AuthProvider: Error checking existing membership:', memberCheckError);
              }
              
              if (!existingMember) {
                // Add user as organizer to existing organization
                const { error: addMemberError } = await supabase
                  .from('organization_members')
                  .insert({
                    organization_id: organizationId,
                    user_id: userId,
                    role: 'organizer'
                  });
                
                if (addMemberError) {
                  console.error('🔍 AuthProvider: Error adding user to existing organization:', addMemberError);
                } else {
                  console.log('🔍 AuthProvider: User added to existing organization');
                }
              } else {
                console.log('🔍 AuthProvider: User already a member of existing organization');
              }
            } else {
              // Create new organization
              console.log('🔍 AuthProvider: Creating new organization:', organizationName);
              
              const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .insert({ 
                  name: organizationName,
                  creator_name: `${firstName || ''} ${lastName || ''}`.trim() || null,
                  creator_email: user?.email || null
                })
                .select()
                .single();
              
              if (orgError) {
                console.error('🔍 AuthProvider: Error creating organization:', orgError);
                console.log('🔍 AuthProvider: Continuing with profile creation without organization');
              } else {
                organizationId = orgData.id;
                console.log('🔍 AuthProvider: Organization created with ID:', organizationId);
                
                // Add the creator as a member of the organization
                const { error: memberError } = await supabase
                  .from('organization_members')
                  .insert({
                    organization_id: organizationId,
                    user_id: userId,
                    role: 'organizer'
                  });
                
                if (memberError) {
                  console.error('🔍 AuthProvider: Error adding organization member:', memberError);
                } else {
                  console.log('🔍 AuthProvider: Organization member record created');
                }
              }
            }
          }
          
          // If there's an invite code, use it
          if (inviteCode) {
            console.log('🔍 AuthProvider: Using invite code:', inviteCode);
            try {
              const result = await useInviteCode(inviteCode, userId);
              if (result === 'success') {
                console.log('🔍 AuthProvider: Invite code used successfully');
                // The useInviteCode function will handle adding to organization
              } else if (result === 'already_member') {
                console.log('🔍 AuthProvider: User already a member of the organization');
              }
            } catch (inviteError) {
              console.error('🔍 AuthProvider: Error using invite code:', inviteError);
              // Continue with profile creation even if invite code fails
            }
          }
        } catch (error) {
          console.error('🔍 AuthProvider: Error parsing pending user info:', error);
        }
      }

      console.log('🔍 AuthProvider: Creating profile with user_type:', userType, 'organization_id:', organizationId);

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: user.email!,
          first_name: firstName || null,
          last_name: lastName || null,
          user_type: userType as 'organizer' | 'student',
          organization_id: organizationId,
        })
        .select()
        .single();

      if (error) {
        console.error('🔍 AuthProvider: Error creating profile:', error);
        
        // If profile already exists (from trigger), try to update it instead
        if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
          console.log('🔍 AuthProvider: Profile already exists, updating instead');
          
          const { data: updateData, error: updateError } = await supabase
            .from('profiles')
            .update({
              first_name: firstName || null,
              last_name: lastName || null,
              user_type: userType as 'organizer' | 'student',
              organization_id: organizationId,
            })
            .eq('id', userId)
            .select()
            .single();
          
          if (updateError) {
            console.error('🔍 AuthProvider: Error updating existing profile:', updateError);
            return;
          } else {
            console.log('🔍 AuthProvider: Profile updated successfully:', updateData);
            setProfile(updateData);
            
            // Clear pending user info after successful update
            if (pendingInfo) {
              localStorage.removeItem('pending_user_info');
              console.log('🔍 AuthProvider: Cleared pending user info');
            }
            return;
          }
        }
        
        console.error('🔍 AuthProvider: Profile creation failed with details:', {
          userId,
          email: user.email,
          firstName,
          lastName,
          userType,
          organizationId,
          error: error.message,
          code: error.code
        });
        return;
      } else {
        console.log('🔍 AuthProvider: Profile created successfully:', data);
        setProfile(data);
        
        // Clear pending user info after successful creation
        if (pendingInfo) {
          localStorage.removeItem('pending_user_info');
          console.log('🔍 AuthProvider: Cleared pending user info');
        }
      }
    } catch (error) {
      console.error('🔍 AuthProvider: Error in createProfile:', error);
    }
  };

  const checkUserExists = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (error) {
        // User doesn't exist
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error('🔍 AuthProvider: Error checking user existence:', error);
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      console.log('🔍 AuthProvider: resetPassword called for email:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      
      if (error) {
        console.error('🔍 AuthProvider: Error resetting password:', error);
        throw error;
      }
      
      console.log('🔍 AuthProvider: Password reset email sent successfully');
    } catch (error) {
      console.error('🔍 AuthProvider: Error in resetPassword:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string, firstName?: string, lastName?: string, userType?: 'organizer' | 'student', organizationName?: string, inviteCode?: string): Promise<{ isNewUser: boolean }> => {
    try {
      console.log('🔍 AuthProvider: signIn called with email:', email);
      console.log('🔍 AuthProvider: signIn parameters:', {
        email,
        firstName,
        lastName,
        userType,
        organizationName,
        inviteCode
      });
      
      // Validate email
      if (!email || !email.includes('@')) {
        throw new Error('Invalid email address');
      }
      
      // Check if user exists first
      const userExists = await checkUserExists(email);
      console.log('🔍 AuthProvider: User exists check result:', userExists);
      
      if (userExists) {
        // User exists, try to sign in with password
        console.log('🔍 AuthProvider: User exists, attempting sign in');
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          console.error('🔍 AuthProvider: Error signing in existing user:', error);
          
          // Check if this is a magic link only user (no password set)
          if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid email or password')) {
            // This might be a magic link only user
            console.log('🔍 AuthProvider: User might be magic link only, checking...');
            
            // For now, we'll throw a specific error that the UI can handle
            throw new Error('This account was created with magic links. Please use the "Forgot Password" option to set a new password.');
          }
          
          throw new Error('Invalid email or password');
        }
        
        console.log('🔍 AuthProvider: Existing user signed in successfully');
        return { isNewUser: false };
      } else {
        // New user, create account
        console.log('🔍 AuthProvider: Creating new user account');
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              user_type: userType || 'student'
            }
          }
        });
        
        if (error) {
          console.error('🔍 AuthProvider: Error creating new user:', error);
          throw error;
        }
        
        console.log('🔍 AuthProvider: New user created successfully');
        
        // Store additional info for profile creation
        if (firstName && lastName) {
          const pendingInfo = {
            firstName,
            lastName,
            userType: userType || 'student',
            organizationName,
            inviteCode
          };
          localStorage.setItem('pending_user_info', JSON.stringify(pendingInfo));
          console.log('🔍 AuthProvider: Stored pending user info:', pendingInfo);
        }
        
        return { isNewUser: true };
      }
    } catch (error) {
      console.error('🔍 AuthProvider: Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('🔍 AuthProvider: Error signing out:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error('🔍 AuthProvider: Error updating profile:', error);
      throw error;
    }
  };

  const createInviteCode = async (organizationId: string, email: string) => {
    try {
      console.log('🔍 AuthProvider: createInviteCode called for organizationId:', organizationId, 'email:', email);
      const { data, error } = await supabase
        .from('invite_codes')
        .insert({
          organization_id: organizationId,
          email: email,
          code: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15), // Simple random code
          created_by: user?.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('🔍 AuthProvider: Error creating invite code:', error);
        throw error;
      }
      console.log('🔍 AuthProvider: Invite code created successfully:', data);
      return data.code;
    } catch (error) {
      console.error('🔍 AuthProvider: Error in createInviteCode:', error);
      throw error;
    }
  };

  const useInviteCode = async (code: string, userId: string) => {
    try {
      console.log('🔍 AuthProvider: useInviteCode called for code:', code, 'userId:', userId);
      const { data, error } = await supabase
        .from('invite_codes')
        .select('organization_id, email')
        .eq('code', code)
        .single();

      if (error) {
        console.error('🔍 AuthProvider: Error using invite code:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Invite code not found or expired.');
      }

      const { organization_id, email } = data;

      // Check if the user is already a member of the organization
      const { data: existingMember, error: memberError } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organization_id)
        .eq('user_id', userId)
        .single();

      if (memberError) {
        console.error('🔍 AuthProvider: Error checking existing member:', memberError);
        throw memberError;
      }

      if (existingMember) {
        console.log('🔍 AuthProvider: User already a member of the organization.');
        return 'already_member';
      }

      // Add the user as a member of the organization
      const { error: addMemberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: organization_id,
          user_id: userId,
          role: 'student', // Default role for new members
        });

      if (addMemberError) {
        console.error('🔍 AuthProvider: Error adding member to organization:', addMemberError);
        throw addMemberError;
      }

      console.log('🔍 AuthProvider: User added to organization successfully.');
      return 'success';
    } catch (error) {
      console.error('🔍 AuthProvider: Error in useInviteCode:', error);
      throw error;
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    supabase,
    signIn,
    signOut,
    updateProfile,
    checkUserExists,
    resetPassword,
    createInviteCode,
    useInviteCode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 