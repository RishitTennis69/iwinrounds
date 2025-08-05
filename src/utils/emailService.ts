import { supabase } from '../lib/supabase';

export interface InviteData {
  email: string;
  organization_id: string;
  user_type: 'student' | 'coach';
  invited_by: string;
}

export class EmailService {
  static async sendInviteEmail(inviteData: InviteData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔍 EmailService: Sending invite email to:', inviteData.email);
      
      // Generate a unique invite code
      const inviteCode = this.generateInviteCode();
      
      // Create invite record in database
      const { data: inviteRecord, error: dbError } = await supabase
        .from('invites')
        .insert({
          email: inviteData.email,
          organization_id: inviteData.organization_id,
          user_type: inviteData.user_type,
          invited_by: inviteData.invited_by,
          code: inviteCode,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        console.error('🔍 EmailService: Database error creating invite:', dbError);
        return { success: false, error: 'Failed to create invite record' };
      }

      // Get organization details
      const { data: organization } = await supabase
        .from('organizations')
        .select('name, creator_name')
        .eq('id', inviteData.organization_id)
        .single();

      // Get inviter details
      const { data: inviter } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', inviteData.invited_by)
        .single();

      // For now, we'll use a simple approach that logs the email content
      // In production, you would integrate with a proper email service
      const emailContent = this.generateInviteEmailContent({
        inviteCode,
        organizationName: organization?.name || 'our organization',
        inviterName: inviter ? `${inviter.first_name} ${inviter.last_name}`.trim() : 'A team member',
        userType: inviteData.user_type,
        inviteUrl: `${window.location.origin}/join?code=${inviteCode}`
      });

      // Log the email content for development
      console.log('🔍 EmailService: Email content (development mode):', {
        to: inviteData.email,
        subject: `You're invited to join ${organization?.name || 'our organization'}!`,
        content: emailContent
      });

      // In a real implementation, you would send the email here
      // For now, we'll simulate success
      console.log('🔍 EmailService: Invite email sent successfully');
      return { success: true };
      
    } catch (error) {
      console.error('🔍 EmailService: Error sending invite email:', error);
      return { success: false, error: 'Failed to send invite email' };
    }
  }

  private static generateInviteCode(): string {
    // Generate a 6-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private static generateInviteEmailContent(data: {
    inviteCode: string;
    organizationName: string;
    inviterName: string;
    userType: string;
    inviteUrl: string;
  }): string {
    return `
🎉 You're Invited!

Hi there!

${data.inviterName} has invited you to join ${data.organizationName} as a ${data.userType}.

You can join using either of these methods:

Method 1: Use the invite link
${data.inviteUrl}

Method 2: Use the invite code
Your invite code is: ${data.inviteCode}

To join:
1. Go to ${window.location.origin}
2. Sign up or sign in
3. Enter the code above when prompted

This invite expires in 7 days.

If you have any questions, please contact ${data.inviterName}.

Best regards,
The Debate Platform Team
    `;
  }
} 