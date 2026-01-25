import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Users, DollarSign, TrendingUp, Clock,
  CheckCircle2, UserPlus, Flame, ArrowLeft,
  RefreshCw, Activity, Zap, Brain, Heart, Sparkles, Timer
} from 'lucide-react';
import { format } from 'date-fns';

// Fasting milestones (same as app)
const FASTING_MILESTONES = [
  { hour: 0, title: 'Fast Begins', color: '#6b7280', icon: 'clock' },
  { hour: 4, title: 'Blood Sugar Stable', color: '#eab308', icon: 'zap' },
  { hour: 6, title: 'Fat Burning', color: '#f97316', icon: 'flame' },
  { hour: 8, title: 'Ketosis', color: '#ef4444', icon: 'flame' },
  { hour: 10, title: 'Growth Hormone', color: '#8b5cf6', icon: 'zap' },
  { hour: 12, title: 'Deep Ketosis', color: '#3b82f6', icon: 'brain' },
  { hour: 14, title: 'Autophagy', color: '#10b981', icon: 'sparkles' },
  { hour: 16, title: 'Autophagy Active', color: '#14b8a6', icon: 'sparkles' },
  { hour: 18, title: 'Peak Fat Burning', color: '#f43f5e', icon: 'flame' },
  { hour: 20, title: 'Inflammation Down', color: '#ec4899', icon: 'heart' },
  { hour: 22, title: 'Cell Renewal', color: '#a855f7', icon: 'sparkles' },
  { hour: 24, title: 'Complete!', color: '#22c55e', icon: 'check' },
];

function MilestoneIcon({ icon, size = 16 }: { icon: string; size?: number }) {
  switch (icon) {
    case 'flame': return <Flame size={size} />;
    case 'brain': return <Brain size={size} />;
    case 'zap': return <Zap size={size} />;
    case 'heart': return <Heart size={size} />;
    case 'sparkles': return <Sparkles size={size} />;
    case 'check': return <CheckCircle2 size={size} />;
    default: return <Clock size={size} />;
  }
}

function getMilestoneForHours(hours: number) {
  return FASTING_MILESTONES.filter(m => m.hour <= hours).pop() || FASTING_MILESTONES[0];
}

