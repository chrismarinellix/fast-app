import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Flame, Clock, CheckCircle2, Trophy, Zap, Brain,
  Heart, Sparkles, Share2, Timer, ArrowRight, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import {
  getSharedFast, getSharedFastNotes,
  type SharedFastData, type SharedFastNote
} from '../lib/supabase';

// Fasting milestones (simplified for share view)
const FASTING_MILESTONES = [
  { hour: 0, title: 'Fast Begins', color: '#6b7280', icon: 'clock' },
  { hour: 4, title: 'Blood Sugar Stable', color: '#eab308', icon: 'zap' },
  { hour: 6, title: 'Fat Burning Activates', color: '#f97316', icon: 'flame' },
  { hour: 8, title: 'Entering Ketosis', color: '#ef4444', icon: 'flame' },
  { hour: 10, title: 'Growth Hormone Surge', color: '#8b5cf6', icon: 'zap' },
  { hour: 12, title: 'Deep Ketosis', color: '#3b82f6', icon: 'brain' },
  { hour: 14, title: 'Autophagy Initiates', color: '#10b981', icon: 'sparkles' },
  { hour: 16, title: 'Autophagy Active', color: '#14b8a6', icon: 'sparkles' },
  { hour: 18, title: 'Peak Fat Burning', color: '#f43f5e', icon: 'flame' },
  { hour: 20, title: 'Inflammation Reducing', color: '#ec4899', icon: 'heart' },
  { hour: 22, title: 'Cellular Renewal', color: '#a855f7', icon: 'sparkles' },
  { hour: 24, title: 'Fast Complete!', color: '#22c55e', icon: 'check' },
];

const MOODS: Record<string, { label: string; emoji: string; color: string }> = {
  great: { label: 'Great', emoji: '😊', color: '#22c55e' },
  good: { label: 'Good', emoji: '🙂', color: '#84cc16' },
  okay: { label: 'Okay', emoji: '😐', color: '#eab308' },
  tough: { label: 'Tough', emoji: '😕', color: '#f97316' },
  difficult: { label: 'Hard', emoji: '😣', color: '#ef4444' },
};

