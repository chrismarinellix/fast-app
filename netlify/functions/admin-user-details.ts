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

  const userId = event.queryStringParameters?.userId;
  if (!userId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'userId required' }) };
  }

  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'User not found' }) };
    }

    // Get all fasting sessions for this user
    const { data: fastingSessions, error: fastsError } = await supabase
      .from('fasting_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get all fasting notes for this user's sessions
    const sessionIds = fastingSessions?.map(s => s.id) || [];
    const { data: fastingNotes } = sessionIds.length > 0
      ? await supabase
          .from('fasting_notes')
          .select('*')
          .in('fasting_id', sessionIds)
          .order('created_at', { ascending: false })
      : { data: [] };

    // Get user's share connections
    const { data: connections } = await supabase
      .from('share_connections')
      .select('*')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .order('created_at', { ascending: false });

    // Get user's fast shares
    const { data: shares } = await supabase
      .from('fast_shares')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get user's group memberships
    const { data: groupMemberships } = await supabase
      .from('share_group_members')
      .select(`
        *,
        group:share_groups (*)
      `)
      .eq('user_id', userId);

    // Get user's notifications (if table exists)
    let notifications: any[] = [];
    try {
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      notifications = notifs || [];
    } catch {
      // Notifications table might not exist yet
    }

    // Calculate stats
    const totalFasts = fastingSessions?.length || 0;
    const completedFasts = fastingSessions?.filter(s => s.completed).length || 0;
    const currentFast = fastingSessions?.find(s => !s.end_time);
    const totalFastingHours = fastingSessions?.reduce((acc, s) => {
      if (s.end_time) {
        const start = new Date(s.start_time).getTime();
        const end = new Date(s.end_time).getTime();
        return acc + (end - start) / (1000 * 60 * 60);
      }
      return acc;
    }, 0) || 0;

    const longestFast = fastingSessions?.reduce((max, s) => {
      if (s.end_time) {
        const start = new Date(s.start_time).getTime();
        const end = new Date(s.end_time).getTime();
        const hours = (end - start) / (1000 * 60 * 60);
        return hours > max ? hours : max;
      }
      return max;
    }, 0) || 0;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        profile: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          subscriptionStatus: profile.subscription_status,
          stripeCustomerId: profile.stripe_customer_id,
          paidUntil: profile.paid_until,
          fastsCompleted: profile.fasts_completed,
          createdAt: profile.created_at,
        },
        stats: {
          totalFasts,
          completedFasts,
          totalFastingHours: Math.round(totalFastingHours * 10) / 10,
          longestFast: Math.round(longestFast * 10) / 10,
          connectionCount: connections?.filter(c => c.accepted_at)?.length || 0,
          pendingInvites: connections?.filter(c => !c.accepted_at && c.user_a === userId)?.length || 0,
          groupCount: groupMemberships?.length || 0,
          shareCount: shares?.length || 0,
        },
        currentFast: currentFast ? {
          id: currentFast.id,
          startTime: currentFast.start_time,
          targetHours: currentFast.target_hours,
          confirmedAt: currentFast.confirmed_at,
        } : null,
        recentFasts: (fastingSessions || []).slice(0, 10).map(s => ({
          id: s.id,
          startTime: s.start_time,
          endTime: s.end_time,
          targetHours: s.target_hours,
          completed: s.completed,
        })),
        recentNotes: (fastingNotes || []).slice(0, 10).map(n => ({
          id: n.id,
          hourMark: n.hour_mark,
          mood: n.mood,
          energyLevel: n.energy_level,
          hungerLevel: n.hunger_level,
          note: n.note,
          createdAt: n.created_at,
        })),
        connections: (connections || []).map(c => ({
          id: c.id,
          isInitiator: c.user_a === userId,
          otherUserId: c.user_a === userId ? c.user_b : c.user_a,
          displayName: c.user_a === userId ? c.display_name_b : c.display_name_a,
          myDisplayName: c.user_a === userId ? c.display_name_a : c.display_name_b,
          accepted: !!c.accepted_at,
          createdAt: c.created_at,
          acceptedAt: c.accepted_at,
        })),
        groups: (groupMemberships || []).map(m => ({
          id: m.group_id,
          name: (m.group as any)?.name || 'Unknown',
          displayName: m.display_name,
          joinedAt: m.joined_at,
        })),
        notifications: notifications.slice(0, 20),
      }),
    };
  } catch (error: any) {
    console.error('Admin user details error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
}
