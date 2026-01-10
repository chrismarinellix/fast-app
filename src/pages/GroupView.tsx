import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Flame, Clock, CheckCircle2, Trophy, Zap, Brain,
  Heart, Sparkles, Users, Timer, ArrowRight, RefreshCw,
  Copy, Check, UserPlus, X, ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import {
  getGroupDetails, joinShareGroup, leaveShareGroup,
  type ShareGroup, type GroupMemberWithFast, type FastingSession
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

function formatDuration(fast: FastingSession, now: number): { hours: number; minutes: number; seconds: number } {
  const startTime = new Date(fast.start_time).getTime();
  const endTime = fast.end_time ? new Date(fast.end_time).getTime() : now;
  const durationMs = endTime - startTime;
  const totalHours = durationMs / (1000 * 60 * 60);
  return {
    hours: Math.floor(totalHours),
    minutes: Math.floor((totalHours - Math.floor(totalHours)) * 60),
    seconds: Math.floor((totalHours * 3600 - Math.floor(totalHours) * 3600 - Math.floor((totalHours - Math.floor(totalHours)) * 60) * 60)),
  };
}

export function GroupView() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [group, setGroup] = useState<ShareGroup | null>(null);
  const [members, setMembers] = useState<GroupMemberWithFast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinName, setJoinName] = useState('');
  const [joining, setJoining] = useState(false);

  // Check if current user is a member
  const currentUserMember = user ? members.find(m => m.user_id === user.id) : null;
  const isMember = !!currentUserMember;

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Load group data
  useEffect(() => {
    const loadGroup = async () => {
      if (!inviteCode) {
        setError('Invalid group link');
        setLoading(false);
        return;
      }

      try {
        const details = await getGroupDetails(inviteCode);
        if (!details) {
          setError('This group no longer exists');
          setLoading(false);
          return;
        }

        setGroup(details.group);
        setMembers(details.members);
        setLoading(false);
      } catch (err) {
        console.error('Error loading group:', err);
        setError('Failed to load group');
        setLoading(false);
      }
    };

    loadGroup();
  }, [inviteCode]);

  // Set join name from profile
  useEffect(() => {
    if (profile?.name) {
      setJoinName(profile.name);
    }
  }, [profile]);

  const handleJoinGroup = async () => {
    if (!user || !group || !joinName.trim()) return;

    setJoining(true);
    try {
      const membership = await joinShareGroup(group.id, user.id, joinName.trim());
      if (membership) {
        // Refresh group data
        const details = await getGroupDetails(inviteCode!);
        if (details) {
          setMembers(details.members);
        }
        setShowJoinModal(false);
      }
    } catch (e) {
      console.error('Error joining group:', e);
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!user || !group) return;

    if (!confirm('Are you sure you want to leave this group?')) return;

    const success = await leaveShareGroup(group.id, user.id);
    if (success) {
      setMembers(members.filter(m => m.user_id !== user.id));
    }
  };

  const handleCopyInvite = async () => {
    const inviteUrl = `${window.location.origin}/group/${inviteCode}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}>
        <Users size={48} color="#8b5cf6" />
        <div style={{ fontSize: 24, fontWeight: 700, color: '#5b21b6' }}>Loading group...</div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 24,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 64 }}>😔</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#991b1b' }}>
          {error || 'Group not found'}
        </div>
        <p style={{ color: '#666', maxWidth: 400 }}>
          This group link may have expired or been removed.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            marginTop: 16,
            padding: '12px 24px',
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          Go to Dashboard <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  // Separate members into currently fasting and not fasting
  const fastingMembers = members.filter(m => m.current_fast);
  const notFastingMembers = members.filter(m => !m.current_fast);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      padding: '24px 16px',
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.8)',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
            color: '#666',
            cursor: 'pointer',
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: 'rgba(139, 92, 246, 0.15)',
            borderRadius: 20,
            marginBottom: 16,
          }}>
            <Users size={16} color="#8b5cf6" />
            <span style={{ color: '#5b21b6', fontWeight: 500, fontSize: 14 }}>
              Fasting Group
            </span>
          </div>
          <h1 style={{
            fontSize: 'clamp(24px, 6vw, 32px)',
            fontWeight: 800,
            color: '#5b21b6',
            margin: 0,
            lineHeight: 1.2,
          }}>
            {group.name}
          </h1>
          <p style={{ color: '#666', marginTop: 8 }}>
            {members.length} member{members.length !== 1 ? 's' : ''} fasting together
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: 10,
          marginBottom: 24,
        }}>
          {isMember ? (
            <>
              <button
                onClick={handleCopyInvite}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: copied ? '#22c55e' : '#fff',
                  color: copied ? '#fff' : '#5b21b6',
                  border: '2px solid #8b5cf6',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copied!' : 'Invite Friends'}
              </button>
              <button
                onClick={handleLeaveGroup}
                style={{
                  padding: '12px 16px',
                  background: '#fff',
                  color: '#ef4444',
                  border: '2px solid #ef4444',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Leave
              </button>
            </>
          ) : (
            <button
              onClick={() => user ? setShowJoinModal(true) : navigate('/')}
              style={{
                flex: 1,
                padding: '14px 16px',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <UserPlus size={18} />
              {user ? 'Join This Group' : 'Sign In to Join'}
            </button>
          )}
        </div>

        {/* Currently Fasting Section */}
        {fastingMembers.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#333',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Timer size={18} color="#22c55e" />
              Currently Fasting
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {fastingMembers.map(member => {
                const fast = member.current_fast!;
                const duration = formatDuration(fast, now);
                const totalHours = duration.hours + duration.minutes / 60;
                const milestone = getMilestoneForHours(totalHours);

                return (
                  <div
                    key={member.id}
                    style={{
                      background: '#fff',
                      borderRadius: 16,
                      padding: 20,
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
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
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#333' }}>
                          {member.display_name}
                        </div>
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
                      fontSize: 'clamp(28px, 8vw, 36px)',
                      fontWeight: 800,
                      color: milestone.color,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {duration.hours}:{duration.minutes.toString().padStart(2, '0')}:{duration.seconds.toString().padStart(2, '0')}
                    </div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                      Started {format(new Date(fast.start_time), 'h:mm a')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Not Currently Fasting Section */}
        {notFastingMembers.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#333',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Users size={18} color="#666" />
              Group Members
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notFastingMembers.map(member => {
                const lastFast = member.recent_fasts?.[0];
                return (
                  <div
                    key={member.id}
                    style={{
                      background: '#fff',
                      borderRadius: 12,
                      padding: 16,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>
                        {member.display_name}
                      </div>
                      <div style={{
                        padding: '4px 10px',
                        background: '#f5f5f5',
                        borderRadius: 8,
                        fontSize: 12,
                        color: '#888',
                      }}>
                        Not fasting
                      </div>
                    </div>
                    {lastFast && (
                      <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
                        Last fast: {formatDuration(lastFast, new Date(lastFast.end_time!).getTime()).hours}h {formatDuration(lastFast, new Date(lastFast.end_time!).getTime()).minutes}m
                        {lastFast.completed && (
                          <span style={{ color: '#22c55e', marginLeft: 4 }}>
                            <Trophy size={12} style={{ verticalAlign: 'middle' }} /> Completed
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA for non-members or to start fasting */}
        {!isMember && (
          <div style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            borderRadius: 24,
            padding: 28,
            textAlign: 'center',
            color: 'white',
            marginBottom: 16,
          }}>
            <div style={{
              width: 56,
              height: 56,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Flame size={28} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px 0' }}>
              Join the Challenge!
            </h2>
            <p style={{ fontSize: 14, opacity: 0.9, margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Fast together with {group.name}. See each other's progress in real-time and keep each other accountable.
            </p>
            <button
              onClick={() => user ? setShowJoinModal(true) : navigate('/')}
              style={{
                width: '100%',
                padding: '14px 28px',
                background: 'white',
                color: '#7c3aed',
                border: 'none',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <UserPlus size={18} />
              {user ? 'Join This Group' : 'Sign Up to Join'}
            </button>
          </div>
        )}

        {/* Start Fast CTA for members */}
        {isMember && !currentUserMember?.current_fast && (
          <div style={{
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            borderRadius: 20,
            padding: 24,
            textAlign: 'center',
            color: 'white',
            marginBottom: 16,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>
              Ready to fast with your group?
            </h3>
            <p style={{ fontSize: 14, opacity: 0.9, margin: '0 0 16px 0' }}>
              Start your fast and let your group see your progress!
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '12px 24px',
                background: 'white',
                color: '#16a34a',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                margin: '0 auto',
              }}
            >
              <Flame size={18} /> Start Fasting
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: 24,
          color: '#888',
          fontSize: 13,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}>
            <Flame size={14} color="#22c55e" />
            <span style={{ fontWeight: 600, color: '#22c55e' }}>Fast!</span>
            <span>- Track your fasting journey</span>
          </div>
        </div>
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          zIndex: 100,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 24,
            padding: 28,
            maxWidth: 400,
            width: '100%',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                Join {group.name}
              </h2>
              <button
                onClick={() => setShowJoinModal(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: '#f5f5f5',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} color="#666" />
              </button>
            </div>

            <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>
              Enter your name to join this fasting group. Other members will see your fasting progress.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{
                fontSize: 12,
                color: 'rgba(0,0,0,0.5)',
                marginBottom: 8,
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
              }}>
                Your Name
              </label>
              <input
                type="text"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Enter your name"
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
              onClick={handleJoinGroup}
              disabled={!joinName.trim() || joining}
              style={{
                width: '100%',
                padding: '16px',
                background: joinName.trim() && !joining
                  ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                  : '#e5e5e5',
                color: joinName.trim() && !joining ? '#fff' : '#999',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                cursor: joinName.trim() && !joining ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {joining ? 'Joining...' : (
                <>
                  <UserPlus size={18} /> Join Group
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
