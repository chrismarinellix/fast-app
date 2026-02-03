import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const ADMIN_EMAILS = ['chrismarinelli@live.com'];
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Fast! <notifications@fast-fasting-app.netlify.app>';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

async function sendEmailViaResend(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to send email' };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Email templates
function wrapEmailTemplate(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fast!</title>
  ${preheader ? `<span style="display:none;font-size:1px;color:#fff;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:30px;text-align:center;">
              <span style="font-size:32px;">🔥</span>
              <h1 style="margin:10px 0 0;color:#fff;font-size:24px;font-weight:800;">Fast!</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:30px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 30px;background:#f9fafb;text-align:center;border-top:1px solid #e5e5e5;">
              <p style="margin:0;color:#888;font-size:12px;">
                <a href="https://fast-fasting-app.netlify.app" style="color:#22c55e;text-decoration:none;font-weight:600;">Fast!</a> - Track your fasting journey
              </p>
              <p style="margin:10px 0 0;color:#aaa;font-size:11px;">
                You're receiving this because you have an account at Fast!
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function handler(event: any) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) };
  }

  // Only admins can send emails via this endpoint
  if (!ADMIN_EMAILS.includes(user.email || '')) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not authorized' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { userIds, subject, message, template = 'admin' } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'userIds required' }) };
    }

    if (!subject || !message) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'subject and message required' }) };
    }

    // Get user emails
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .in('id', userIds);

    if (profilesError || !profiles || profiles.length === 0) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'No users found' }) };
    }

    // Build email content based on template
    let emailContent: string;
    switch (template) {
      case 'reminder':
        emailContent = `
          <h2 style="margin:0 0 15px;color:#333;font-size:20px;">Hey there! 👋</h2>
          <p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.6;">${message}</p>
          <a href="https://fast-fasting-app.netlify.app/dashboard" style="display:inline-block;padding:14px 28px;background:#22c55e;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;">Start Fasting</a>
        `;
        break;
      case 'milestone':
        emailContent = `
          <h2 style="margin:0 0 15px;color:#333;font-size:20px;">🎉 Congratulations!</h2>
          <p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.6;">${message}</p>
          <a href="https://fast-fasting-app.netlify.app/dashboard" style="display:inline-block;padding:14px 28px;background:#8b5cf6;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;">View Your Progress</a>
        `;
        break;
      case 'checkin':
        emailContent = `
          <h2 style="margin:0 0 15px;color:#333;font-size:20px;">How's your fast going? 💪</h2>
          <p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.6;">${message}</p>
          <a href="https://fast-fasting-app.netlify.app/dashboard" style="display:inline-block;padding:14px 28px;background:#f97316;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;">Check In</a>
        `;
        break;
      default: // admin
        emailContent = `
          <h2 style="margin:0 0 15px;color:#333;font-size:20px;">${subject}</h2>
          <p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.6;">${message}</p>
          <a href="https://fast-fasting-app.netlify.app/dashboard" style="display:inline-block;padding:14px 28px;background:#22c55e;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;">Open Fast!</a>
        `;
    }

    const html = wrapEmailTemplate(emailContent, message.substring(0, 100));

    // Send emails
    const emails = profiles.map(p => p.email).filter(Boolean);
    const result = await sendEmailViaResend({
      to: emails,
      subject,
      html,
      text: message,
    });

    if (!result.success) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: result.error }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: emails.length,
        message: `Email sent to ${emails.length} user(s)`,
      }),
    };
  } catch (error: any) {
    console.error('Send email error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
}
