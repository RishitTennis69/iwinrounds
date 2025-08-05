# Supabase Email Setup Instructions

## 🚀 Setting Up Email Sending with Supabase Edge Functions

### Step 1: Deploy the Edge Function

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project** (if not already linked):
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. **Deploy the Edge Function**:
   ```bash
   supabase functions deploy send-invite-email
   ```

### Step 2: Configure Environment Variables

In your **Supabase Dashboard** → **Settings** → **Edge Functions**, add these environment variables:

#### For Gmail SMTP:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
```

#### For Outlook/Hotmail SMTP:
```
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USERNAME=your-email@outlook.com
SMTP_PASSWORD=your-password
FROM_EMAIL=your-email@outlook.com
```

#### For Custom SMTP Server:
```
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USERNAME=your-username
SMTP_PASSWORD=your-password
FROM_EMAIL=noreply@yourdomain.com
```

### Step 3: Gmail App Password Setup (Recommended)

If using Gmail, you'll need to create an "App Password":

1. **Enable 2-Factor Authentication** on your Google account
2. **Go to Google Account Settings** → **Security** → **App Passwords**
3. **Generate a new app password** for "Mail"
4. **Use this password** as your `SMTP_PASSWORD`

### Step 4: Test the Email Function

You can test the function using the Supabase CLI:

```bash
supabase functions serve send-invite-email --env-file .env.local
```

Then test with curl:
```bash
curl -X POST http://localhost:54321/functions/v1/send-invite-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Invite",
    "html": "<h1>Test Email</h1>",
    "inviteCode": "ABC123",
    "organizationName": "Test Org",
    "inviterName": "John Doe",
    "userType": "student"
  }'
```

### Step 5: Production Deployment

1. **Deploy to production**:
   ```bash
   supabase functions deploy send-invite-email --project-ref YOUR_PROJECT_REF
   ```

2. **Set production environment variables** in Supabase Dashboard

3. **Test the full flow**:
   - Send an invite from the Coach Dashboard
   - Check that the email is received
   - Test the invite code functionality

## 🔧 Troubleshooting

### Common Issues:

1. **"SMTP credentials not configured"**
   - Make sure all environment variables are set in Supabase Dashboard
   - Check that the variable names match exactly

2. **"Authentication failed"**
   - For Gmail: Use App Password, not regular password
   - Check that 2FA is enabled for Gmail
   - Verify username/password are correct

3. **"Connection timeout"**
   - Check SMTP_HOST and SMTP_PORT are correct
   - Try different SMTP servers (Gmail, Outlook, etc.)

4. **"Function not found"**
   - Make sure the function is deployed: `supabase functions list`
   - Check the function name matches exactly

### Testing Locally:

```bash
# Start local development
supabase start

# Serve functions locally
supabase functions serve

# Test the function
curl -X POST http://localhost:54321/functions/v1/send-invite-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","html":"<h1>Test</h1>"}'
```

## 📧 Email Template

The system generates beautiful HTML emails with:
- **Organization branding** and colors
- **Clear invite code** display
- **Two joining methods**: direct link + manual code entry
- **7-day expiration** warning
- **Professional styling** and responsive design

## 🎯 Next Steps

Once configured:
1. **Test the full invitation flow**
2. **Monitor email delivery** in your email provider
3. **Set up email analytics** if needed
4. **Consider email templates** for different scenarios

The system is now ready for production email sending! 🚀 