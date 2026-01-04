import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, RotateCcw, CheckCircle2, PenLine, Flame, Brain, Zap,
  Heart, Sparkles, Clock, History,
  LogOut, CreditCard, TrendingUp, Award, Target
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import {
  getCurrentFast, startFast, endFast, getFastingHistory,
  getFastingNotes, addFastingNote, canStartFast, updateUserProfile,
  signOut, type FastingSession, type FastingNote
} from '../lib/supabase';
import { redirectToCheckout, PRICE_IDS, createPortalSession } from '../lib/stripe';

// Fasting milestones
const FASTING_MILESTONES = [
  { hour: 0, title: 'Fast Begins', shortDesc: 'Blood sugar from last meal', icon: 'clock', color: '#6b7280' },
  { hour: 4, title: 'Fat Burning', shortDesc: 'Glycogen depleting', icon: 'flame', color: '#f97316' },
  { hour: 8, title: 'Ketosis', shortDesc: 'Liver producing ketones', icon: 'flame', color: '#ef4444' },
  { hour: 12, title: 'Deep Ketosis', shortDesc: 'Brain using ketones', icon: 'brain', color: '#3b82f6' },
  { hour: 14, title: 'Autophagy', shortDesc: 'Cellular cleanup begins', icon: 'sparkles', color: '#10b981' },
  { hour: 16, title: 'Deep Autophagy', shortDesc: 'Cellular renewal', icon: 'sparkles', color: '#14b8a6' },
  { hour: 18, title: 'Peak Fat Burn', shortDesc: 'Maximum efficiency', icon: 'flame', color: '#f43f5e' },
  { hour: 24, title: 'Complete!', shortDesc: 'Full benefits achieved', icon: 'check', color: '#22c55e' },
];

const MOODS = [
  { value: 'great', label: 'Great', emoji: '😊', color: '#22c55e' },
  { value: 'good', label: 'Good', emoji: '🙂', color: '#84cc16' },
  { value: 'okay', label: 'Okay', emoji: '😐', color: '#eab308' },
  { value: 'tough', label: 'Tough', emoji: '😕', color: '#f97316' },
  { value: 'difficult', label: 'Hard', emoji: '😣', color: '#ef4444' },
] as const;

const FAST_DURATION = 24 * 60 * 60 * 1000;

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

