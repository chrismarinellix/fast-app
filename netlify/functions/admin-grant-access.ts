import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const ADMIN_EMAILS = ['chrismarinelli@live.com'];

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Check for auth header
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const token = authHeader.replace('Bearer ', '');

  // Verify the token and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };
  }

  // Check if user is admin
  if (!ADMIN_EMAILS.includes(user.email || '')) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Not authorized' }) };
  }

  try {
    const { email, days = 200 } = JSON.parse(event.body);

    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Email is required' }) };
    }

    // Find the user by email
    const { data: profile, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (findError || !profile) {
      // User doesn't exist - create them
      console.log('User not found, creating profile for:', email);

      const paidUntil = new Date();
      paidUntil.setDate(paidUntil.getDate() + days);

      // We need to create an auth user first, but we can't do that without password
      // So just update if exists, or return instructions
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'User not found in profiles',
          message: `No profile found for ${email}. The user needs to sign up first, then you can grant access.`,
        }),
      };
    }

    // Calculate paid_until date
    const paidUntil = new Date();
    paidUntil.setDate(paidUntil.getDate() + days);

    // Update the profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        paid_until: paidUntil.toISOString(),
        subscription_status: 'active',
      })
      .eq('email', email);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return { statusCode: 500, body: JSON.stringify({ error: updateError.message }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: `Granted ${days} days access to ${email}`,
        paidUntil: paidUntil.toISOString(),
      }),
    };
  } catch (error: any) {
    console.error('Admin grant access error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
