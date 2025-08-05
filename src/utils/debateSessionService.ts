import { supabase } from '../lib/supabase';
import { DebateSession as DatabaseDebateSession } from '../lib/supabase';

export class DebateSessionService {
  static async saveSession(session: any, userId: string, organizationId?: string) {
    try {
      const { data, error } = await supabase
        .from('debate_sessions')
        .insert({
          user_id: userId,
          organization_id: organizationId,
          topic: session.topic,
          speakers: session.speakers,
          points: session.points,
          start_time: session.startTime.toISOString(),
          end_time: session.endTime?.toISOString() || null,
          hints_used: session.hintsUsed,
          first_speaker: session.firstSpeaker,
          summary: session.summary,
          winner: session.winner,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving debate session:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in saveSession:', error);
      throw error;
    }
  }

  static async getUserSessions(userId: string): Promise<DatabaseDebateSession[]> {
    try {
      console.log('🔍 DebateSessionService: Fetching sessions for user:', userId);
      
      // Add timeout to the query
      const queryPromise = supabase
        .from('debate_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Debate sessions fetch timeout')), 5000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        console.error('🔍 DebateSessionService: Error fetching sessions:', error);
        
        // If it's a policy error, return empty array instead of failing
        if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
          console.log('🔍 DebateSessionService: Policy error detected, returning empty array');
          return [];
        }
        
        return [];
      }

      console.log('🔍 DebateSessionService: Successfully fetched sessions:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('🔍 DebateSessionService: Error in getUserSessions:', error);
      
      // If it's a timeout or network error, return empty array
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log('🔍 DebateSessionService: Timeout error, returning empty array');
        return [];
      }
      
      return [];
    }
  }

  static async updateSession(sessionId: string, updates: Partial<DatabaseDebateSession>) {
    try {
      const { data, error } = await supabase
        .from('debate_sessions')
        .update({
          end_time: updates.end_time || null,
          hints_used: updates.hints_used,
          summary: updates.summary,
          winner: updates.winner,
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating debate session:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateSession:', error);
      throw error;
    }
  }
} 