export function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const [currentFast, setCurrentFast] = useState<FastingSession | null>(null);
  const [notes, setNotes] = useState<FastingNote[]>([]);
  const [pastFasts, setPastFasts] = useState<FastingSession[]>([]);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [showDiary, setShowDiary] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Diary form
  const [diaryNote, setDiaryNote] = useState('');
  const [diaryMood, setDiaryMood] = useState<FastingNote['mood']>('okay');
  const [diaryEnergy, setDiaryEnergy] = useState(3);
  const [diaryHunger, setDiaryHunger] = useState(3);
  const [savingNote, setSavingNote] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      const [fast, history] = await Promise.all([
        getCurrentFast(user.id),
        getFastingHistory(user.id),
      ]);

      setCurrentFast(fast);
      setPastFasts(history);
      setLoading(false);

      if (fast?.id) {
        const fastNotes = await getFastingNotes(fast.id);
        setNotes(fastNotes);
      }
    };

    loadData();
  }, [user]);

  // Update timer
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStartFast = useCallback(async () => {
    if (!user || !profile) return;

    // Check if user can start
    const allowed = await canStartFast(profile);
    if (!allowed) {
      setShowUpgrade(true);
      return;
    }

    const fast = await startFast(user.id, 24);
    setCurrentFast(fast);
    setShowDiary(false);
    setShowHistory(false);
  }, [user, profile]);

  const handleEndFast = useCallback(async () => {
    if (!currentFast?.id || !user || !profile) return;

    const fastStartTime = new Date(currentFast.start_time).getTime();
    const elapsed = Date.now() - fastStartTime;
    const completed = elapsed >= FAST_DURATION;

    await endFast(currentFast.id, completed);
    setCurrentFast(null);

    // Update fasts completed count
    if (completed) {
      await updateUserProfile(user.id, {
        fasts_completed: (profile.fasts_completed || 0) + 1,
      });
      await refreshProfile();
    }

    // Refresh history
    const history = await getFastingHistory(user.id);
    setPastFasts(history);
  }, [currentFast, user, profile, refreshProfile]);

  const handleAddNote = useCallback(async () => {
    if (!currentFast?.id || !diaryNote.trim()) return;

    setSavingNote(true);
    const fastStartTime = new Date(currentFast.start_time).getTime();
    const elapsedHours = Math.floor((Date.now() - fastStartTime) / (1000 * 60 * 60));

    await addFastingNote({
      fasting_id: currentFast.id,
      hour_mark: elapsedHours,
      mood: diaryMood,
      energy_level: diaryEnergy,
      hunger_level: diaryHunger,
      note: diaryNote.trim(),
    });

    setDiaryNote('');
    setSavingNote(false);

    const updatedNotes = await getFastingNotes(currentFast.id);
    setNotes(updatedNotes);
  }, [currentFast, diaryNote, diaryMood, diaryEnergy, diaryHunger]);

  const handleUpgrade = async (plan: 'monthly' | 'yearly') => {
    if (!user || !profile) return;

    const priceId = plan === 'monthly' ? PRICE_IDS.monthly : PRICE_IDS.yearly;
    await redirectToCheckout(priceId, user.id, profile.email);
  };

  const handleManageSubscription = async () => {
    if (!profile?.stripe_customer_id) return;
    const url = await createPortalSession(profile.stripe_customer_id);
    window.location.href = url;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Calculate times
  const fastStartTime = currentFast ? new Date(currentFast.start_time).getTime() : null;
  const elapsedMs = fastStartTime ? now - fastStartTime : 0;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const remainingMs = fastStartTime ? Math.max(0, FAST_DURATION - elapsedMs) : FAST_DURATION;
  const isComplete = fastStartTime && elapsedMs >= FAST_DURATION;
  const progress = fastStartTime ? Math.min(100, (elapsedMs / FAST_DURATION) * 100) : 0;

  const currentMilestone = FASTING_MILESTONES.filter(m => m.hour <= elapsedHours).pop() || FASTING_MILESTONES[0];
  const nextMilestone = FASTING_MILESTONES.find(m => m.hour > elapsedHours);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Stats
  const totalFasts = pastFasts.length + (currentFast ? 1 : 0);
  const completedFasts = pastFasts.filter(f => f.completed).length;
  const completionRate = totalFasts > 0 ? Math.round((completedFasts / totalFasts) * 100) : 0;
  const totalHours = pastFasts.reduce((sum, f) => {
    if (!f.end_time) return sum;
    return sum + (new Date(f.end_time).getTime() - new Date(f.start_time).getTime()) / (1000 * 60 * 60);
  }, 0);

  if (loading || !profile) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#fafafa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px',
        background: '#fff',
        borderBottom: '1px solid #e5e5e5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Flame size={28} color="#22c55e" />
          <span style={{ fontSize: 20, fontWeight: 700 }}>Fast!</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {profile.subscription_status === 'active' ? (
            <button
              onClick={handleManageSubscription}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: 'rgba(34, 197, 94, 0.1)',
                color: '#16a34a',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <CreditCard size={16} /> Pro
            </button>
          ) : (
            <button
              onClick={() => setShowUpgrade(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Upgrade
            </button>
          )}

          <button
            onClick={handleSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              background: 'transparent',
              color: '#666',
              border: '1px solid #e5e5e5',
              borderRadius: 8,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Stats Row */}
      <div style={{
        padding: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 16,
        maxWidth: 800,
        margin: '0 auto',
      }}>
        <div style={{
          background: '#fff',
          padding: 20,
          borderRadius: 12,
          textAlign: 'center',
        }}>
          <Target size={24} color="#3b82f6" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 700 }}>{totalFasts}</div>
          <div style={{ fontSize: 12, color: '#666' }}>Total Fasts</div>
        </div>
        <div style={{
          background: '#fff',
          padding: 20,
          borderRadius: 12,
          textAlign: 'center',
        }}>
          <Award size={24} color="#22c55e" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 700 }}>{completedFasts}</div>
          <div style={{ fontSize: 12, color: '#666' }}>Completed</div>
        </div>
        <div style={{
          background: '#fff',
          padding: 20,
          borderRadius: 12,
          textAlign: 'center',
        }}>
          <TrendingUp size={24} color="#8b5cf6" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 700 }}>{completionRate}%</div>
          <div style={{ fontSize: 12, color: '#666' }}>Success Rate</div>
        </div>
        <div style={{
          background: '#fff',
          padding: 20,
          borderRadius: 12,
          textAlign: 'center',
        }}>
          <Clock size={24} color="#f97316" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 700 }}>{Math.round(totalHours)}h</div>
          <div style={{ fontSize: 12, color: '#666' }}>Total Fasted</div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '0 24px 24px', maxWidth: 600, margin: '0 auto' }}>
        {/* Current Fast or Start Button */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 32,
          textAlign: 'center',
          marginBottom: 24,
        }}>
          <h1 style={{
            fontSize: 'clamp(48px, 12vw, 80px)',
            fontWeight: 800,
            margin: '0 0 16px',
            color: isComplete ? '#22c55e' : '#1a1a1a',
          }}>
            Fast!
          </h1>

          {currentFast ? (
            <>
              {/* Current milestone */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 24,
                color: currentMilestone.color,
              }}>
                <MilestoneIcon icon={currentMilestone.icon} size={24} />
                <span style={{ fontSize: 20, fontWeight: 600 }}>{currentMilestone.title}</span>
              </div>

              {/* Timer */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 40,
                marginBottom: 24,
              }}>
                <div>
                  <div style={{
                    fontSize: 'clamp(28px, 6vw, 40px)',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: '#16a34a',
                  }}>
                    {formatTime(elapsedMs)}
                  </div>
                  <div style={{ fontSize: 12, color: '#999', textTransform: 'uppercase' }}>Fasted</div>
                </div>
                <div>
                  <div style={{
                    fontSize: 'clamp(28px, 6vw, 40px)',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: isComplete ? '#16a34a' : '#dc2626',
                  }}>
                    {isComplete ? '00:00:00' : formatTime(remainingMs)}
                  </div>
                  <div style={{ fontSize: 12, color: '#999', textTransform: 'uppercase' }}>
                    {isComplete ? 'Complete!' : 'Remaining'}
                  </div>
                </div>
              </div>

              {/* End time */}
              {fastStartTime && (
                <div style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
                  {isComplete ? 'Completed at' : 'Ends at'}{' '}
                  <strong>{format(new Date(fastStartTime + FAST_DURATION), 'h:mm a')}</strong>
                </div>
              )}

              {/* Progress bar */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: currentMilestone.color, marginBottom: 8 }}>
                  {Math.round(progress)}% Complete
                </div>
                <div style={{
                  height: 8,
                  background: '#e5e5e5',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: isComplete ? '#22c55e' : currentMilestone.color,
                    transition: 'width 1s linear',
                  }} />
                </div>
              </div>

              {/* Next milestone */}
              {nextMilestone && !isComplete && (
                <div style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
                  Next: <span style={{ color: nextMilestone.color, fontWeight: 600 }}>{nextMilestone.title}</span>{' '}
                  in {Math.ceil(nextMilestone.hour - elapsedHours)}h
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowDiary(!showDiary)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 20px',
                    background: showDiary ? 'rgba(139, 92, 246, 0.1)' : '#f5f5f5',
                    color: showDiary ? '#7c3aed' : '#333',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <PenLine size={18} /> Journal
                </button>

                <button
                  onClick={() => setShowHistory(!showHistory)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 20px',
                    background: showHistory ? 'rgba(0,0,0,0.06)' : '#f5f5f5',
                    color: '#333',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <History size={18} /> History
                </button>

                <button
                  onClick={handleEndFast}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 20px',
                    background: isComplete ? 'linear-gradient(135deg, #22c55e, #16a34a)' : '#fff',
                    color: isComplete ? '#fff' : '#dc2626',
                    border: isComplete ? 'none' : '1px solid rgba(220, 38, 38, 0.3)',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isComplete ? <CheckCircle2 size={18} /> : <RotateCcw size={18} />}
                  {isComplete ? 'Complete!' : 'End Fast'}
                </button>
              </div>
            </>
          ) : (
            <>
              <p style={{ color: '#666', marginBottom: 24 }}>
                Ready to start your fasting journey?
              </p>
              <button
                onClick={handleStartFast}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '16px 32px',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 18,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 24px rgba(34, 197, 94, 0.3)',
                }}
              >
                <Play size={22} /> Start 24h Fast
              </button>
            </>
          )}
        </div>

        {/* Diary Panel */}
        {showDiary && currentFast && (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>
              How are you feeling? <span style={{ fontWeight: 400, color: '#999' }}>Hour {Math.floor(elapsedHours)}</span>
            </h3>

            {/* Mood */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>Mood</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {MOODS.map(mood => (
                  <button
                    key={mood.value}
                    onClick={() => setDiaryMood(mood.value)}
                    style={{
                      padding: '8px 16px',
                      background: diaryMood === mood.value ? mood.color : '#f5f5f5',
                      color: diaryMood === mood.value ? '#fff' : '#333',
                      border: 'none',
                      borderRadius: 20,
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    {mood.emoji} {mood.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Energy & Hunger */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>Energy: {diaryEnergy}/5</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      onClick={() => setDiaryEnergy(n)}
                      style={{
                        width: 36,
                        height: 36,
                        background: n <= diaryEnergy ? '#eab308' : '#f0f0f0',
                        border: 'none',
                        borderRadius: 8,
                        color: n <= diaryEnergy ? '#fff' : '#999',
                        cursor: 'pointer',
                      }}
                    >
                      <Zap size={16} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>Hunger: {diaryHunger}/5</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      onClick={() => setDiaryHunger(n)}
                      style={{
                        width: 36,
                        height: 36,
                        background: n <= diaryHunger ? '#ef4444' : '#f0f0f0',
                        border: 'none',
                        borderRadius: 8,
                        color: n <= diaryHunger ? '#fff' : '#999',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Note */}
            <textarea
              value={diaryNote}
              onChange={(e) => setDiaryNote(e.target.value)}
              placeholder="How are you feeling?"
              style={{
                width: '100%',
                minHeight: 80,
                padding: 14,
                background: '#f8f8f8',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                marginBottom: 16,
                resize: 'vertical',
              }}
            />

            <button
              onClick={handleAddNote}
              disabled={!diaryNote.trim() || savingNote}
              style={{
                padding: '12px 24px',
                background: diaryNote.trim() ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : '#e5e5e5',
                color: diaryNote.trim() ? '#fff' : '#999',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: diaryNote.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              {savingNote ? 'Saving...' : 'Save Entry'}
            </button>

            {/* Previous notes */}
            {notes.length > 0 && (
              <div style={{ marginTop: 24, borderTop: '1px solid #e5e5e5', paddingTop: 16 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#666' }}>Your journal ({notes.length})</h4>
                {notes.map((note, i) => {
                  const mood = MOODS.find(m => m.value === note.mood);
                  return (
                    <div key={note.id || i} style={{
                      padding: 12,
                      background: '#f8f8f8',
                      borderRadius: 8,
                      marginBottom: 8,
                      borderLeft: `3px solid ${mood?.color || '#999'}`,
                    }}>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
                        Hour {note.hour_mark} • {mood?.emoji} {mood?.label}
                      </div>
                      <div style={{ fontSize: 14 }}>{note.note}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* History Panel */}
        {showHistory && (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>Past Fasts</h3>
            {pastFasts.length === 0 ? (
              <p style={{ color: '#999' }}>No completed fasts yet</p>
            ) : (
              pastFasts.map((fast) => {
                const start = new Date(fast.start_time);
                const end = fast.end_time ? new Date(fast.end_time) : null;
                const duration = end ? (end.getTime() - start.getTime()) / (1000 * 60 * 60) : 0;
                return (
                  <div key={fast.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    background: '#f8f8f8',
                    borderRadius: 8,
                    marginBottom: 8,
                    borderLeft: `3px solid ${fast.completed ? '#22c55e' : '#ef4444'}`,
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: fast.completed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: fast.completed ? '#22c55e' : '#ef4444',
                    }}>
                      {fast.completed ? <CheckCircle2 size={20} /> : <RotateCcw size={20} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{format(start, 'MMM d, yyyy')}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>{duration.toFixed(1)}h fasted</div>
                    </div>
                    <div style={{
                      padding: '4px 10px',
                      borderRadius: 12,
                      background: fast.completed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: fast.completed ? '#16a34a' : '#dc2626',
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {fast.completed ? 'Completed' : 'Ended Early'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          zIndex: 100,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 32,
            maxWidth: 400,
            width: '100%',
          }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700 }}>Unlock Unlimited Fasting</h2>
            <p style={{ color: '#666', marginBottom: 24 }}>
              You've completed your free trial fast! Upgrade to continue your fasting journey.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <button
                onClick={() => handleUpgrade('monthly')}
                style={{
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                $2.99/month - Cancel anytime
              </button>
              <button
                onClick={() => handleUpgrade('yearly')}
                style={{
                  padding: '16px 24px',
                  background: '#1a1a1a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                $19/year - Save 47%
              </button>
            </div>

            <button
              onClick={() => setShowUpgrade(false)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#999',
                border: '1px solid #e5e5e5',
                borderRadius: 10,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
