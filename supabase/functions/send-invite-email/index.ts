import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, inviteCode, organizationName, inviterName, userType } = await req.json()

    // Validate required fields
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create SMTP client
    const client = new SmtpClient()
    
    // Connect to SMTP server (using Gmail as example)
    // You'll need to set up environment variables in Supabase
    const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587')
    const smtpUsername = Deno.env.get('SMTP_USERNAME')
    const smtpPassword = Deno.env.get('SMTP_PASSWORD')
    const fromEmail = Deno.env.get('FROM_EMAIL') || smtpUsername

    if (!smtpUsername || !smtpPassword) {
      throw new Error('SMTP credentials not configured')
    }

    await client.connectTLS({
      hostname: smtpHost,
      port: smtpPort,
      username: smtpUsername,
      password: smtpPassword,
    })

    // Send email
    await client.send({
      from: fromEmail,
      to: to,
      subject: subject,
      content: html,
      html: html,
    })

    await client.close()

    console.log(`Email sent successfully to ${to}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 