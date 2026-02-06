import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

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

  try {
    const body = JSON.parse(event.body);
    const { recipientUserId, messageText } = body;

    if (!recipientUserId || !messageText) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'recipientUserId and messageText required' }) };
    }

    // Verify an accepted connection exists between sender and recipient
    const { data: connection, error: connError } = await supabase
      .from('share_connections')
      .select('id, display_name_a, display_name_b, user_a, user_b')
      .or(`and(user_a.eq.${user.id},user_b.eq.${recipientUserId}),and(user_a.eq.${recipientUserId},user_b.eq.${user.id})`)
      .not('accepted_at', 'is', null)
      .single();

    if (connError || !connection) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'No connection with this user' }) };
    }

    // Rate limit: max 10 messages per hour per sender
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'social')
      .gte('created_at', oneHourAgo)
      .like('title', `Message from %`);

    if (count && count >= 10) {
      return { statusCode: 429, headers, body: JSON.stringify({ error: 'Too many messages. Try again later.' }) };
    }

    // Determine sender's display name from the connection
    const senderName = connection.user_a === user.id
      ? connection.display_name_a
      : connection.display_name_b;

    // Insert notification for recipient
    const { error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientUserId,
        title: `Message from ${senderName}`,
        message: messageText,
        type: 'social',
        read: false,
      });

    if (insertError) {
      throw insertError;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (error: any) {
    console.error('Send message error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
}
