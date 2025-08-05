import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, firstName?: string, lastName?: string, userType?: 'individual' | 'organization', organizationName?: string, entryCode?: string) => Promise<{ isNewUser: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  checkUserExists: (email: string) => Promise<boolean>;
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
    
    // Handle auth callback from magic link
    const handleAuthCallback = async () => {
      console.log('🔍 AuthProvider: Handling auth callback');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔍 AuthProvider: Error getting session in callback:', error);
          setLoading(false);
          return;
        }
        
        if (session) {
          console.log('🔍 AuthProvider: Session found in callback');
          setSession(session);
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          console.log('🔍 AuthProvider: No session in callback');
          setLoading(false);
        }
        
        // Clear URL parameters after processing
        if (window.location.hash.includes('access_token')) {
          console.log('🔍 AuthProvider: Clearing URL parameters');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (error) {
        console.error('🔍 AuthProvider: Error in handleAuthCallback:', error);
        setLoading(false);
      }
    };

    // Check if this is an auth callback
    if (window.location.hash.includes('access_token')) {
      console.log('🔍 AuthProvider: Auth callback detected in URL');
      handleAuthCallback();
    } else {
      console.log('🔍 AuthProvider: No auth callback, getting initial session');
    }

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

    // Call with timeout
    const sessionTimeout = setTimeout(() => {
      console.log('🔍 AuthProvider: Session fetch timeout, setting loading to false');
      setLoading(false);
    }, 2000);

    getInitialSession().finally(() => {
      clearTimeout(sessionTimeout);
    });

    // Listen for auth changes with better error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔍 AuthProvider: Auth state change event:', event, 'session:', !!session);
      
      try {
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
      } catch (error) {
        console.error('🔍 AuthProvider: Error in auth state change:', error);
        setLoading(false);
      }
    });
    
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
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

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
    } catch (error) {
      console.error('🔍 AuthProvider: Error in fetchProfile:', error);
      // Even if profile fetch fails, set loading to false and continue
      console.log('🔍 AuthProvider: Profile fetch failed, setting loading to false and continuing');
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
      let userType = 'individual';
      let organizationId = null;
      
      console.log('🔍 AuthProvider: Pending info from localStorage:', pendingInfo);
      
      if (pendingInfo) {
        try {
          const { userType: pendingUserType, organizationName } = JSON.parse(pendingInfo);
          userType = pendingUserType || 'individual';
          
          console.log('🔍 AuthProvider: Parsed pending info:', { userType, organizationName });
          
          // If it's an organization user, create the organization first
          if (userType === 'organization' && organizationName) {
            console.log('🔍 AuthProvider: Creating organization during profile creation:', organizationName);
            
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
              // Don't throw error, just log it and continue with profile creation
              console.log('🔍 AuthProvider: Continuing with profile creation without organization');
            } else {
              organizationId = orgData.id;
              console.log('🔍 AuthProvider: Organization created with ID:', organizationId);
              // Change user type to business_admin for organization creators
              userType = 'business_admin';
              
              // Add the creator as a member of the organization
              const { error: memberError } = await supabase
                .from('organization_members')
                .insert({
                  organization_id: organizationId,
                  user_id: userId,
                  role: 'business_admin'
                });
              
              if (memberError) {
                console.error('🔍 AuthProvider: Error adding organization member:', memberError);
                // Don't throw here, as the profile creation should still succeed
              } else {
                console.log('🔍 AuthProvider: Organization member record created');
              }
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
          user_type: userType === 'organization' ? 'business_admin' : userType as 'individual' | 'business_admin' | 'coach' | 'student',
          organization_id: organizationId,
        })
        .select()
        .single();

      if (error) {
        console.error('🔍 AuthProvider: Error creating profile:', error);
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
        // Don't throw the error, just log it and continue
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
      // Don't throw the error, just log it and continue
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

  const signIn = async (email: string, firstName?: string, lastName?: string, userType?: 'individual' | 'organization', organizationName?: string, entryCode?: string): Promise<{ isNewUser: boolean }> => {
    try {
      console.log('🔍 AuthProvider: signIn called with email:', email);
      
      // Temporarily skip user existence check due to RLS issues
      // const userExists = await checkUserExists(email);
      // console.log('🔍 AuthProvider: User exists check result:', userExists);
      const userExists = false; // Assume new user for now
      console.log('🔍 AuthProvider: Skipping user existence check due to RLS issues');
      
      // Prepare the redirect URL
      const redirectUrl = window.location.origin;
      console.log('🔍 AuthProvider: Using redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: true, // Allow creating new users
        },
      });

      if (error) {
        console.error('🔍 AuthProvider: Error in signInWithOtp:', error);
        throw error;
      }

      console.log('🔍 AuthProvider: Magic link sent successfully:', data);

      // If it's a new user, store additional info for profile creation
      if (!userExists && firstName && lastName) {
        const pendingInfo = {
          firstName,
          lastName,
          userType: userType || 'individual',
          organizationName,
          entryCode
        };
        localStorage.setItem('pending_user_info', JSON.stringify(pendingInfo));
        console.log('🔍 AuthProvider: Stored pending user info:', pendingInfo);
      }

      return { isNewUser: !userExists };
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

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signOut,
    updateProfile,
    checkUserExists,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 