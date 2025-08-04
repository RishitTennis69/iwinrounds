import { supabase } from '../lib/supabase';
import { DebateSession } from '../types';

export class DebateSessionService {
  static async saveSession(session: DebateSession, userId: string, organizationId?: string) {
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

  static async getUserSessions(userId: string) {
    try {
      const { data, error } = await supabase
        .from('debate_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user sessions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserSessions:', error);
      throw error;
    }
  }

  static async updateSession(sessionId: string, updates: Partial<DebateSession>) {
    try {
      const { data, error } = await supabase
        .from('debate_sessions')
        .update({
          end_time: updates.endTime?.toISOString() || null,
          hints_used: updates.hintsUsed,
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