function MilestoneIcon({ icon, size = 20 }: { icon: string; size?: number }) {
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

export function ShareView() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [sharedFast, setSharedFast] = useState<SharedFastData | null>(null);
  const [notes, setNotes] = useState<SharedFastNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Update timer every second for ongoing fasts
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadSharedFast = async () => {
      if (!token) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const fastData = await getSharedFast(token);
        if (!fastData) {
          setError('This fast is no longer available');
          setLoading(false);
          return;
        }

        setSharedFast(fastData);

        // Load notes if they're included in the share
        if (fastData.include_notes && token) {
          const notesData = await getSharedFastNotes(token, fastData.fasting_id);
          setNotes(notesData);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading shared fast:', err);
        setError('Failed to load shared fast');
        setLoading(false);
      }
    };

    loadSharedFast();
  }, [token]);

  // Calculate fast duration and milestone (uses `now` for real-time updates)
  const calculateFastDetails = () => {
    if (!sharedFast) return { hours: 0, minutes: 0, seconds: 0, milestone: FASTING_MILESTONES[0] };

    const startTime = new Date(sharedFast.start_time).getTime();
    const endTime = sharedFast.end_time
      ? new Date(sharedFast.end_time).getTime()
      : now;

    const durationMs = endTime - startTime;
    const totalHours = durationMs / (1000 * 60 * 60);
    const hours = Math.floor(totalHours);
    const minutes = Math.floor((totalHours - hours) * 60);
    const seconds = Math.floor((totalHours * 3600 - hours * 3600 - minutes * 60));

    const milestone = FASTING_MILESTONES.filter(m => m.hour <= totalHours).pop() || FASTING_MILESTONES[0];

    return { hours, minutes, seconds, totalHours, milestone };
  };

  const { hours, minutes, seconds, milestone } = calculateFastDetails();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}>
        <Flame size={48} color="#22c55e" />
        <div style={{ fontSize: 24, fontWeight: 700, color: '#166534' }}>Loading...</div>
      </div>
    );
  }

  if (error || !sharedFast) {
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
          {error || 'Fast not found'}
        </div>
        <p style={{ color: '#666', maxWidth: 400 }}>
          This share link may have expired or been removed.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: 16,
            padding: '12px 24px',
            background: '#22c55e',
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
          Start Your Own Fast <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  const sharerName = sharedFast.sharer_name || 'Someone';
  const isCompleted = sharedFast.completed;
  const isOngoing = !sharedFast.end_time;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      padding: 'calc(24px + env(safe-area-inset-top, 0px)) calc(16px + env(safe-area-inset-right, 0px)) calc(24px + env(safe-area-inset-bottom, 0px)) calc(16px + env(safe-area-inset-left, 0px))',
    }}>
      <div style={{
        maxWidth: 500,
        margin: '0 auto',
      }}>
        {/* Back/Home Button */}
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 16px',
            background: '#fff',
            border: '1px solid #e5e5e5',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            color: '#166534',
            cursor: 'pointer',
            marginBottom: 20,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}
        >
          <Flame size={16} color="#22c55e" />
          Try Fast!
        </button>

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: 32,
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: 'rgba(34, 197, 94, 0.15)',
            borderRadius: 20,
            marginBottom: 16,
          }}>
            <Share2 size={16} color="#22c55e" />
            <span style={{ color: '#166534', fontWeight: 500, fontSize: 14 }}>
              Shared Fast
            </span>
          </div>
          <h1 style={{
            fontSize: 'clamp(24px, 6vw, 32px)',
            fontWeight: 800,
            color: '#166534',
            margin: 0,
            lineHeight: 1.2,
          }}>
            {sharerName} {isOngoing ? 'is fasting!' : isCompleted ? 'completed a fast!' : 'attempted a fast'}
          </h1>
        </div>

        {/* Main Achievement Card */}
        <div style={{
          background: 'white',
          borderRadius: 24,
          padding: 32,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          marginBottom: 24,
          textAlign: 'center',
        }}>
          {/* Duration Display */}
          <div style={{
            marginBottom: 24,
          }}>
            <div style={{
              fontSize: isOngoing ? 'clamp(40px, 10vw, 60px)' : 'clamp(48px, 12vw, 72px)',
              fontWeight: 800,
              color: milestone?.color || '#22c55e',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {hours}:{minutes.toString().padStart(2, '0')}{isOngoing && `:${seconds.toString().padStart(2, '0')}`}
            </div>
            <div style={{
              fontSize: 14,
              color: '#666',
              marginTop: 4,
            }}>
              {isOngoing ? 'hours : minutes : seconds' : 'hours : minutes'}
            </div>
            {isOngoing && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 12,
                padding: '6px 12px',
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: 20,
                fontSize: 12,
                color: '#16a34a',
                fontWeight: 600,
              }}>
                <RefreshCw size={12} style={{ animation: 'spin 2s linear infinite' }} />
                Live updating
              </div>
            )}
          </div>

          {/* Milestone Reached */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 20px',
            background: `${milestone?.color}15`,
            borderRadius: 16,
            marginBottom: 24,
          }}>
            <div style={{ color: milestone?.color }}>
              <MilestoneIcon icon={milestone?.icon || 'clock'} size={24} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontSize: 12,
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Milestone Reached
              </div>
              <div style={{
                fontSize: 18,
                fontWeight: 700,
                color: milestone?.color,
              }}>
                {milestone?.title}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}>
            {isOngoing ? (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: '#fef3c7',
                borderRadius: 20,
                color: '#92400e',
                fontSize: 14,
                fontWeight: 600,
              }}>
                <Timer size={16} />
                Currently Fasting
              </div>
            ) : isCompleted ? (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: '#dcfce7',
                borderRadius: 20,
                color: '#166534',
                fontSize: 14,
                fontWeight: 600,
              }}>
                <Trophy size={16} />
                Completed Successfully!
              </div>
            ) : (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: '#f3f4f6',
                borderRadius: 20,
                color: '#4b5563',
                fontSize: 14,
                fontWeight: 600,
              }}>
                <CheckCircle2 size={16} />
                Fast Ended
              </div>
            )}
          </div>

          {/* Dates */}
          <div style={{
            marginTop: 24,
            padding: '16px',
            background: '#f9fafb',
            borderRadius: 12,
            fontSize: 13,
            color: '#666',
          }}>
            <div style={{ marginBottom: 4 }}>
              <strong>Started:</strong> {format(new Date(sharedFast.start_time), 'MMM d, yyyy h:mm a')}
            </div>
            {sharedFast.end_time && (
              <div>
                <strong>Ended:</strong> {format(new Date(sharedFast.end_time), 'MMM d, yyyy h:mm a')}
              </div>
            )}
          </div>
        </div>

        {/* Journal Entries (if included) */}
        {notes.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: 24,
            padding: 24,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            marginBottom: 24,
          }}>
            <h2 style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#333',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ fontSize: 20 }}>📝</span> Journey Notes
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {notes.map((note, idx) => {
                const mood = MOODS[note.mood] || MOODS.okay;
                return (
                  <div
                    key={idx}
                    style={{
                      padding: 16,
                      background: '#f9fafb',
                      borderRadius: 12,
                      borderLeft: `4px solid ${mood.color}`,
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#666',
                      }}>
                        Hour {note.hour_mark}
                      </span>
                      <span style={{ fontSize: 20 }}>{mood.emoji}</span>
                    </div>
                    {note.note && (
                      <p style={{
                        margin: 0,
                        fontSize: 14,
                        color: '#333',
                        lineHeight: 1.5,
                      }}>
                        {note.note}
                      </p>
                    )}
                    <div style={{
                      display: 'flex',
                      gap: 12,
                      marginTop: 8,
                      fontSize: 12,
                      color: '#888',
                    }}>
                      <span>Energy: {'⚡'.repeat(note.energy_level)}</span>
                      <span>Hunger: {'🍽️'.repeat(note.hunger_level)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA - Share Back */}
        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          borderRadius: 24,
          padding: 28,
          textAlign: 'center',
          color: 'white',
          marginBottom: 16,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
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
            }}>
              <Share2 size={28} />
            </div>
          </div>
          <h2 style={{
            fontSize: 22,
            fontWeight: 800,
            margin: '0 0 8px 0',
          }}>
            Share your fast back!
          </h2>
          <p style={{
            fontSize: 14,
            opacity: 0.9,
            margin: '0 0 20px 0',
            lineHeight: 1.5,
          }}>
            {isOngoing
              ? `Let ${sharerName} see your progress too. Start fasting together and keep each other accountable!`
              : `Start your own fast and share it with ${sharerName}. Fasting buddies achieve more together!`
            }
          </p>
          <button
            onClick={() => navigate('/')}
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
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Flame size={18} /> Start & Share Your Fast
          </button>
        </div>

        {/* Not fasting yet message */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 20,
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
        }}>
          <p style={{
            margin: 0,
            fontSize: 14,
            color: '#666',
            lineHeight: 1.5,
          }}>
            <strong style={{ color: '#333' }}>Not fasting yet?</strong> No worries!
            You can still cheer {sharerName} on and start your own fast whenever you're ready.
          </p>
        </div>

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
          {(sharedFast.view_count ?? 0) > 1 && (
            <div style={{ marginTop: 8, fontSize: 12 }}>
              Viewed {sharedFast.view_count ?? 0} times
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
