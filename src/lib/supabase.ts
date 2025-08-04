import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a mock client if environment variables are missing
const createMockClient = () => {
  console.warn('Supabase environment variables not found. Using mock client.');
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithOtp: () => Promise.resolve({ error: new Error('Supabase not configured') }),
      signOut: () => Promise.resolve({ error: new Error('Supabase not configured') }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }) }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }) }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: new Error('Supabase not configured') }) }),
    }),
  };
};

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          user_type: 'individual' | 'business_admin' | 'coach' | 'student';
          organization_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          user_type: 'individual' | 'business_admin' | 'coach' | 'student';
          organization_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          user_type?: 'individual' | 'business_admin' | 'coach' | 'student';
          organization_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: 'admin' | 'coach' | 'student';
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role: 'admin' | 'coach' | 'student';
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: 'admin' | 'coach' | 'student';
          created_at?: string;
        };
      };
      invites: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role: 'coach' | 'student';
          code: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          role: 'coach' | 'student';
          code: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          role?: 'coach' | 'student';
          code?: string;
          expires_at?: string;
          created_at?: string;
        };
      };
      debate_sessions: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string | null;
          topic: string;
          speakers: any;
          points: any;
          start_time: string;
          end_time: string | null;
          hints_used: number;
          first_speaker: 'affirmative' | 'negative';
          summary: string | null;
          winner: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id?: string | null;
          topic: string;
          speakers: any;
          points: any;
          start_time: string;
          end_time?: string | null;
          hints_used?: number;
          first_speaker: 'affirmative' | 'negative';
          summary?: string | null;
          winner?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string | null;
          topic?: string;
          speakers?: any;
          points?: any;
          start_time?: string;
          end_time?: string | null;
          hints_used?: number;
          first_speaker?: 'affirmative' | 'negative';
          summary?: string | null;
          winner?: any | null;
          created_at?: string;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Organization = Database['public']['Tables']['organizations']['Row'];
export type OrganizationMember = Database['public']['Tables']['organization_members']['Row'];
export type Invite = Database['public']['Tables']['invites']['Row'];
export type DebateSession = Database['public']['Tables']['debate_sessions']['Row']; 