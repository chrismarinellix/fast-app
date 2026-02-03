import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Users, DollarSign, TrendingUp, Clock,
  CheckCircle2, UserPlus, Flame, ArrowLeft,
  RefreshCw, Activity, Zap, Brain, Heart, Sparkles, Timer, Network
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

interface NetworkNode {
  id: string;
  name: string;
  email: string;
  isFasting: boolean;
  connectionCount: number;
  isPaid: boolean;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  sourceLabel: string;
  targetLabel: string;
  createdAt: string;
}

interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

interface UserDetailData {
  profile: {
    id: string;
    email: string;
    name?: string;
    subscriptionStatus: string;
    stripeCustomerId?: string;
    paidUntil?: string;
    fastsCompleted: number;
    createdAt: string;
  };
  stats: {
    totalFasts: number;
    completedFasts: number;
    totalFastingHours: number;
    longestFast: number;
    connectionCount: number;
    pendingInvites: number;
    groupCount: number;
    shareCount: number;
  };
  currentFast?: {
    id: string;
    startTime: string;
    targetHours: number;
    confirmedAt?: string;
  };
  recentFasts: Array<{
    id: string;
    startTime: string;
    endTime?: string;
    targetHours: number;
    completed: boolean;
  }>;
  recentNotes: Array<{
    id: string;
    hourMark: number;
    mood: string;
    energyLevel: number;
    hungerLevel: number;
    note?: string;
    createdAt: string;
  }>;
  connections: Array<{
    id: string;
    isInitiator: boolean;
    otherUserId: string;
    displayName?: string;
    myDisplayName: string;
    accepted: boolean;
    createdAt: string;
    acceptedAt?: string;
  }>;
  groups: Array<{
    id: string;
    name: string;
    displayName: string;
    joinedAt: string;
  }>;
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
  const [showNetwork, setShowNetwork] = useState(false);
  const [networkData, setNetworkData] = useState<NetworkData | null>(null);
  const [now, setNow] = useState(Date.now());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const nodesRef = useRef<NetworkNode[]>([]);

