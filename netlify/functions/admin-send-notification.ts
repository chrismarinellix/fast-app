import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const ADMIN_EMAILS = ['chrismarinelli@live.com'];

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

  if (!ADMIN_EMAILS.includes(user.email || '')) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not authorized' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { userIds, title, message, type = 'admin', actionUrl, actionLabel } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'userIds required' }) };
    }

    if (!title || !message) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'title and message required' }) };
    }

    // Insert notifications for each user
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type,
      action_url: actionUrl || null,
      action_label: actionLabel || null,
      read: false,
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) {
      // If table doesn't exist, create it
      if (error.code === '42P01') {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Notifications table not found. Please run the SQL migration first.',
            migration: `
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'admin',
  action_url TEXT,
  action_label VARCHAR(100),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
            `
          })
        };
      }
      throw error;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: data?.length || 0,
        message: `Sent notification to ${data?.length || 0} user(s)`,
      }),
    };
  } catch (error: any) {
    console.error('Send notification error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
}