interface AdminStats {
  totalUsers: number;
  paidUsers: number;
  freeUsers: number;
  totalFasts: number;
  completedFasts: number;
  activeFasts: number;
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

interface ActiveFast {
  id: string;
  userId: string;
  email: string;
  name?: string;
  startTime: string;
  targetHours: number;
}

const ADMIN_EMAILS = ['chrismarinelli@live.com'];

export function Admin() {
  const navigate = useNavigate();
  const { user, session, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [activeFasts, setActiveFasts] = useState<ActiveFast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantMessage, setGrantMessage] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [showLiveFasts, setShowLiveFasts] = useState(false);
  const [now, setNow] = useState(Date.now());

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  // Update timer every second for live fasts
  useEffect(() => {
    if (showLiveFasts && activeFasts.length > 0) {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }
  }, [showLiveFasts, activeFasts.length]);

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
        fetchAdminData();
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
      setActiveFasts(data.activeFasts || []);
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
        background: 'linear-gradient(180deg, #f8fafc 0%, #e0f2fe 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#333',
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #e0f2fe 100%)' }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px',
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
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
            <span style={{ fontSize: 20, fontWeight: 800, color: '#333' }}>Fast! Admin</span>
          </div>
        </div>
        <button
          onClick={fetchAdminData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: '#22c55e',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600,
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
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            color: '#dc2626',
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
            icon={<Activity size={24} />}
            label="Live Now"
            value={stats?.activeFasts || 0}
            color="#ef4444"
            onClick={() => setShowLiveFasts(!showLiveFasts)}
            clickable
            active={showLiveFasts}
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

        {/* Live Fasts Section */}
        {showLiveFasts && (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 20,
            border: '1px solid #e5e7eb',
            marginBottom: 24,
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: 18,
              fontWeight: 700,
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Timer size={20} color="#ef4444" />
              Live Fasts ({activeFasts.length})
            </h3>

            {activeFasts.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 40,
                color: '#888',
                background: '#f9fafb',
                borderRadius: 12,
              }}>
                No active fasts right now
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeFasts.map(fast => {
                  const startTime = new Date(fast.startTime).getTime();
                  const durationMs = now - startTime;
                  const totalHours = durationMs / (1000 * 60 * 60);
                  const hours = Math.floor(totalHours);
                  const minutes = Math.floor((totalHours - hours) * 60);
                  const seconds = Math.floor((totalHours * 3600 - hours * 3600 - minutes * 60));
                  const milestone = getMilestoneForHours(totalHours);
                  const progress = Math.min(100, (totalHours / fast.targetHours) * 100);
                  const nextMilestone = FASTING_MILESTONES.find(m => m.hour > totalHours);

                  return (
                    <div
                      key={fast.id}
                      style={{
                        background: '#fff',
                        borderRadius: 16,
                        padding: 20,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                        border: '1px solid #e5e7eb',
                        borderLeft: `4px solid ${milestone.color}`,
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 12,
                      }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#333' }}>
                            {fast.name || fast.email}
                          </div>
                          {fast.name && (
                            <div style={{ fontSize: 12, color: '#888' }}>{fast.email}</div>
                          )}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginTop: 4,
                            color: milestone.color,
                            fontSize: 13,
                            fontWeight: 600,
                          }}>
                            <MilestoneIcon icon={milestone.icon} size={14} />
                            {milestone.title}
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          background: 'rgba(34, 197, 94, 0.1)',
                          borderRadius: 12,
                          color: '#16a34a',
                          fontSize: 11,
                          fontWeight: 600,
                        }}>
                          <RefreshCw size={10} style={{ animation: 'spin 2s linear infinite' }} />
                          LIVE
                        </div>
                      </div>
                      <div style={{
                        fontSize: 'clamp(24px, 6vw, 32px)',
                        fontWeight: 800,
                        color: milestone.color,
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {hours}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                      </div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                        Started {format(new Date(fast.startTime), 'h:mm a')}
                      </div>

                      {/* Progress Bar */}
                      <div style={{ marginTop: 16 }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 6,
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: milestone.color }}>
                            {Math.round(progress)}% Complete
                          </span>
                          <span style={{ fontSize: 11, color: '#888' }}>
                            Goal: {fast.targetHours}h
                          </span>
                        </div>
                        <div style={{ position: 'relative' }}>
                          {/* Track */}
                          <div style={{
                            width: '100%',
                            height: 8,
                            background: 'rgba(0,0,0,0.08)',
                            borderRadius: 4,
                          }}>
                            {/* Fill */}
                            <div style={{
                              width: `${progress}%`,
                              height: '100%',
                              background: progress >= 100
                                ? '#22c55e'
                                : `linear-gradient(90deg, ${milestone.color}, ${nextMilestone?.color || '#22c55e'})`,
                              borderRadius: 4,
                              transition: 'width 1s linear',
                            }} />
                          </div>
                          {/* Milestone dots */}
                          {FASTING_MILESTONES.filter(m => m.hour > 0 && m.hour <= fast.targetHours).map(m => {
                            const isPassed = totalHours >= m.hour;
                            return (
                              <div
                                key={m.hour}
                                style={{
                                  position: 'absolute',
                                  left: `${(m.hour / fast.targetHours) * 100}%`,
                                  top: '50%',
                                  transform: 'translate(-50%, -50%)',
                                }}
                              >
                                <div style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  background: isPassed ? m.color : '#e5e5e5',
                                  border: '2px solid #fff',
                                  boxShadow: isPassed ? `0 1px 4px ${m.color}40` : '0 1px 2px rgba(0,0,0,0.1)',
                                }} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Grant Access Form */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 20,
          border: '1px solid #e5e7eb',
          marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700, color: '#333' }}>
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
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                color: '#333',
                fontSize: 14,
              }}
            />
            <button
              onClick={() => grantAccess(grantEmail)}
              disabled={grantLoading || !grantEmail}
              style={{
                padding: '10px 20px',
                background: grantLoading ? '#ccc' : '#22c55e',
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
              background: grantMessage.startsWith('Success') ? '#dcfce7' : '#fef2f2',
              color: grantMessage.startsWith('Success') ? '#16a34a' : '#dc2626',
              fontSize: 14,
            }}>
              {grantMessage}
            </div>
          )}
        </div>

