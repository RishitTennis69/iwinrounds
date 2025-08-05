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

    // Get initial session with timeout
    const sessionPromise = supabase.auth.getSession();
    const sessionTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session fetch timeout')), 2000) // Reduced to 2 seconds
    );

    Promise.race([sessionPromise, sessionTimeout])
      .then((result: any) => {
        const { data: { session } } = result;
        console.log('🔍 AuthProvider: Initial session result:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          console.log('🔍 AuthProvider: User found, fetching profile');
          fetchProfile(session.user.id);
        } else {
          console.log('🔍 AuthProvider: No user found, setting loading to false');
          setLoading(false);
        }
      })
      .catch((error) => {
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
      // Add timeout to the profile fetch
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 2000) // Reduced to 2 seconds
      );

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

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
        
        // Check if there's pending user info from signup
        const pendingInfo = localStorage.getItem('pending_user_info');
        if (pendingInfo) {
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
            
            // Update the profile with pending info
            const updateData: Partial<Profile> = {};
            if (firstName) updateData.first_name = firstName;
            if (lastName) updateData.last_name = lastName;
            if (userType) updateData.user_type = userType as 'individual' | 'business_admin' | 'coach' | 'student';
            if (organizationId) updateData.organization_id = organizationId;
            
            await updateProfile(updateData);
            localStorage.removeItem('pending_user_info');
            console.log('🔍 AuthProvider: Profile updated with pending info');
          } catch (error) {
            console.error('🔍 AuthProvider: Error updating profile with pending info:', error);
          }
        }
        
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('🔍 AuthProvider: No user found, skipping profile creation');
        return;
      }

      // Check for pending user info to get the correct user_type
      const pendingInfo = localStorage.getItem('pending_user_info');
      let userType = 'individual';
      let organizationId = null;
      
      if (pendingInfo) {
        try {
          const { userType: pendingUserType, organizationName } = JSON.parse(pendingInfo);
          userType = pendingUserType || 'individual';
          
          // If it's an organization user, create the organization first
          if (userType === 'organization' && organizationName) {
            console.log('🔍 AuthProvider: Creating organization during profile creation:', organizationName);
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
          user_type: userType as 'individual' | 'business_admin' | 'coach' | 'student',
          organization_id: organizationId,
        })
        .select()
        .single();

      if (error) {
        console.error('🔍 AuthProvider: Error creating profile:', error);
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
      // Check if user already exists
      const userExists = await checkUserExists(email);
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin, // Use current origin instead of hardcoded URL
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