  // User detail modal
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetailData | null>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  // Notification modal
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationTargets, setNotificationTargets] = useState<string[]>([]);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'admin' | 'system' | 'reminder'>('admin');
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationResult, setNotificationResult] = useState<string | null>(null);

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  // Update timer every second for live fasts
  useEffect(() => {
    if (showLiveFasts && activeFasts.length > 0) {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }
  }, [showLiveFasts, activeFasts.length]);

  // Fetch user details
  const fetchUserDetails = async (userId: string) => {
    if (!session?.access_token) return;

    setLoadingUserDetails(true);
    try {
      const response = await fetch(`/.netlify/functions/admin-user-details?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setUserDetails(data);
      } else {
        console.error('Error fetching user details:', data.error);
      }
    } catch (err: any) {
      console.error('Error fetching user details:', err);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // Open user detail modal
  const openUserDetails = (u: UserData) => {
    setSelectedUser(u);
    setUserDetails(null);
    fetchUserDetails(u.id);
  };

  // Send notification
  const sendNotification = async () => {
    if (!session?.access_token || notificationTargets.length === 0 || !notificationTitle || !notificationMessage) return;

    setSendingNotification(true);
    setNotificationResult(null);

    try {
      const response = await fetch('/.netlify/functions/admin-send-notification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: notificationTargets,
          title: notificationTitle,
          message: notificationMessage,
          type: notificationType,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setNotificationResult(`Success! ${data.message}`);
        setNotificationTitle('');
        setNotificationMessage('');
        setTimeout(() => {
          setShowNotificationModal(false);
          setNotificationResult(null);
        }, 2000);
      } else {
        setNotificationResult(`Error: ${data.error}`);
        if (data.migration) {
          console.log('Run this SQL migration:', data.migration);
        }
      }
    } catch (err: any) {
      setNotificationResult(`Error: ${err.message}`);
    } finally {
      setSendingNotification(false);
    }
  };

  // Send notification to a single user
  const openNotificationForUser = (userId: string) => {
    setNotificationTargets([userId]);
    setShowNotificationModal(true);
  };

  // Send notification to all users
  const openNotificationForAll = () => {
    setNotificationTargets(users.map(u => u.id));
    setShowNotificationModal(true);
  };

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

      const text = await response.text();

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned invalid response: ${text.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch admin data');
      }
      setStats(data.stats);
      setUsers(data.users || []);
      setActiveFasts(data.activeFasts || []);
      setNetworkData(data.network || null);
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
          <StatCard
            icon={<Network size={24} />}
            label="Network"
            value={networkData?.edges.length || 0}
            color="#8b5cf6"
            onClick={() => setShowNetwork(!showNetwork)}
            clickable
            active={showNetwork}
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

        {/* Network Visualization Section */}
        {showNetwork && networkData && (
          <NetworkVisualization
            networkData={networkData}
            canvasRef={canvasRef}
            animationRef={animationRef}
            nodesRef={nodesRef}
          />
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
            <button
              onClick={openNotificationForAll}
              style={{
                padding: '8px 16px',
                background: '#8b5cf6',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              📢 Message All Users
            </button>
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
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#888' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => openUserDetails(u)}
                    >
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
                      <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => openNotificationForUser(u.id)}
                            style={{
                              padding: '4px 8px',
                              background: '#8b5cf620',
                              color: '#8b5cf6',
                              border: '1px solid #8b5cf6',
                              borderRadius: 6,
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                            title="Send message"
                          >
                            💬
                          </button>
                          <button
                            onClick={() => {
                              setGrantEmail(u.email);
                            }}
                            style={{
                              padding: '4px 8px',
                              background: '#22c55e20',
                              color: '#22c55e',
                              border: '1px solid #22c55e',
                              borderRadius: 6,
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                            title="Grant access"
                          >
                            ⭐
                          </button>
                        </div>
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

      {/* User Detail Modal */}
      {selectedUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          zIndex: 1000,
        }}
          onClick={() => setSelectedUser(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 20,
              maxWidth: 700,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: 24,
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: '#fff',
              zIndex: 10,
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#333' }}>
                  {selectedUser.name || selectedUser.email}
                </h2>
                <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                  {selectedUser.email}
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#f5f5f5',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: 24 }}>
              {loadingUserDetails ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                  Loading user details...
                </div>
              ) : userDetails ? (
                <>
                  {/* Quick Actions */}
                  <div style={{
                    display: 'flex',
                    gap: 10,
                    marginBottom: 24,
                    flexWrap: 'wrap',
                  }}>
                    <button
                      onClick={() => openNotificationForUser(selectedUser.id)}
                      style={{
                        padding: '10px 16px',
                        background: '#8b5cf6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      💬 Send Message
                    </button>
                    <button
                      onClick={() => {
                        setGrantEmail(selectedUser.email);
                        setSelectedUser(null);
                      }}
                      style={{
                        padding: '10px 16px',
                        background: '#22c55e',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      ⭐ Grant Access
                    </button>
                  </div>

                  {/* Stats Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: 12,
                    marginBottom: 24,
                  }}>
                    <div style={{ background: '#f9fafb', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#333' }}>{userDetails.stats.totalFasts}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>Total Fasts</div>
                    </div>
                    <div style={{ background: '#f9fafb', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{userDetails.stats.completedFasts}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>Completed</div>
                    </div>
                    <div style={{ background: '#f9fafb', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{userDetails.stats.totalFastingHours}h</div>
                      <div style={{ fontSize: 11, color: '#888' }}>Total Hours</div>
                    </div>
                    <div style={{ background: '#f9fafb', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#f97316' }}>{userDetails.stats.longestFast}h</div>
                      <div style={{ fontSize: 11, color: '#888' }}>Longest Fast</div>
                    </div>
                    <div style={{ background: '#f9fafb', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6' }}>{userDetails.stats.connectionCount}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>Connections</div>
                    </div>
                    <div style={{ background: '#f9fafb', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#ec4899' }}>{userDetails.stats.groupCount}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>Groups</div>
                    </div>
                  </div>

                  {/* Current Fast */}
                  {userDetails.currentFast && (
                    <div style={{
                      background: '#dcfce7',
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 20,
                      border: '1px solid #bbf7d0',
                    }}>
                      <div style={{ fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>🔥 Currently Fasting</div>
                      <div style={{ fontSize: 13, color: '#166534' }}>
                        Started: {format(new Date(userDetails.currentFast.startTime), 'MMM d, h:mm a')}
                        {' • '}Target: {userDetails.currentFast.targetHours}h
                      </div>
                    </div>
                  )}

                  {/* Profile Info */}
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 12 }}>Account Details</h3>
                    <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, fontSize: 13 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ color: '#888' }}>Status</span>
                        <span style={{
                          fontWeight: 600,
                          color: userDetails.profile.paidUntil && new Date(userDetails.profile.paidUntil) > new Date() ? '#16a34a' : '#d97706',
                        }}>
                          {userDetails.profile.paidUntil && new Date(userDetails.profile.paidUntil) > new Date() ? 'PAID' : 'FREE'}
                        </span>
                      </div>
                      {userDetails.profile.paidUntil && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ color: '#888' }}>Paid Until</span>
                          <span>{format(new Date(userDetails.profile.paidUntil), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      {userDetails.profile.stripeCustomerId && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ color: '#888' }}>Stripe ID</span>
                          <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{userDetails.profile.stripeCustomerId}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#888' }}>Joined</span>
                        <span>{format(new Date(userDetails.profile.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Fasts */}
                  {userDetails.recentFasts.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 12 }}>Recent Fasts</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {userDetails.recentFasts.slice(0, 5).map(fast => {
                          const duration = fast.endTime
                            ? (new Date(fast.endTime).getTime() - new Date(fast.startTime).getTime()) / (1000 * 60 * 60)
                            : 0;
                          return (
                            <div key={fast.id} style={{
                              background: '#f9fafb',
                              padding: 12,
                              borderRadius: 10,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}>
                              <div style={{ fontSize: 13 }}>
                                {format(new Date(fast.startTime), 'MMM d, yyyy')}
                                <span style={{ color: '#888', marginLeft: 8 }}>
                                  {fast.endTime ? `${Math.round(duration * 10) / 10}h` : 'In progress'}
                                </span>
                              </div>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 600,
                                background: fast.completed ? '#dcfce7' : '#fef3c7',
                                color: fast.completed ? '#16a34a' : '#d97706',
                              }}>
                                {fast.completed ? 'Completed' : 'Ended Early'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Connections */}
                  {userDetails.connections.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 12 }}>
                        Connections ({userDetails.connections.length})
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {userDetails.connections.map(conn => (
                          <div key={conn.id} style={{
                            background: conn.accepted ? '#f0f9ff' : '#fef3c7',
                            padding: '6px 12px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 500,
                            color: conn.accepted ? '#0369a1' : '#d97706',
                          }}>
                            {conn.displayName || 'Unknown'} {!conn.accepted && '(pending)'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Notes */}
                  {userDetails.recentNotes.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 12 }}>
                        Recent Journal Entries
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {userDetails.recentNotes.slice(0, 3).map(note => (
                          <div key={note.id} style={{
                            background: '#f9fafb',
                            padding: 12,
                            borderRadius: 10,
                            fontSize: 13,
                          }}>
                            <div style={{ marginBottom: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 600 }}>Hour {note.hourMark}</span>
                              <span>Mood: {note.mood}</span>
                              <span>Energy: {note.energyLevel}/5</span>
                              <span>Hunger: {note.hungerLevel}/5</span>
                            </div>
                            {note.note && <div style={{ color: '#666', fontStyle: 'italic' }}>"{note.note}"</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                  Failed to load user details
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          zIndex: 1001,
        }}
          onClick={() => setShowNotificationModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 20,
              maxWidth: 500,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: 24,
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#333' }}>
                  📢 Send Notification
                </h2>
                <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                  Sending to {notificationTargets.length} user{notificationTargets.length !== 1 ? 's' : ''}
                </div>
              </div>
              <button
                onClick={() => setShowNotificationModal(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#f5f5f5',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  fontSize: 12,
                  color: '#888',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: 6,
                }}>
                  Title
                </label>
                <input
                  type="text"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="e.g., Welcome! 👋"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{
                  fontSize: 12,
                  color: '#888',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: 6,
                }}>
                  Message
                </label>
                <textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Your message here..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    fontSize: 14,
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  fontSize: 12,
                  color: '#888',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: 6,
                }}>
                  Type
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['admin', 'system', 'reminder'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setNotificationType(type)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: notificationType === type ? 'none' : '1px solid #e5e7eb',
                        background: notificationType === type ? '#8b5cf6' : '#fff',
                        color: notificationType === type ? '#fff' : '#666',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {notificationResult && (
                <div style={{
                  padding: 12,
                  borderRadius: 10,
                  marginBottom: 16,
                  background: notificationResult.startsWith('Success') ? '#dcfce7' : '#fef2f2',
                  color: notificationResult.startsWith('Success') ? '#16a34a' : '#dc2626',
                  fontSize: 13,
                }}>
                  {notificationResult}
                </div>
              )}

              <button
                onClick={sendNotification}
                disabled={sendingNotification || !notificationTitle || !notificationMessage}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: sendingNotification || !notificationTitle || !notificationMessage ? '#e5e5e5' : '#8b5cf6',
                  color: sendingNotification || !notificationTitle || !notificationMessage ? '#999' : '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: sendingNotification || !notificationTitle || !notificationMessage ? 'not-allowed' : 'pointer',
                }}
              >
                {sendingNotification ? 'Sending...' : `Send to ${notificationTargets.length} User${notificationTargets.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

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

// Network Visualization Component
function NetworkVisualization({
  networkData,
  canvasRef,
  animationRef,
  nodesRef,
}: {
  networkData: NetworkData;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  animationRef: React.MutableRefObject<number | null>;
  nodesRef: React.MutableRefObject<NetworkNode[]>;
}) {
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !networkData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize node positions with physics
    const width = canvas.getBoundingClientRect().width;
    const height = canvas.getBoundingClientRect().height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Initialize nodes with random positions in a circle
    nodesRef.current = networkData.nodes.map((node, i) => {
      const angle = (i / networkData.nodes.length) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.35;
      return {
        ...node,
        x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 50,
        y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 50,
        vx: 0,
        vy: 0,
      };
    });

    // Physics constants
    const REPULSION = 2000;
    const ATTRACTION = 0.005;
    const DAMPING = 0.85;
    const CENTER_GRAVITY = 0.003;
    let globalAngle = 0;

    // Animation loop
    const animate = () => {
      const nodes = nodesRef.current;
      const edges = networkData.edges;

      // Clear canvas with a gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(1, '#1e293b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Apply physics
      nodes.forEach((node, i) => {
        // Repulsion from other nodes
        nodes.forEach((other, j) => {
          if (i === j) return;
          const dx = (node.x || 0) - (other.x || 0);
          const dy = (node.y || 0) - (other.y || 0);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = REPULSION / (dist * dist);
          node.vx = (node.vx || 0) + (dx / dist) * force;
          node.vy = (node.vy || 0) + (dy / dist) * force;
        });

        // Attraction to center
        node.vx = (node.vx || 0) + (centerX - (node.x || 0)) * CENTER_GRAVITY;
        node.vy = (node.vy || 0) + (centerY - (node.y || 0)) * CENTER_GRAVITY;

        // Slow orbital rotation
        const angle = Math.atan2((node.y || 0) - centerY, (node.x || 0) - centerX);
        node.vx = (node.vx || 0) + Math.cos(angle + Math.PI / 2) * 0.15;
        node.vy = (node.vy || 0) + Math.sin(angle + Math.PI / 2) * 0.15;
      });

      // Edge attraction
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (!source || !target) return;

        const dx = (target.x || 0) - (source.x || 0);
        const dy = (target.y || 0) - (source.y || 0);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = dist * ATTRACTION;

        source.vx = (source.vx || 0) + (dx / dist) * force;
        source.vy = (source.vy || 0) + (dy / dist) * force;
        target.vx = (target.vx || 0) - (dx / dist) * force;
        target.vy = (target.vy || 0) - (dy / dist) * force;
      });

      // Update positions with damping
      nodes.forEach(node => {
        node.vx = (node.vx || 0) * DAMPING;
        node.vy = (node.vy || 0) * DAMPING;
        node.x = (node.x || 0) + (node.vx || 0);
        node.y = (node.y || 0) + (node.vy || 0);

        // Keep nodes in bounds
        const margin = 40;
        node.x = Math.max(margin, Math.min(width - margin, node.x || 0));
        node.y = Math.max(margin, Math.min(height - margin, node.y || 0));
      });

      // Draw edges with glow effect
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (!source || !target) return;

        // Glowing edge
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#8b5cf6';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(source.x || 0, source.y || 0);
        ctx.lineTo(target.x || 0, target.y || 0);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Main edge line
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(source.x || 0, source.y || 0);
        ctx.lineTo(target.x || 0, target.y || 0);
        ctx.stroke();
      });

      // Draw nodes
      nodes.forEach(node => {
        const x = node.x || 0;
        const y = node.y || 0;
        const radius = node.connectionCount > 0 ? 12 + node.connectionCount * 2 : 8;

        // Outer glow for fasting users
        if (node.isFasting) {
          ctx.beginPath();
          ctx.arc(x, y, radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
          ctx.fill();

          // Pulsing ring animation
          const pulse = Math.sin(globalAngle * 2 + nodes.indexOf(node)) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(x, y, radius + 4 + pulse * 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(34, 197, 94, ${0.3 + pulse * 0.3})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Node shadow
        ctx.shadowColor = node.isFasting ? '#22c55e' : (node.connectionCount > 0 ? '#8b5cf6' : '#475569');
        ctx.shadowBlur = 15;

        // Node fill
        let nodeColor;
        if (node.isFasting) {
          nodeColor = '#22c55e'; // Green for fasting
        } else if (node.connectionCount > 0) {
          nodeColor = '#8b5cf6'; // Purple for connected
        } else {
          nodeColor = '#64748b'; // Gray for solo
        }

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner highlight
        ctx.beginPath();
        ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();

        // Node border
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = node.isPaid ? '#eab308' : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = node.isPaid ? 3 : 1;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.name.substring(0, 12), x, y + radius + 16);
      });

      // Draw legend
      const legendX = 20;
      const legendY = height - 100;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Legend:', legendX, legendY);

      // Legend items
      const items = [
        { color: '#22c55e', label: 'Currently Fasting' },
        { color: '#8b5cf6', label: 'Connected' },
        { color: '#64748b', label: 'Solo Faster' },
        { color: '#eab308', label: 'Paid User (gold border)' },
      ];

      items.forEach((item, i) => {
        const y = legendY + 18 + i * 18;
        ctx.beginPath();
        ctx.arc(legendX + 6, y - 4, 5, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        ctx.fillText(item.label, legendX + 18, y);
      });

      // Stats overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      const statsX = width - 20;
      ctx.fillText(`${nodes.length} Users`, statsX, 30);
      ctx.fillText(`${edges.length} Connections`, statsX, 50);
      ctx.fillText(`${nodes.filter(n => n.isFasting).length} Fasting Now`, statsX, 70);

      globalAngle += 0.02;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [networkData, canvasRef, animationRef, nodesRef]);

  // Mouse interaction
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const nodes = nodesRef.current;
    const hovered = nodes.find(node => {
      const dx = (node.x || 0) - x;
      const dy = (node.y || 0) - y;
      const radius = node.connectionCount > 0 ? 12 + node.connectionCount * 2 : 8;
      return Math.sqrt(dx * dx + dy * dy) < radius + 5;
    });

    setHoveredNode(hovered || null);
  }, [canvasRef, nodesRef]);

  return (
    <div style={{
      background: '#0f172a',
      borderRadius: 16,
      padding: 20,
      border: '1px solid #334155',
      marginBottom: 24,
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    }}>
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: 18,
        fontWeight: 700,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <Network size={20} color="#8b5cf6" />
        User Connection Network
        <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8', marginLeft: 8 }}>
          (nodes = users, edges = share connections)
        </span>
      </h3>

      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredNode(null)}
          style={{
            width: '100%',
            height: 500,
            borderRadius: 12,
            cursor: hoveredNode ? 'pointer' : 'default',
          }}
        />

        {/* Hover tooltip */}
        {hoveredNode && (
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid #334155',
            borderRadius: 12,
            padding: 16,
            color: '#fff',
            fontSize: 13,
            minWidth: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
              {hoveredNode.name}
            </div>
            <div style={{ color: '#94a3b8', marginBottom: 4 }}>{hoveredNode.email}</div>
            <div style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              marginTop: 8,
            }}>
              {hoveredNode.isFasting && (
                <span style={{
                  background: '#22c55e20',
                  color: '#22c55e',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                }}>
                  FASTING NOW
                </span>
              )}
              {hoveredNode.isPaid && (
                <span style={{
                  background: '#eab30820',
                  color: '#eab308',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                }}>
                  PAID
                </span>
              )}
              <span style={{
                background: '#8b5cf620',
                color: '#8b5cf6',
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
              }}>
                {hoveredNode.connectionCount} connections
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