        {/* Users Table */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#333' }}>
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
                <tr style={{ background: '#f9fafb' }}>
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
                    <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#888' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={tdStyle}>
                        <div style={{ color: '#333', fontWeight: 500 }}>{u.email}</div>
                        {u.name && <div style={{ color: '#888', fontSize: 12 }}>{u.name}</div>}
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          background: u.paidUntil && new Date(u.paidUntil) > new Date()
                            ? '#dcfce7'
                            : '#fef3c7',
                          color: u.paidUntil && new Date(u.paidUntil) > new Date()
                            ? '#16a34a'
                            : '#d97706',
                        }}>
                          {u.paidUntil && new Date(u.paidUntil) > new Date() ? 'PAID' : 'FREE'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {u.paidUntil ? (
                          <span style={{ color: new Date(u.paidUntil) > new Date() ? '#16a34a' : '#888' }}>
                            {format(new Date(u.paidUntil), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <span style={{ color: '#888' }}>-</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#333' }}>{u.fastsCompleted}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#666' }}>
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
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#333' }}>
            Marketing & Community Outreach
          </h2>

          <div style={{ display: 'grid', gap: 16 }}>
            {/* Reddit Communities */}
            <div style={{ background: '#fef2f2', borderRadius: 12, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#ff4500' }}>
                Reddit Communities
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="https://reddit.com/r/intermittentfasting" target="_blank" rel="noopener noreferrer"
                   style={{ color: '#3b82f6', fontSize: 14, textDecoration: 'none' }}>
                  r/intermittentfasting - Main IF community (2M+ members)
                </a>
                <a href="https://reddit.com/r/fasting" target="_blank" rel="noopener noreferrer"
                   style={{ color: '#3b82f6', fontSize: 14, textDecoration: 'none' }}>
                  r/fasting - Extended fasting discussions
                </a>
                <a href="https://reddit.com/r/loseit" target="_blank" rel="noopener noreferrer"
                   style={{ color: '#3b82f6', fontSize: 14, textDecoration: 'none' }}>
                  r/loseit - Weight loss community (2M+ members)
                </a>
                <a href="https://reddit.com/r/keto" target="_blank" rel="noopener noreferrer"
                   style={{ color: '#3b82f6', fontSize: 14, textDecoration: 'none' }}>
                  r/keto - Keto + fasting synergy
                </a>
                <a href="https://reddit.com/r/progresspics" target="_blank" rel="noopener noreferrer"
                   style={{ color: '#3b82f6', fontSize: 14, textDecoration: 'none' }}>
                  r/progresspics - Before/after transformations
                </a>
              </div>
            </div>

            {/* Other Forums */}
            <div style={{ background: '#dcfce7', borderRadius: 12, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#16a34a' }}>
                Other Fasting Forums
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="https://thefastdiet.co.uk/forums" target="_blank" rel="noopener noreferrer"
                   style={{ color: '#3b82f6', fontSize: 14, textDecoration: 'none' }}>
                  The Fast Diet Forum - 5:2 fasting community
                </a>
                <a href="https://ketogenicforums.com/c/fast" target="_blank" rel="noopener noreferrer"
                   style={{ color: '#3b82f6', fontSize: 14, textDecoration: 'none' }}>
                  Ketogenic Forums - Fasting category
                </a>
                <a href="https://waterfastingforum.com" target="_blank" rel="noopener noreferrer"
                   style={{ color: '#3b82f6', fontSize: 14, textDecoration: 'none' }}>
                  Water Fasting Forum - Extended fasts & OMAD
                </a>
              </div>
            </div>

            {/* Tips */}
            <div style={{ background: '#fef9c3', borderRadius: 12, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#ca8a04' }}>
                How to Participate
              </h3>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#666', fontSize: 13, lineHeight: 1.8 }}>
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
              <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 12 }}>
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
                <div style={{ color: '#333', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  "Built a free fasting tracker - would love feedback from this community"
                </div>
                <div style={{ color: '#888', fontSize: 12 }}>
                  Friendly intro post asking for feedback - best for first post
                </div>
              </div>

              {/* Template 2 */}
              <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 12 }}>
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
                <div style={{ color: '#333', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  "Made a simple fasting tracker that shows what's happening in your body"
                </div>
                <div style={{ color: '#888', fontSize: 12 }}>
                  Science-focused for extended fasting community
                </div>
              </div>

              {/* Template 3 */}
              <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 12 }}>
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
                <div style={{ color: '#333', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  "Intermittent fasting tracker I built to help stay consistent"
                </div>
                <div style={{ color: '#888', fontSize: 12 }}>
                  Weight loss focused for r/loseit
                </div>
              </div>

              {/* Posting Tips */}
              <div style={{ background: '#dcfce7', borderRadius: 12, padding: 16, border: '1px solid #bbf7d0' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
                  Posting Tips
                </h4>
                <ul style={{ margin: 0, paddingLeft: 16, color: '#666', fontSize: 12, lineHeight: 1.8 }}>
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

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  color: '#666',
  fontWeight: 600,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  color: '#333',
};

function StatCard({
  icon,
  label,
  value,
  color,
  large = false,
  onClick,
  clickable = false,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  large?: boolean;
  onClick?: () => void;
  clickable?: boolean;
  active?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: active ? `${color}10` : '#fff',
        borderRadius: 16,
        padding: 20,
        border: active ? `2px solid ${color}` : '1px solid #e5e7eb',
        gridColumn: large ? 'span 1' : undefined,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        boxShadow: active ? `0 4px 12px ${color}20` : '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color,
        marginBottom: 12,
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#333', marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: '#666' }}>{label}</div>
      {clickable && (
        <div style={{ fontSize: 11, color: color, marginTop: 4, fontWeight: 500 }}>
          Click to {active ? 'hide' : 'view'}
        </div>
      )}
    </div>
  );
}
