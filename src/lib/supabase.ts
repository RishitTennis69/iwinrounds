import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug environment variables
console.log('🔍 Supabase: Environment variables check:');
console.log('🔍 Supabase: VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('🔍 Supabase: VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🔍 Supabase: Missing environment variables, throwing error');
  throw new Error('Missing Supabase environment variables');
}

console.log('🔍 Supabase: Creating client with URL:', supabaseUrl);
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('🔍 Supabase: Client created successfully');

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          user_type: 'individual' | 'business_admin' | 'coach' | 'student';
          organization_id: string | null;
          total_debates: number;
          total_wins: number;
          total_time_minutes: number;
          total_hints_used: number;
          last_debate_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          user_type: 'individual' | 'business_admin' | 'coach' | 'student';
          organization_id?: string | null;
          total_debates?: number;
          total_wins?: number;
          total_time_minutes?: number;
          total_hints_used?: number;
          last_debate_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          user_type?: 'individual' | 'business_admin' | 'coach' | 'student';
          organization_id?: string | null;
          total_debates?: number;
          total_wins?: number;
          total_time_minutes?: number;
          total_hints_used?: number;
          last_debate_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          creator_name: string | null;
          creator_email: string | null;
          total_students: number;
          total_coaches: number;
          total_debate_sessions: number;
          total_wins: number;
          total_time_minutes: number;
          last_activity_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          creator_name?: string | null;
          creator_email?: string | null;
          total_students?: number;
          total_coaches?: number;
          total_debate_sessions?: number;
          total_wins?: number;
          total_time_minutes?: number;
          last_activity_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          creator_name?: string | null;
          creator_email?: string | null;
          total_students?: number;
          total_coaches?: number;
          total_debate_sessions?: number;
          total_wins?: number;
          total_time_minutes?: number;
          last_activity_date?: string | null;
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