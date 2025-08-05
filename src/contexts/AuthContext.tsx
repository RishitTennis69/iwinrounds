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

  console.log('🔍 AuthProvider: Initial state:', { user: !!user, profile: !!profile, loading });

  useEffect(() => {
    console.log('🔍 AuthProvider: useEffect running');
    
    // Handle auth callback from magic link
    const handleAuthCallback = async () => {
      console.log('🔍 AuthProvider: Handling auth callback');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session) {
        console.log('🔍 AuthProvider: Session found in callback');
        setSession(session);
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        console.log('🔍 AuthProvider: No session in callback');
      }
      
      // Clear URL parameters after processing
      if (window.location.hash.includes('access_token')) {
        console.log('🔍 AuthProvider: Clearing URL parameters');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    // Check if this is an auth callback
    if (window.location.hash.includes('access_token')) {
      console.log('🔍 AuthProvider: Auth callback detected in URL');
      handleAuthCallback();
    } else {
      console.log('🔍 AuthProvider: No auth callback, getting initial session');
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 AuthProvider: Initial session result:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('🔍 AuthProvider: User found, fetching profile');
        fetchProfile(session.user.id);
      } else {
        console.log('🔍 AuthProvider: No user in initial session');
      }
      setLoading(false);
    }).catch(error => {
      console.error('🔍 AuthProvider: Error getting initial session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔍 AuthProvider: Auth state change event:', event, 'session:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('🔍 AuthProvider: User in auth state change, fetching profile');
        await fetchProfile(session.user.id);
      } else {
        console.log('🔍 AuthProvider: No user in auth state change, clearing profile');
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
      console.log('🔍 AuthProvider: Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    console.log('🔍 AuthProvider: fetchProfile called for userId:', userId);
    try {
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
          await createProfile(userId);
        }
      } else {
        console.log('🔍 AuthProvider: Profile fetched successfully:', data);
        setProfile(data);
        
        // Check if there's pending user info from signup
        const pendingInfo = localStorage.getItem('pending_user_info');
        if (pendingInfo && !data.first_name) {
          console.log('🔍 AuthProvider: Found pending user info, updating profile');
          try {
            const { firstName, lastName, userType, organizationName, entryCode } = JSON.parse(pendingInfo);
            
            // Handle organization creation if needed
            let organizationId = null;
            if (userType === 'organization' && organizationName) {
              console.log('🔍 AuthProvider: Creating organization:', organizationName);
              const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .insert({ name: organizationName })
                .select()
                .single();
              
              if (orgError) {
                console.error('🔍 AuthProvider: Error creating organization:', orgError);
              } else {
                organizationId = orgData.id;
                console.log('🔍 AuthProvider: Organization created with ID:', organizationId);
              }
            }
            
            // Handle entry code if provided
            if (entryCode) {
              console.log('🔍 AuthProvider: Entry code provided:', entryCode);
              // TODO: Implement entry code validation and organization joining
            }
            
            await updateProfile({ 
              first_name: firstName, 
              last_name: lastName,
              user_type: userType || 'individual',
              organization_id: organizationId
            });
            localStorage.removeItem('pending_user_info');
            console.log('🔍 AuthProvider: Profile updated with pending info');
          } catch (error) {
            console.error('🔍 AuthProvider: Error updating profile with pending info:', error);
          }
        }
      }
    } catch (error) {
      console.error('🔍 AuthProvider: Error in fetchProfile:', error);
    }
  };

  const createProfile = async (userId: string, firstName?: string, lastName?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: user.email!,
          first_name: firstName || null,
          last_name: lastName || null,
          user_type: 'individual',
          organization_id: null,
        })
        .select()
        .single();

      if (error) {
        console.error('🔍 AuthProvider: Error creating profile:', error);
      } else {
        setProfile(data);
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

  const signIn = async (email: string, firstName?: string, lastName?: string, userType?: 'individual' | 'organization', organizationName?: string, entryCode?: string): Promise<{ isNewUser: boolean }> => {
    try {
      // Check if user already exists
      const userExists = await checkUserExists(email);
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'https://reasynai.vercel.app',
        },
      });

      if (error) {
        throw error;
      }

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