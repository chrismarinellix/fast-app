import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Users, DollarSign, TrendingUp, Clock,
  CheckCircle2, UserPlus, Flame, ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface AdminStats {
  totalUsers: number;
  paidUsers: number;
  freeUsers: number;
  totalFasts: number;
  completedFasts: number;
  recentSignups: number;
  totalRevenue: number;
}

interface UserData {
  id: string;
  email: string;
  name?: string;
  status: string;
  paidUntil?: string;
  fastsCompleted: number;
  createdAt: string;
}

const ADMIN_EMAILS = ['chrismarinelli@live.com'];

export function Admin() {
  const navigate = useNavigate();
  const { user, session, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantMessage, setGrantMessage] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  const grantAccess = async (email: string) => {
    if (!session?.access_token || !email) return;

    setGrantLoading(true);
    setGrantMessage(null);

    try {
      const response = await fetch('/.netlify/functions/admin-grant-access', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, days: 200 }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGrantMessage(`Error: ${data.error || data.message}`);
      } else {
        setGrantMessage(`Success! ${data.message}`);
        setGrantEmail('');
        fetchAdminData(); // Refresh the user list
      }
    } catch (err: any) {
      setGrantMessage(`Error: ${err.message}`);
    } finally {
      setGrantLoading(false);
    }
  };

  const fetchAdminData = async () => {
    if (!session?.access_token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/admin-stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch admin data');
      }

      const data = await response.json();
      setStats(data.stats);
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    } else if (!authLoading && user && !isAdmin) {
      navigate('/dashboard');
    } else if (session?.access_token && isAdmin && !hasFetched) {
      setHasFetched(true);
      fetchAdminData();
    }
  }, [authLoading, user, session, isAdmin, navigate, hasFetched]);

  if (authLoading || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
      }}>
        <div style={{ textAlign: 'center' }}>
          <Flame size={48} color="#22c55e" style={{ marginBottom: 16 }} />
          <div>Loading admin data...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#111' }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px',
        background: '#1a1a1a',
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flame size={28} color="#22c55e" />
            <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Fast! Admin</span>
          </div>
        </div>
        <button
          onClick={fetchAdminData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: '#333',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        {error && (
          <div style={{
            padding: 16,
            background: '#dc262620',
            border: '1px solid #dc2626',
            borderRadius: 12,
            color: '#ef4444',
            marginBottom: 24,
          }}>
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}>
          <StatCard
            icon={<Users size={24} />}
            label="Total Users"
            value={stats?.totalUsers || 0}
            color="#3b82f6"
          />
          <StatCard
            icon={<DollarSign size={24} />}
            label="Paid Users"
            value={stats?.paidUsers || 0}
            color="#22c55e"
          />
          <StatCard
            icon={<UserPlus size={24} />}
            label="Free Users"
            value={stats?.freeUsers || 0}
            color="#f97316"
          />
          <StatCard
            icon={<TrendingUp size={24} />}
            label="This Week"
            value={stats?.recentSignups || 0}
            color="#8b5cf6"
          />
          <StatCard
            icon={<Clock size={24} />}
            label="Total Fasts"
            value={stats?.totalFasts || 0}
            color="#06b6d4"
          />
          <StatCard
            icon={<CheckCircle2 size={24} />}
            label="Completed"
            value={stats?.completedFasts || 0}
            color="#10b981"
          />
          <StatCard
            icon={<DollarSign size={24} />}
            label="Revenue"
            value={`$${stats?.totalRevenue || 0}`}
            color="#eab308"
            large
          />
        </div>

        {/* Grant Access Form */}
        <div style={{
          background: '#1a1a1a',
          borderRadius: 16,
          padding: 20,
          border: '1px solid #333',
          marginBottom: 24,
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700, color: '#fff' }}>
            Grant 6 Months Access
          </h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              type="email"
              placeholder="user@email.com"
              value={grantEmail}
              onChange={(e) => setGrantEmail(e.target.value)}
              style={{
                flex: 1,
                minWidth: 200,
                padding: '10px 14px',
                background: '#222',
                border: '1px solid #444',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
              }}
            />
            <button
              onClick={() => grantAccess(grantEmail)}
              disabled={grantLoading || !grantEmail}
              style={{
                padding: '10px 20px',
                background: grantLoading ? '#444' : '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: grantLoading ? 'not-allowed' : 'pointer',
                opacity: !grantEmail ? 0.5 : 1,
              }}
            >
              {grantLoading ? 'Granting...' : 'Grant Access'}
            </button>
          </div>
          {grantMessage && (
            <div style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 8,
              background: grantMessage.startsWith('Success') ? '#22c55e20' : '#dc262620',
              color: grantMessage.startsWith('Success') ? '#22c55e' : '#ef4444',
              fontSize: 14,
            }}>
              {grantMessage}
            </div>
          )}
        </div>

        {/* Users Table */}
        <div style={{
          background: '#1a1a1a',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid #333',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>
              Registered Users ({users.length})
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 14,
            }}>
              <thead>
                <tr style={{ background: '#222' }}>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Paid Until</th>
                  <th style={thStyle}>Fasts</th>
                  <th style={thStyle}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#666' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #333' }}>
                      <td style={tdStyle}>
                        <div style={{ color: '#fff' }}>{u.email}</div>
                        {u.name && <div style={{ color: '#666', fontSize: 12 }}>{u.name}</div>}
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          background: u.paidUntil && new Date(u.paidUntil) > new Date()
                            ? '#22c55e20'
                            : '#f9731620',
                          color: u.paidUntil && new Date(u.paidUntil) > new Date()
                            ? '#22c55e'
                            : '#f97316',
                        }}>
                          {u.paidUntil && new Date(u.paidUntil) > new Date() ? 'PAID' : 'FREE'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {u.paidUntil ? (
                          <span style={{ color: new Date(u.paidUntil) > new Date() ? '#22c55e' : '#666' }}>
                            {format(new Date(u.paidUntil), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <span style={{ color: '#666' }}>-</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#fff' }}>{u.fastsCompleted}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#888' }}>
                          {format(new Date(u.createdAt), 'MMM d, yyyy')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Marketing & Community Section */}
        <div style={{
          marginTop: 24,
          background: '#1a1a1a',
          borderRadius: 16,
          padding: 24,
          border: '1px solid #333',
        }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#fff' }}>
            Marketing & Community Outreach
          </h2>

          <div style={{ display: 'grid', gap: 16 }}>
            {/* Reddit Communities */}
            <div style={{ background: '#222', borderRadius: 12, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#ff4500' }}>
                Reddit Communities
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="https://reddit.com/r/intermittentfasting" target="_blank" rel="noopener noreferrer"
                   style={{ color: '#6b9eff', fontSize: 14, textDecoration: 'none' }}>
                  r/intermittentfasting - Main IF community (2M+ members)
                </a>
                <a href="https://reddit.com/r/fasting" target="_blank" rel="noopener noreferrer"
                   style={{ color: '#6b9eff', fontSize: 14, textDecoration: 'none' }}>
                  r/fasting - Extended fasting discussions
                </a>
                <a href="https://reddit.com/r/loseit" target="_blank" rel="noopener noreferrer"
                   style={{ color: '#6b9eff', fontSize: 14, textDecoration: 'none' }}>
                  r/loseit - Weight loss community (2M+ members)
                </a>
                <a href="https://reddit.com/r/keto" target="_blank" rel="noopener noreferrer"
                   style={{ color: '#6b9eff', fontSize: 14, textDecoration: 'none' }}>
                  r/keto - Keto + fasting synergy
                </a>
                <a href="https://reddit.com/r/progresspics" target="_blank" rel="noopener noreferrer"
                   style={{ color: '#6b9eff', fontSize: 14, textDecoration: 'none' }}>
                  r/progresspics - Before/after transformations
                </a>
              </div>
            </div>

            {/* Other Forums */}
            <div style={{ background: '#222', borderRadius: 12, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#22c55e' }}>
                Other Fasting Forums
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="https://thefastdiet.co.uk/forums" target="_blank" rel="noopener noreferrer"
                   style={{ color: '#6b9eff', fontSize: 14, textDecoration: 'none' }}>
                  The Fast Diet Forum - 5:2 fasting community
                </a>
                <a href="https://ketogenicforums.com/c/fast" target="_blank" rel="noopener noreferrer"
                   style={{ color: '#6b9eff', fontSize: 14, textDecoration: 'none' }}>
                  Ketogenic Forums - Fasting category
                </a>
                <a href="https://waterfastingforum.com" target="_blank" rel="noopener noreferrer"
                   style={{ color: '#6b9eff', fontSize: 14, textDecoration: 'none' }}>
                  Water Fasting Forum - Extended fasts & OMAD
                </a>
              </div>
            </div>

            {/* Tips */}
            <div style={{ background: '#222', borderRadius: 12, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#eab308' }}>
                How to Participate
              </h3>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#aaa', fontSize: 13, lineHeight: 1.8 }}>
                <li>Be helpful first - answer questions, share tips</li>
                <li>Share your own fasting journey with the app</li>
                <li>Post in weekly discussion threads</li>
                <li>Don't spam - mention the app naturally when relevant</li>
                <li>Share progress screenshots (with permission)</li>
                <li>Engage with comments on your posts</li>
                <li>Cross-post success stories to multiple subreddits</li>
              </ul>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="https://reddit.com/r/intermittentfasting/submit" target="_blank" rel="noopener noreferrer"
                 style={{
                   padding: '10px 16px',
                   background: '#ff4500',
                   color: '#fff',
                   borderRadius: 8,
                   fontSize: 13,
                   fontWeight: 600,
                   textDecoration: 'none',
                 }}>
                Post to r/intermittentfasting
              </a>
              <a href="https://reddit.com/r/fasting/submit" target="_blank" rel="noopener noreferrer"
                 style={{
                   padding: '10px 16px',
                   background: '#ff4500',
                   color: '#fff',
                   borderRadius: 8,
                   fontSize: 13,
                   fontWeight: 600,
                   textDecoration: 'none',
                 }}>
                Post to r/fasting
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('https://fast-fasting-app.netlify.app');
                  alert('App URL copied!');
                }}
                style={{
                  padding: '10px 16px',
                  background: '#22c55e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}>
                Copy App URL
              </button>
            </div>

            {/* Post Templates */}
            <div style={{ marginTop: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#3b82f6' }}>
                Ready-to-Use Post Templates
              </h3>

              {/* Template 1 */}
              <div style={{ background: '#222', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ color: '#ff4500', fontSize: 13, fontWeight: 600 }}>r/intermittentfasting</span>
                  <button
                    onClick={() => {
                      const title = 'Built a free fasting tracker - would love feedback from this community';
                      const body = `Hey everyone! 👋

I've been doing IF for a while and got frustrated with overcomplicated fasting apps, so I built my own simple one.

**What it does:**
- Real-time fasting timer
- Shows 13 metabolic milestones (ketosis, autophagy, etc.)
- Journal to track how you're feeling
- Share your progress with fasting buddies

**It's free to try** (first 10 hours), then just $5/6 months for unlimited fasting.

Link: https://fast-fasting-app.netlify.app

Would love to know what features you'd find useful. I'm actively developing it based on feedback!

What's your current fasting schedule? I'm doing 18:6 most days.`;
                      navigator.clipboard.writeText(`TITLE: ${title}\n\nBODY:\n${body}`);
                      alert('Post copied! Paste into Reddit.');
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#ff4500',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}>
                    Copy Post
                  </button>
                </div>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  "Built a free fasting tracker - would love feedback from this community"
                </div>
                <div style={{ color: '#888', fontSize: 12 }}>
                  Friendly intro post asking for feedback - best for first post
                </div>
              </div>

              {/* Template 2 */}
              <div style={{ background: '#222', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ color: '#ff4500', fontSize: 13, fontWeight: 600 }}>r/fasting</span>
                  <button
                    onClick={() => {
                      const title = 'Made a simple fasting tracker that shows what\'s happening in your body at each stage';
                      const body = `After doing several 24-48 hour fasts, I wanted something that shows me the science of what's happening as I go.

Built this tracker that shows milestones like:
- Hour 4: Blood sugar stabilizes
- Hour 8: Entering ketosis
- Hour 12: Deep ketosis
- Hour 14: Autophagy begins
- Hour 16+: Peak fat burning

You can also journal how you're feeling at each stage and share your progress.

Free to try: https://fast-fasting-app.netlify.app

Anyone else find that knowing the science keeps you motivated during tough fasts?`;
                      navigator.clipboard.writeText(`TITLE: ${title}\n\nBODY:\n${body}`);
                      alert('Post copied! Paste into Reddit.');
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#ff4500',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}>
                    Copy Post
                  </button>
                </div>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  "Made a simple fasting tracker that shows what's happening in your body"
                </div>
                <div style={{ color: '#888', fontSize: 12 }}>
                  Science-focused for extended fasting community
                </div>
              </div>

              {/* Template 3 */}
              <div style={{ background: '#222', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ color: '#ff4500', fontSize: 13, fontWeight: 600 }}>r/loseit</span>
                  <button
                    onClick={() => {
                      const title = 'Intermittent fasting tracker I built to help stay consistent';
                      const body = `IF has been a game-changer for my weight loss journey. I built a simple app to help track fasts and stay motivated.

Shows you what's happening metabolically as you fast - like when you hit ketosis, when autophagy kicks in, etc. Really helps push through the tough hours knowing your body is doing good work!

Free to try here: https://fast-fasting-app.netlify.app

What fasting schedule has worked best for your weight loss?`;
                      navigator.clipboard.writeText(`TITLE: ${title}\n\nBODY:\n${body}`);
                      alert('Post copied! Paste into Reddit.');
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#ff4500',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}>
                    Copy Post
                  </button>
                </div>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  "Intermittent fasting tracker I built to help stay consistent"
                </div>
                <div style={{ color: '#888', fontSize: 12 }}>
                  Weight loss focused for r/loseit
                </div>
              </div>

              {/* Posting Tips */}
              <div style={{ background: '#1a2e1a', borderRadius: 12, padding: 16, border: '1px solid #22c55e30' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#22c55e' }}>
                  Posting Tips
                </h4>
                <ul style={{ margin: 0, paddingLeft: 16, color: '#888', fontSize: 12, lineHeight: 1.8 }}>
                  <li>Post ONE subreddit first, wait 24hrs for feedback</li>
                  <li>Best times: 9-11am EST (most US users online)</li>
                  <li>Reply to EVERY comment - engagement helps ranking</li>
                  <li>Add a screenshot of the app while fasting</li>
                  <li>Be genuine - you built this for yourself</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  color: '#888',
  fontWeight: 600,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  color: '#ccc',
};

function StatCard({
  icon,
  label,
  value,
  color,
  large = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  large?: boolean;
}) {
  return (
    <div style={{
      background: '#1a1a1a',
      borderRadius: 16,
      padding: 20,
      border: '1px solid #333',
      gridColumn: large ? 'span 1' : undefined,
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: `${color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color,
        marginBottom: 12,
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: '#888' }}>{label}</div>
    </div>
  );
}
