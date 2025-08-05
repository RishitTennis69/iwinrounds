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
      console.log('🔍 EmailService: Starting sendInviteEmail');
      console.log('🔍 EmailService: Invite data:', inviteData);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<{ success: boolean; error: string }>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Email service timeout after 30 seconds'));
        }, 30000); // 30 second timeout
      });
      
      const emailPromise = this.sendInviteEmailInternal(inviteData);
      
      // Race between timeout and email sending
      return await Promise.race([emailPromise, timeoutPromise]);
    } catch (error) {
      console.error('🔍 EmailService: Error in sendInviteEmail:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  private static async sendInviteEmailInternal(inviteData: InviteData): Promise<{ success: boolean; error?: string }> {
    try {
      // Generate a unique invite code
      const inviteCode = this.generateInviteCode();
      console.log('🔍 EmailService: Generated invite code:', inviteCode);
      
      // TEMPORARILY SKIP DATABASE INSERT DUE TO RLS ISSUES
      console.log('🔍 EmailService: Skipping database insert due to RLS issues');
      /*
      // Create invite record in database
      console.log('🔍 EmailService: Creating invite record in database...');
      console.log('🔍 EmailService: Insert data:', {
        email: inviteData.email,
        organization_id: inviteData.organization_id,
        user_type: inviteData.user_type,
        invited_by: inviteData.invited_by,
        code: inviteCode,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      });
      
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

      console.log('🔍 EmailService: Database insert result:', { inviteRecord, dbError });

      if (dbError) {
        console.error('🔍 EmailService: Database error creating invite:', dbError);
        console.error('🔍 EmailService: Error details:', {
          message: dbError.message,
          code: dbError.code,
          details: dbError.details,
          hint: dbError.hint
        });
        return { success: false, error: `Failed to create invite record: ${dbError.message}` };
      }

      console.log('🔍 EmailService: Invite record created successfully:', inviteRecord);
      */

      // Get organization details
      console.log('🔍 EmailService: Fetching organization details...');
      const { data: organization } = await supabase
        .from('organizations')
        .select('name, creator_name')
        .eq('id', inviteData.organization_id)
        .single();

      console.log('🔍 EmailService: Organization details:', organization);

      // Get inviter details
      console.log('🔍 EmailService: Fetching inviter details...');
      const { data: inviter } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', inviteData.invited_by)
        .single();

      console.log('🔍 EmailService: Inviter details:', inviter);

      // Generate email HTML
      console.log('🔍 EmailService: Generating email HTML...');
      const emailHTML = this.generateInviteEmailHTML({
        inviteCode,
        organizationName: organization?.name || 'our organization',
        inviterName: inviter ? `${inviter.first_name} ${inviter.last_name}`.trim() : 'A team member',
        userType: inviteData.user_type,
        inviteUrl: `${window.location.origin}/join?code=${inviteCode}`
      });

      // Send email using Supabase Edge Function
      console.log('🔍 EmailService: Preparing to call Edge Function...');
      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invite-email`;
      console.log('🔍 EmailService: Edge Function URL:', edgeFunctionUrl);
      
      const requestBody = {
        to: inviteData.email,
        subject: `You're invited to join ${organization?.name || 'our organization'}!`,
        html: emailHTML,
        inviteCode,
        organizationName: organization?.name || 'our organization',
        inviterName: inviter ? `${inviter.first_name} ${inviter.last_name}`.trim() : 'A team member',
        userType: inviteData.user_type
      };
      
      console.log('🔍 EmailService: Request body:', requestBody);
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('🔍 EmailService: Response status:', response.status);
      console.log('🔍 EmailService: Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('🔍 EmailService: Edge function error:', errorData);
        return { success: false, error: 'Failed to send email' };
      }

      const result = await response.json();
      console.log('🔍 EmailService: Email sent successfully:', result);
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

  private static generateInviteEmailHTML(data: {
    inviteCode: string;
    organizationName: string;
    inviterName: string;
    userType: string;
    inviteUrl: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're invited to join ${data.organizationName}!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; background: #f9f9f9; }
          .code { background: #667eea; color: white; padding: 20px; border-radius: 10px; text-align: center; font-size: 28px; font-weight: bold; margin: 30px 0; font-family: monospace; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 40px; color: #666; font-size: 14px; padding: 20px; }
          .section { margin: 30px 0; }
          .highlight { background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 32px;">🎉 You're Invited!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Join ${data.organizationName} on our debate platform</p>
          </div>
          <div class="content">
            <p>Hi there!</p>
            <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.organizationName}</strong> as a <strong>${data.userType}</strong>.</p>
            
            <div class="section">
              <h3 style="color: #667eea; margin-bottom: 15px;">You can join using either of these methods:</h3>
              
              <div style="margin: 20px 0;">
                <h4 style="color: #333; margin-bottom: 10px;">Method 1: Use the invite link</h4>
                <a href="${data.inviteUrl}" class="button">Join Organization</a>
              </div>
              
              <div style="margin: 20px 0;">
                <h4 style="color: #333; margin-bottom: 10px;">Method 2: Use the invite code</h4>
                <p>Your invite code is:</p>
                <div class="code">${data.inviteCode}</div>
              </div>
            </div>
            
            <div class="section">
              <h3 style="color: #333; margin-bottom: 15px;">To join manually:</h3>
              <ol style="padding-left: 20px;">
                <li>Go to <a href="${window.location.origin}" style="color: #667eea;">${window.location.origin}</a></li>
                <li>Sign up or sign in</li>
                <li>Enter the code above when prompted</li>
              </ol>
            </div>
            
            <div class="highlight">
              <p style="margin: 0;"><strong>⚠️ This invite expires in 7 days.</strong></p>
            </div>
            
            <div class="section">
              <p>If you have any questions, please contact <strong>${data.inviterName}</strong>.</p>
              <p>Best regards,<br>The Debate Platform Team</p>
            </div>
          </div>
          <div class="footer">
            <p>This email was sent by the debate platform. If you didn't expect this invite, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
} 