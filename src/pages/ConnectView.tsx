import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Flame, Clock, Users, ArrowLeft, Check, Zap, Brain,
  Heart, Sparkles, CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import {
  getConnectionByInviteCode, acceptShareConnection,
  getCurrentFast, type ShareConnection, type FastingSession
} from '../lib/supabase';

// Fasting milestones
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

export function ConnectView() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [connection, setConnection] = useState<ShareConnection | null>(null);
  const [initiatorFast, setInitiatorFast] = useState<FastingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [displayName, setDisplayName] = useState('');
  const [accepting, setAccepting] = useState(false);

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Pre-fill name from profile
  useEffect(() => {
    if (profile?.name) {
      setDisplayName(profile.name);
    }
  }, [profile]);

  // Load connection data
  useEffect(() => {
    const loadConnection = async () => {
      if (!inviteCode) {
        setError('Invalid invite link');
        setLoading(false);
        return;
      }

      try {
        const conn = await getConnectionByInviteCode(inviteCode);
        if (!conn) {
          setError('This invite link is no longer valid');
          setLoading(false);
          return;
        }

        setConnection(conn);

        // Load initiator's current fast
        if (conn.user_a) {
          const fast = await getCurrentFast(conn.user_a);
          setInitiatorFast(fast);
        }

        setLoading(false);
      } catch (e) {
        console.error('Error loading connection:', e);
        setError('Failed to load invite');
        setLoading(false);
      }
    };

    loadConnection();
  }, [inviteCode]);

  const handleAccept = async () => {
    if (!user || !connection || !displayName.trim()) return;

    setAccepting(true);
    try {
      const result = await acceptShareConnection(
        connection.invite_code,
        user.id,
        displayName.trim()
      );

      if (result) {
        // Success! Redirect to dashboard
        navigate('/dashboard');
      } else {
        setError('Failed to accept invite. It may have already been used.');
      }
    } catch (e) {
      console.error('Error accepting invite:', e);
      setError('Failed to accept invite');
    } finally {
      setAccepting(false);
    }
  };

  // Calculate elapsed time for initiator's fast
  let fastHours = 0;
  let fastMinutes = 0;
  let fastSeconds = 0;
  let milestone = FASTING_MILESTONES[0];

  if (initiatorFast) {
    const startTime = new Date(initiatorFast.start_time).getTime();
    const elapsedMs = now - startTime;
    const totalHours = elapsedMs / (1000 * 60 * 60);
    fastHours = Math.floor(totalHours);
    fastMinutes = Math.floor((totalHours - fastHours) * 60);
    fastSeconds = Math.floor(((totalHours - fastHours) * 60 - fastMinutes) * 60);
    milestone = getMilestoneForHours(totalHours);
  }

  // Check if already accepted
  const isAlreadyAccepted = connection?.accepted_at !== null;
  const isOwnInvite = user && connection?.user_a === user.id;

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 48,
          height: 48,
          border: '4px solid #e5e7eb',
          borderTopColor: '#8b5cf6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 40,
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#fef2f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <span style={{ fontSize: 32 }}>:(</span>
          </div>
          <h2 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 700 }}>Invite Not Found</h2>
          <p style={{ color: '#666', marginBottom: 24, lineHeight: 1.5 }}>{error}</p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      padding: '20px 16px',
    }}>
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          background: 'rgba(255, 255, 255, 0.9)',
          border: 'none',
          borderRadius: 12,
          cursor: 'pointer',
          marginBottom: 20,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <ArrowLeft size={18} color="#666" />
        <span style={{ color: '#666', fontSize: 14, fontWeight: 500 }}>Back</span>
      </button>

      <div style={{
        maxWidth: 440,
        margin: '0 auto',
      }}>
        {/* Main Card */}
        <div style={{
          background: '#fff',
          borderRadius: 24,
          padding: 32,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
        }}>
          {/* Header */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Users size={40} color="#fff" />
          </div>

          <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800 }}>
            {connection?.display_name_a} invited you!
          </h1>
          <p style={{ color: '#666', marginBottom: 28, fontSize: 16 }}>
            Connect to see each other's fasting progress in real-time
          </p>

          {/* Show initiator's current fast if any */}
          {initiatorFast && (
            <div style={{
              background: `linear-gradient(135deg, ${milestone.color}10 0%, ${milestone.color}20 100%)`,
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#22c55e',
                  animation: 'pulse 2s infinite',
                }} />
                <span style={{ fontSize: 14, color: milestone.color, fontWeight: 600 }}>
                  {connection?.display_name_a} is fasting now!
                </span>
              </div>
              <div style={{
                fontSize: 36,
                fontWeight: 800,
                color: milestone.color,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {fastHours.toString().padStart(2, '0')}:{fastMinutes.toString().padStart(2, '0')}:{fastSeconds.toString().padStart(2, '0')}
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                background: `${milestone.color}20`,
                borderRadius: 20,
                marginTop: 12,
              }}>
                <MilestoneIcon icon={milestone.icon} size={16} />
                <span style={{ fontSize: 13, fontWeight: 600, color: milestone.color }}>{milestone.title}</span>
              </div>
              <style>{`
                @keyframes pulse {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.5; }
                }
              `}</style>
            </div>
          )}

          {/* Already accepted message */}
          {isAlreadyAccepted && (
            <div style={{
              background: '#fef3c7',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
            }}>
              <p style={{ margin: 0, color: '#92400e', fontSize: 14 }}>
                This invite has already been accepted.
              </p>
            </div>
          )}

          {/* Own invite message */}
          {isOwnInvite && (
            <div style={{
              background: '#f3f4f6',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
            }}>
              <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
                This is your own invite link. Share it with a friend!
              </p>
            </div>
          )}

          {/* Accept form - only show if not own invite and not already accepted */}
          {!isOwnInvite && !isAlreadyAccepted && (
            <>
              {user ? (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{
                      fontSize: 12,
                      color: 'rgba(0,0,0,0.5)',
                      marginBottom: 8,
                      display: 'block',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 600,
                      textAlign: 'left',
                    }}>
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="How should they see you?"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: '2px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: 12,
                        fontSize: 16,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      autoFocus
                    />
                  </div>

                  <button
                    onClick={handleAccept}
                    disabled={!displayName.trim() || accepting}
                    style={{
                      width: '100%',
                      padding: '16px',
                      background: displayName.trim() && !accepting
                        ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                        : '#e5e5e5',
                      color: displayName.trim() && !accepting ? '#fff' : '#999',
                      border: 'none',
                      borderRadius: 12,
                      fontSize: 17,
                      fontWeight: 700,
                      cursor: displayName.trim() && !accepting ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {accepting ? (
                      'Connecting...'
                    ) : (
                      <>
                        <Check size={20} />
                        Accept & Connect
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <p style={{ color: '#666', marginBottom: 20 }}>
                    Sign in to accept this invite and start fasting together!
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    style={{
                      width: '100%',
                      padding: '16px',
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 12,
                      fontSize: 17,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Sign In to Accept
                  </button>
                </>
              )}
            </>
          )}

          {/* Go to dashboard button for own invite or already accepted */}
          {(isOwnInvite || isAlreadyAccepted) && user && (
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 17,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Go to Dashboard
            </button>
          )}
        </div>

        {/* Info section */}
        <div style={{
          marginTop: 24,
          padding: 20,
          background: 'rgba(255, 255, 255, 0.7)',
          borderRadius: 16,
          textAlign: 'center',
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#333' }}>
            What happens when you connect?
          </h3>
          <ul style={{
            margin: 0,
            padding: '0 0 0 20px',
            textAlign: 'left',
            color: '#666',
            fontSize: 14,
            lineHeight: 1.8,
          }}>
            <li>You'll see each other's fasting progress in real-time</li>
            <li>Both of you can see when the other starts or ends a fast</li>
            <li>Stay accountable together!</li>
          </ul>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 40, paddingBottom: 20 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.7)',
            borderRadius: 20,
          }}>
            <Flame size={18} color="#ef4444" />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>Fast!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
