import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Admin emails that can access this endpoint
const ADMIN_EMAILS = ['chrismarinelli@live.com'];

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export async function handler(event: any) {
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Check for auth header
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const token = authHeader.replace('Bearer ', '');

  // Verify the token and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) };
  }

  // Check if user is admin
  if (!ADMIN_EMAILS.includes(user.email || '')) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not authorized' }) };
  }

  try {
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch profiles' }) };
    }

    // Get all fasting sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('fasting_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
    }

    // Get all share connections for network visualization
    const { data: connections, error: connectionsError } = await supabase
      .from('share_connections')
      .select('*')
      .not('accepted_at', 'is', null);

    if (connectionsError) {
      console.error('Error fetching connections:', connectionsError);
    }

    // Calculate stats
    const now = new Date();
    const totalUsers = profiles?.length || 0;
    const paidUsers = profiles?.filter(p => p.paid_until && new Date(p.paid_until) > now).length || 0;
    const freeUsers = totalUsers - paidUsers;
    const totalFasts = sessions?.length || 0;
    const completedFasts = sessions?.filter(s => s.completed).length || 0;
    const activeFasts = sessions?.filter(s => s.end_time === null).length || 0;

    // Recent signups (last 7 days)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentSignups = profiles?.filter(p => new Date(p.created_at) > weekAgo).length || 0;

    // Revenue estimate ($5 per paid user)
    const totalRevenue = paidUsers * 5;

    // Get active fasts with user details
    const activeFastsList = sessions?.filter(s => s.end_time === null).map(fast => {
      const profile = profiles?.find(p => p.id === fast.user_id);
      return {
        id: fast.id,
        userId: fast.user_id,
        email: profile?.email || 'Unknown',
        name: profile?.name || null,
        startTime: fast.start_time,
        targetHours: fast.target_hours || 24,
      };
    }) || [];

    // Build network data for visualization
    const networkNodes = profiles?.map(p => {
      const hasActiveFast = sessions?.some(s => s.user_id === p.id && s.end_time === null);
      const connectionCount = connections?.filter(c => c.user_a === p.id || c.user_b === p.id).length || 0;
      return {
        id: p.id,
        name: p.name || p.email?.split('@')[0] || 'User',
        email: p.email,
        isFasting: hasActiveFast,
        connectionCount,
        isPaid: p.paid_until && new Date(p.paid_until) > now,
      };
    }) || [];

    const networkEdges = connections?.map(c => ({
      id: c.id,
      source: c.user_a,
      target: c.user_b,
      sourceLabel: c.display_name_a,
      targetLabel: c.display_name_b,
      createdAt: c.accepted_at,
    })) || [];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        stats: {
          totalUsers,
          paidUsers,
          freeUsers,
          totalFasts,
          completedFasts,
          activeFasts,
          recentSignups,
          totalRevenue,
        },
        users: profiles?.map(p => ({
          id: p.id,
          email: p.email,
          name: p.name,
          status: p.subscription_status,
          paidUntil: p.paid_until,
          fastsCompleted: p.fasts_completed,
          createdAt: p.created_at,
        })),
        activeFasts: activeFastsList,
        network: {
          nodes: networkNodes,
          edges: networkEdges,
        },
      }),
    };
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
}
