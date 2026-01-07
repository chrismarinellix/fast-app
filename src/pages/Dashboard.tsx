import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, RotateCcw, CheckCircle2, PenLine, Flame, Brain, Zap,
  Heart, Sparkles, Clock, History,
  LogOut, TrendingUp, Award, Target, Plus, Timer, Share2, Copy, Check, X
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import {
  getCurrentFast, startFast, endFast, getFastingHistory,
  getFastingNotes, addFastingNote, canStartFast, updateUserProfile,
  signOut, extendFast, createFastShare, getFastShare,
  type FastingSession, type FastingNote, type FastShare
} from '../lib/supabase';
import { redirectToCheckout, FAST_PRICE_ID } from '../lib/stripe';

// Free hours before payment required
const FREE_HOURS = 10;

// Comprehensive fasting milestones with rich detail
const FASTING_MILESTONES = [
  {
    hour: 0,
    title: 'Fast Begins',
    shortDesc: 'Blood sugar rising from last meal',
    detail: 'Your body is using glucose from your last meal. Insulin levels are elevated to help cells absorb blood sugar.',
    icon: 'clock',
    color: '#6b7280',
    benefits: ['Digestion active', 'Insulin working']
  },
  {
    hour: 2,
    title: 'Digestion Winding Down',
    shortDesc: 'Stomach emptying, insulin dropping',
    detail: 'Food has moved to the small intestine. Your body is still processing nutrients but insulin is starting to decrease.',
    icon: 'clock',
    color: '#6b7280',
    benefits: ['Nutrient absorption', 'Blood sugar normalizing']
  },
  {
    hour: 4,
    title: 'Blood Sugar Stable',
    shortDesc: 'Post-absorptive state beginning',
    detail: 'Your stomach is now empty. Blood sugar has returned to baseline. The body is transitioning to using stored energy.',
    icon: 'zap',
    color: '#eab308',
    benefits: ['Stable energy', 'Insulin low', 'Fat access begins']
  },
  {
    hour: 6,
    title: 'Fat Burning Activates',
    shortDesc: 'Glycogen stores depleting',
    detail: 'Liver glycogen (stored glucose) is being used up. Your body is increasingly turning to fat for energy. Glucagon rises.',
    icon: 'flame',
    color: '#f97316',
    benefits: ['Burning fat stores', 'Glucagon rising', 'Growth hormone increasing']
  },
  {
    hour: 8,
    title: 'Entering Ketosis',
    shortDesc: 'Liver producing ketones',
    detail: 'With glycogen depleted, your liver converts fatty acids into ketones. These become fuel for your brain and body.',
    icon: 'flame',
    color: '#ef4444',
    benefits: ['Ketone production', 'Mental clarity beginning', 'Steady energy']
  },
  {
    hour: 10,
    title: 'Growth Hormone Surge',
    shortDesc: 'HGH levels significantly elevated',
    detail: 'Human Growth Hormone can increase up to 5x. This protects muscle, promotes fat burning, and supports cellular repair.',
    icon: 'zap',
    color: '#8b5cf6',
    benefits: ['Muscle preservation', 'Enhanced fat burning', 'Anti-aging effects']
  },
  {
    hour: 12,
    title: 'Deep Ketosis',
    shortDesc: 'Brain using ketones for fuel',
    detail: 'Ketone levels are elevated. Your brain is efficiently using ketones, which may enhance focus and mental clarity.',
    icon: 'brain',
    color: '#3b82f6',
    benefits: ['Enhanced focus', 'Reduced inflammation', 'Stable mood']
  },
  {
    hour: 14,
    title: 'Autophagy Initiates',
    shortDesc: 'Cellular cleanup beginning',
    detail: 'Autophagy (self-eating) begins. Cells start breaking down damaged proteins and dysfunctional components for recycling.',
    icon: 'sparkles',
    color: '#10b981',
    benefits: ['Cellular cleanup', 'Damaged protein removal', 'Immune boost']
  },
  {
    hour: 16,
    title: 'Autophagy Active',
    shortDesc: 'Deep cellular renewal',
    detail: 'Autophagy is now significantly active. Old and damaged cellular components are being recycled and renewed.',
    icon: 'sparkles',
    color: '#14b8a6',
    benefits: ['Deep cellular repair', 'Mitochondria renewal', 'Longevity pathways active']
  },
  {
    hour: 18,
    title: 'Peak Fat Burning',
    shortDesc: 'Maximum metabolic efficiency',
    detail: 'Your body is highly efficient at burning fat. Insulin is very low, allowing maximum access to fat stores.',
    icon: 'flame',
    color: '#f43f5e',
    benefits: ['Maximum fat oxidation', 'Insulin sensitivity improving', 'Metabolic flexibility']
  },
  {
    hour: 20,
    title: 'Inflammation Reducing',
    shortDesc: 'Inflammatory markers dropping',
    detail: 'Pro-inflammatory markers are decreasing. This reduces oxidative stress and supports overall health.',
    icon: 'heart',
    color: '#ec4899',
    benefits: ['Lower inflammation', 'Reduced oxidative stress', 'Heart health benefits']
  },
  {
    hour: 22,
    title: 'Cellular Renewal',
    shortDesc: 'New cell growth stimulated',
    detail: 'With old components cleared, pathways for building new cellular structures are activated. BDNF increases in the brain.',
    icon: 'sparkles',
    color: '#a855f7',
    benefits: ['New cell growth', 'Brain plasticity (BDNF)', 'Stem cell activation']
  },
  {
    hour: 24,
    title: 'Fast Complete!',
    shortDesc: 'Maximum benefits achieved',
    detail: 'Congratulations! You\'ve completed a full 24-hour fast. Your body has undergone significant metabolic and cellular renewal.',
    icon: 'check',
    color: '#22c55e',
    benefits: ['Full autophagy cycle', 'Metabolic reset', 'Insulin sensitivity restored']
  },
];

const MOODS = [
  { value: 'great', label: 'Great', emoji: '😊', color: '#22c55e' },
  { value: 'good', label: 'Good', emoji: '🙂', color: '#84cc16' },
  { value: 'okay', label: 'Okay', emoji: '😐', color: '#eab308' },
  { value: 'tough', label: 'Tough', emoji: '😕', color: '#f97316' },
  { value: 'difficult', label: 'Hard', emoji: '😣', color: '#ef4444' },
] as const;

// Common fasting symptoms and feelings - organized by category
const FEELING_OPTIONS = {
  physical: {
    label: 'Physical',
    options: [
      { id: 'hungry', label: 'Hungry', emoji: '🍽️' },
      { id: 'headache', label: 'Headache', emoji: '🤕' },
      { id: 'dizzy', label: 'Dizzy', emoji: '💫' },
      { id: 'nauseous', label: 'Nauseous', emoji: '🤢' },
      { id: 'cold', label: 'Cold', emoji: '🥶' },
      { id: 'shaky', label: 'Shaky', emoji: '🫨' },
      { id: 'energetic', label: 'Energetic', emoji: '⚡' },
      { id: 'tired', label: 'Tired', emoji: '😴' },
      { id: 'strong', label: 'Strong', emoji: '💪' },
    ]
  },
  mental: {
    label: 'Mental',
    options: [
      { id: 'focused', label: 'Focused', emoji: '🎯' },
      { id: 'brain_fog', label: 'Brain fog', emoji: '🌫️' },
      { id: 'clear_minded', label: 'Clear minded', emoji: '💎' },
      { id: 'irritable', label: 'Irritable', emoji: '😤' },
      { id: 'calm', label: 'Calm', emoji: '😌' },
      { id: 'anxious', label: 'Anxious', emoji: '😰' },
      { id: 'motivated', label: 'Motivated', emoji: '🔥' },
      { id: 'productive', label: 'Productive', emoji: '📈' },
    ]
  },
  cravings: {
    label: 'Cravings',
    options: [
      { id: 'no_cravings', label: 'No cravings', emoji: '✅' },
      { id: 'sugar_craving', label: 'Sugar craving', emoji: '🍬' },
      { id: 'carb_craving', label: 'Carb craving', emoji: '🍞' },
      { id: 'salt_craving', label: 'Salt craving', emoji: '🧂' },
      { id: 'coffee_craving', label: 'Coffee craving', emoji: '☕' },
      { id: 'easy_ignore', label: 'Easy to ignore', emoji: '🙅' },
    ]
  },
  positive: {
    label: 'Positive Signs',
    options: [
      { id: 'feeling_light', label: 'Feeling light', emoji: '🪶' },
      { id: 'mental_clarity', label: 'Mental clarity', emoji: '🧠' },
      { id: 'proud', label: 'Proud of myself', emoji: '🏆' },
      { id: 'in_control', label: 'In control', emoji: '👑' },
      { id: 'accomplished', label: 'Accomplished', emoji: '✨' },
      { id: 'peaceful', label: 'Peaceful', emoji: '🕊️' },
    ]
  }
};

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
  const [hoveredMilestone, setHoveredMilestone] = useState<number | null>(null);
  const [showDiary, setShowDiary] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showExtend, setShowExtend] = useState(false);
  const [extendHours, setExtendHours] = useState(6);
  const [showCompletionSummary, setShowCompletionSummary] = useState(false);
  const [completedFastSummary, setCompletedFastSummary] = useState<{
    hours: number;
    minutes: number;
    milestone: typeof FASTING_MILESTONES[0];
    completed: boolean;
  } | null>(null);

  // Share modal state
  const [showShare, setShowShare] = useState(false);
  const [shareTargetFast, setShareTargetFast] = useState<FastingSession | null>(null);
  const [currentShare, setCurrentShare] = useState<FastShare | null>(null);
  const [shareIncludeNotes, setShareIncludeNotes] = useState(false);
  const [shareName, setShareName] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Diary form
  const [diaryNote, setDiaryNote] = useState('');
  const [diaryMood, setDiaryMood] = useState<FastingNote['mood']>('okay');
  const [diaryEnergy, setDiaryEnergy] = useState(3);
  const [diaryHunger, setDiaryHunger] = useState(3);
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([]);
  const [savingNote, setSavingNote] = useState(false);

  const toggleFeeling = (id: string) => {
    setSelectedFeelings(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Handle payment success - refresh profile to get updated paid_until
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true' || params.get('paid') === 'true') {
      // Refresh profile after successful payment
      refreshProfile();
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [refreshProfile]);

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
    if (!currentFast?.id || !user || !profile) {
      console.log('Cannot end fast - missing data:', { currentFast: !!currentFast, user: !!user, profile: !!profile });
      return;
    }

    const fastStartTime = new Date(currentFast.start_time).getTime();
    const elapsed = Date.now() - fastStartTime;
    const elapsedHours = elapsed / (1000 * 60 * 60);
    const completed = elapsed >= FAST_DURATION;

    // Calculate what milestone they reached
    const reachedMilestone = FASTING_MILESTONES.filter(m => m.hour <= elapsedHours).pop() || FASTING_MILESTONES[0];
    const hours = Math.floor(elapsedHours);
    const minutes = Math.floor((elapsedHours - hours) * 60);

    // Show completion summary
    setCompletedFastSummary({
      hours,
      minutes,
      milestone: reachedMilestone,
      completed,
    });
    setShowCompletionSummary(true);

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
    if (!currentFast?.id || (selectedFeelings.length === 0 && !diaryNote.trim())) return;

    setSavingNote(true);
    const fastStartTime = new Date(currentFast.start_time).getTime();
    const elapsedHours = Math.floor((Date.now() - fastStartTime) / (1000 * 60 * 60));

    // Build the note from selected feelings + optional text
    const feelingLabels = selectedFeelings.map(id => {
      for (const category of Object.values(FEELING_OPTIONS)) {
        const opt = category.options.find(o => o.id === id);
        if (opt) return `${opt.emoji} ${opt.label}`;
      }
      return id;
    });
    const feelingsText = feelingLabels.join(', ');
    const fullNote = diaryNote.trim()
      ? `${feelingsText}${feelingsText ? ' — ' : ''}${diaryNote.trim()}`
      : feelingsText;

    await addFastingNote({
      fasting_id: currentFast.id,
      hour_mark: elapsedHours,
      mood: diaryMood,
      energy_level: diaryEnergy,
      hunger_level: diaryHunger,
      note: fullNote,
    });

    setDiaryNote('');
    setSelectedFeelings([]);
    setSavingNote(false);

    const updatedNotes = await getFastingNotes(currentFast.id);
    setNotes(updatedNotes);
  }, [currentFast, diaryNote, diaryMood, diaryEnergy, diaryHunger, selectedFeelings]);

  const handlePayForFast = async () => {
    try {
      if (!user || !profile) {
        alert('Please sign in to continue.');
        return;
      }

      if (!FAST_PRICE_ID) {
        alert('Payment not configured. Price ID is missing.');
        return;
      }

      // Pass fastId if available (for marking fast as paid after payment)
      await redirectToCheckout(FAST_PRICE_ID, user.id, profile.email, currentFast?.id);
    } catch (error: any) {
      console.error('Payment error:', error);
      alert('Payment error: ' + (error.message || 'Unknown error'));
    }
  };

  const handleExtendFast = useCallback(async () => {
    if (!currentFast?.id) return;

    const updated = await extendFast(currentFast.id, extendHours);
    if (updated) {
      setCurrentFast(updated);
      setShowExtend(false);
    }
  }, [currentFast, extendHours]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Share handlers
  const handleOpenShare = async (fast: FastingSession) => {
    setShareTargetFast(fast);
    setShareLoading(true);
    setShowShare(true);
    setShareCopied(false);

    // Check if share already exists
    const existingShare = await getFastShare(fast.id);
    if (existingShare) {
      setCurrentShare(existingShare);
      setShareIncludeNotes(existingShare.include_notes);
      setShareName(existingShare.sharer_name || '');
    } else {
      setCurrentShare(null);
      setShareIncludeNotes(false);
      setShareName(profile?.name || '');
    }
    setShareLoading(false);
  };

  const handleCreateShare = async () => {
    if (!shareTargetFast || !user) return;
    setShareLoading(true);

    try {
      const share = await createFastShare(
        shareTargetFast.id,
        user.id,
        shareName || undefined,
        shareIncludeNotes
      );
      setCurrentShare(share);
    } catch (error) {
      console.error('Error creating share:', error);
      alert('Failed to create share link');
    }

    setShareLoading(false);
  };

  const handleCopyShareLink = async () => {
    if (!currentShare) return;
    const shareUrl = `${window.location.origin}/share/${currentShare.share_token}`;
    await navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  // Calculate times - use dynamic target hours
  const targetHours = currentFast?.target_hours || 24;
  const fastDuration = targetHours * 60 * 60 * 1000;
  const fastStartTime = currentFast ? new Date(currentFast.start_time).getTime() : null;
  const elapsedMs = fastStartTime ? now - fastStartTime : 0;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const remainingMs = fastStartTime ? Math.max(0, fastDuration - elapsedMs) : fastDuration;
  const isComplete = fastStartTime && elapsedMs >= fastDuration;
  const progress = fastStartTime ? Math.min(100, (elapsedMs / fastDuration) * 100) : 0;

  const currentMilestone = FASTING_MILESTONES.filter(m => m.hour <= elapsedHours).pop() || FASTING_MILESTONES[0];
  const nextMilestone = FASTING_MILESTONES.find(m => m.hour > elapsedHours);

  // Check if user has active paid access (paid_until in the future)
  const hasPaidAccess = profile?.paid_until && new Date(profile.paid_until) > new Date();

  // Check if payment is needed (past 10 hours and no paid access)
  const needsPayment = currentFast && elapsedHours >= FREE_HOURS && !hasPaidAccess;

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

  // Add loading timeout state
  const [loadingTooLong, setLoadingTooLong] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setLoadingTooLong(true), 5000);
      return () => clearTimeout(timer);
    } else {
      setLoadingTooLong(false);
    }
  }, [loading]);

  if (loading || !profile) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}>
        <Flame size={48} color="#22c55e" />
        <div style={{ fontSize: 24, fontWeight: 700 }}>Fast!</div>
        <div style={{ fontSize: 14, color: '#666' }}>
          {loading ? 'Loading...' : !user ? 'No user session' : 'Loading profile...'}
        </div>
        {loadingTooLong && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 13, color: '#999', marginBottom: 12 }}>
              Taking longer than expected...
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                background: '#fff',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: 8,
                cursor: 'pointer',
                marginRight: 8,
              }}
            >
              Refresh Page
            </button>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '10px 20px',
                background: '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Sign In Again
            </button>
          </div>
        )}
        {!loading && !user && (
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '8px 16px',
              background: '#22c55e',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Go to Sign In
          </button>
        )}
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
          {/* Show paid status if user has active access */}
          {hasPaidAccess && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: 'rgba(34, 197, 94, 0.1)',
                color: '#16a34a',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={16} /> Unlimited
            </div>
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

      {/* Main Content */}
      <div className="mobile-padding" style={{ padding: '0 24px 24px', maxWidth: 1000, margin: '0 auto' }}>
        {/* Hero section - centered Fast! with timer */}
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: '40px 32px',
          textAlign: 'center',
          marginBottom: 24,
        }}>
          {/* Big FAST! title */}
          <h1 style={{
            fontSize: 'clamp(80px, 18vw, 140px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: 0,
            marginBottom: currentFast ? '16px' : '24px',
            color: isComplete ? '#22c55e' : '#1a1a1a',
          }}>
            Fast!
          </h1>

          {currentFast ? (
            <>
              {/* Timer display - big and centered */}
              <div style={{
                display: 'flex',
                gap: 'clamp(24px, 6vw, 60px)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 'clamp(36px, 9vw, 56px)',
                    fontWeight: 700,
                    fontFamily: 'ui-monospace, monospace',
                    color: '#16a34a',
                    lineHeight: 1,
                  }}>
                    {formatTime(elapsedMs)}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: 'rgba(0,0,0,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginTop: 6,
                  }}>
                    Fasted
                  </div>
                </div>

                <div style={{ width: 2, height: 50, background: 'rgba(0,0,0,0.1)' }} />

                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 'clamp(36px, 9vw, 56px)',
                    fontWeight: 700,
                    fontFamily: 'ui-monospace, monospace',
                    color: isComplete ? '#16a34a' : '#dc2626',
                    lineHeight: 1,
                  }}>
                    {isComplete ? '00:00:00' : formatTime(remainingMs)}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: 'rgba(0,0,0,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginTop: 6,
                  }}>
                    {isComplete ? 'Complete!' : 'Remaining'}
                  </div>
                </div>
              </div>

              {/* Fast end time */}
              {fastStartTime && (
                <div style={{ fontSize: 18, color: 'rgba(0,0,0,0.6)', marginBottom: 24, fontWeight: 500 }}>
                  {isComplete ? (
                    <span>Completed at <strong style={{ color: '#16a34a' }}>{format(new Date(fastStartTime + fastDuration), 'h:mm a')}</strong></span>
                  ) : (
                    <span>
                      {targetHours}h fast • Ends at <strong style={{ color: '#1a1a1a', fontWeight: 700 }}>{format(new Date(fastStartTime + fastDuration), 'h:mm a')}</strong> ({format(new Date(fastStartTime + fastDuration), 'EEE')})
                    </span>
                  )}
                </div>
              )}

              {/* Progress bar with milestone dots */}
              <div style={{ marginBottom: 24, position: 'relative' }}>
                <div style={{
                  textAlign: 'center',
                  marginBottom: 12,
                  fontSize: 16,
                  fontWeight: 700,
                  color: isComplete ? '#16a34a' : currentMilestone.color,
                }}>
                  {Math.round(progress)}% Complete
                </div>

                <div style={{ position: 'relative', padding: '10px 0', margin: '0 10px' }}>
                  {/* Progress bar track */}
                  <div style={{
                    width: '100%',
                    height: 8,
                    background: 'rgba(0,0,0,0.1)',
                    borderRadius: 4,
                  }}>
                    <div style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: isComplete ? '#22c55e' : `linear-gradient(90deg, ${currentMilestone.color}, ${nextMilestone?.color || '#22c55e'})`,
                      borderRadius: 4,
                      transition: 'width 1s linear',
                    }} />
                  </div>

                  {/* Milestone dots with hover tooltips */}
                  {FASTING_MILESTONES.filter(m => m.hour > 0 && m.hour <= 24).map(m => {
                    const isPassed = elapsedHours >= m.hour;
                    const isCurrent = currentMilestone.hour === m.hour;
                    const isHovered = hoveredMilestone === m.hour;
                    return (
                      <div
                        key={m.hour}
                        onMouseEnter={() => setHoveredMilestone(m.hour)}
                        onMouseLeave={() => setHoveredMilestone(null)}
                        style={{
                          position: 'absolute',
                          left: `${(m.hour / 24) * 100}%`,
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          cursor: 'pointer',
                          zIndex: isHovered ? 100 : 10,
                        }}
                      >
                        <div style={{
                          width: isCurrent ? 22 : isHovered ? 18 : 14,
                          height: isCurrent ? 22 : isHovered ? 18 : 14,
                          borderRadius: '50%',
                          background: isPassed ? m.color : '#e5e5e5',
                          border: isCurrent ? '3px solid #fff' : '2px solid #fff',
                          boxShadow: isPassed ? `0 2px 8px ${m.color}50` : '0 1px 3px rgba(0,0,0,0.1)',
                          transition: 'all 0.2s',
                        }} />
                        {/* Tooltip */}
                        {isHovered && (
                          <div style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginBottom: 12,
                            padding: '14px 18px',
                            background: '#1a1a1a',
                            color: '#fff',
                            borderRadius: 12,
                            fontSize: 13,
                            width: 260,
                            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                            zIndex: 1000,
                          }}>
                            <div style={{
                              fontWeight: 700,
                              color: m.color,
                              marginBottom: 6,
                              fontSize: 12,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}>
                              Hour {m.hour} {isCurrent ? '• CURRENT' : isPassed ? '• ACHIEVED' : '• UPCOMING'}
                            </div>
                            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 16 }}>{m.title}</div>
                            <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.6, marginBottom: 10 }}>{m.detail}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {m.benefits.map(b => (
                                <span key={b} style={{
                                  fontSize: 11,
                                  padding: '3px 8px',
                                  background: `${m.color}30`,
                                  color: m.color,
                                  borderRadius: 10,
                                  fontWeight: 500,
                                }}>
                                  {b}
                                </span>
                              ))}
                            </div>
                            {/* Arrow */}
                            <div style={{
                              position: 'absolute',
                              bottom: -8,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: 0,
                              height: 0,
                              borderLeft: '8px solid transparent',
                              borderRight: '8px solid transparent',
                              borderTop: '8px solid #1a1a1a',
                            }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Hour markers */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 4,
                  fontSize: 11,
                  color: 'rgba(0,0,0,0.4)',
                  fontWeight: 500,
                  padding: '0 10px',
                }}>
                  <span>0h</span>
                  <span>6h</span>
                  <span>12h</span>
                  <span>18h</span>
                  <span>24h</span>
                </div>
              </div>

              {/* Next milestone */}
              {nextMilestone && !isComplete && (
                <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)', marginBottom: 20 }}>
                  Next: <span style={{ color: nextMilestone.color, fontWeight: 600 }}>{nextMilestone.title}</span> in {Math.ceil(nextMilestone.hour - elapsedHours)}h
                </div>
              )}

              {/* Control buttons */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowDiary(!showDiary)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 20px',
                    background: showDiary ? 'rgba(139, 92, 246, 0.15)' : '#fff',
                    color: showDiary ? '#7c3aed' : '#333',
                    border: showDiary ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(0,0,0,0.1)',
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
                    background: showHistory ? 'rgba(0,0,0,0.06)' : '#fff',
                    color: '#333',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <History size={18} /> History
                </button>

                <button
                  onClick={() => currentFast && handleOpenShare(currentFast)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 20px',
                    background: '#fff',
                    color: '#8b5cf6',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Share2 size={18} /> Share
                </button>

                <button
                  onClick={() => setShowExtend(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 20px',
                    background: '#fff',
                    color: '#3b82f6',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={18} /> Extend
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
                    boxShadow: isComplete ? '0 4px 20px rgba(34, 197, 94, 0.25)' : 'none',
                  }}
                >
                  {isComplete ? <CheckCircle2 size={18} /> : <RotateCcw size={18} />}
                  {isComplete ? 'Complete!' : 'End'}
                </button>

                {!isComplete && (
                  <button
                    onClick={async () => {
                      if (confirm('Restart your fast? This will end your current fast and start a new one.')) {
                        // End the current fast
                        await handleEndFast();
                        // Refresh profile to get updated state
                        await refreshProfile();
                        // Start new fast directly (bypass canStartFast for restarts)
                        if (user) {
                          const fast = await startFast(user.id, 24);
                          setCurrentFast(fast);
                        }
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 20px',
                      background: '#fff',
                      color: '#666',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Play size={18} /> Restart
                  </button>
                )}
              </div>

              {/* History Panel - shows inline */}
              {showHistory && (
                <div style={{
                  marginTop: 24,
                  background: '#f8f8f8',
                  borderRadius: 16,
                  padding: 20,
                }}>
                  {/* Stats Grid */}
                  <div className="stats-grid" style={{ marginBottom: 20 }}>
                    <div style={{ background: '#fff', padding: 14, borderRadius: 10, textAlign: 'center' }}>
                      <Target size={18} color="#3b82f6" style={{ marginBottom: 4 }} />
                      <div style={{ fontSize: 22, fontWeight: 700 }}>{totalFasts}</div>
                      <div style={{ fontSize: 10, color: '#666' }}>Total</div>
                    </div>
                    <div style={{ background: '#fff', padding: 14, borderRadius: 10, textAlign: 'center' }}>
                      <Award size={18} color="#22c55e" style={{ marginBottom: 4 }} />
                      <div style={{ fontSize: 22, fontWeight: 700 }}>{completedFasts}</div>
                      <div style={{ fontSize: 10, color: '#666' }}>Completed</div>
                    </div>
                    <div style={{ background: '#fff', padding: 14, borderRadius: 10, textAlign: 'center' }}>
                      <TrendingUp size={18} color="#8b5cf6" style={{ marginBottom: 4 }} />
                      <div style={{ fontSize: 22, fontWeight: 700 }}>{completionRate}%</div>
                      <div style={{ fontSize: 10, color: '#666' }}>Success</div>
                    </div>
                    <div style={{ background: '#fff', padding: 14, borderRadius: 10, textAlign: 'center' }}>
                      <Clock size={18} color="#f97316" style={{ marginBottom: 4 }} />
                      <div style={{ fontSize: 22, fontWeight: 700 }}>{Math.round(totalHours)}h</div>
                      <div style={{ fontSize: 10, color: '#666' }}>Fasted</div>
                    </div>
                  </div>

                  <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>Past Fasts</h3>
                  {pastFasts.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      background: '#fff',
                      borderRadius: 12,
                    }}>
                      <History size={48} color="#ddd" style={{ marginBottom: 12 }} />
                      <p style={{ color: '#999', fontSize: 14, margin: 0 }}>No fasting history yet.</p>
                      <p style={{ color: '#bbb', fontSize: 13, margin: '8px 0 0' }}>Complete your first fast to see it here!</p>
                    </div>
                  ) : (
                    pastFasts.map((fast) => {
                      const start = new Date(fast.start_time);
                      const end = fast.end_time ? new Date(fast.end_time) : null;
                      const duration = end ? (end.getTime() - start.getTime()) / (1000 * 60 * 60) : 0;
                      const fastNotes = fast.notes || [];

                      return (
                        <div key={fast.id} style={{
                          background: '#fff',
                          borderRadius: 12,
                          marginBottom: 12,
                          overflow: 'hidden',
                          border: '1px solid rgba(0,0,0,0.06)',
                        }}>
                          {/* Fast summary header */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: 14,
                            borderLeft: `4px solid ${fast.completed ? '#22c55e' : '#f97316'}`,
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 600 }}>{format(start, 'MMM d, yyyy')}</div>
                              <div style={{ fontSize: 13, color: '#666' }}>
                                {Math.floor(duration)}h {Math.round((duration % 1) * 60)}m fasted
                                {fast.target_hours && <span style={{ color: '#999' }}> / {fast.target_hours}h goal</span>}
                              </div>
                            </div>
                            <button
                              onClick={() => handleOpenShare(fast)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '5px 10px',
                                background: '#8b5cf615',
                                color: '#8b5cf6',
                                border: 'none',
                                borderRadius: 16,
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <Share2 size={12} /> Share
                            </button>
                            <div style={{
                              fontSize: 11,
                              padding: '5px 12px',
                              borderRadius: 16,
                              background: fast.completed ? '#22c55e15' : '#f9731615',
                              color: fast.completed ? '#16a34a' : '#ea580c',
                              fontWeight: 600,
                            }}>
                              {fast.completed ? '✓ Completed' : `Ended at ${Math.floor(duration)}h`}
                            </div>
                          </div>

                          {/* Notes for this fast */}
                          {fastNotes.length > 0 && (
                            <div style={{
                              padding: '12px 14px',
                              background: '#fafafa',
                              borderTop: '1px solid rgba(0,0,0,0.04)',
                            }}>
                              <div style={{ fontSize: 11, color: '#999', marginBottom: 8, fontWeight: 600 }}>
                                JOURNAL ENTRIES ({fastNotes.length})
                              </div>
                              {fastNotes.map((note: FastingNote, i: number) => {
                                const mood = MOODS.find(m => m.value === note.mood);
                                return (
                                  <div key={note.id || i} style={{
                                    padding: '10px 12px',
                                    background: '#fff',
                                    borderRadius: 8,
                                    marginBottom: i < fastNotes.length - 1 ? 8 : 0,
                                    fontSize: 13,
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                      <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Hour {note.hour_mark}</span>
                                      {mood && (
                                        <span style={{
                                          fontSize: 11,
                                          padding: '2px 8px',
                                          background: `${mood.color}20`,
                                          color: mood.color,
                                          borderRadius: 10,
                                        }}>
                                          {mood.emoji} {mood.label}
                                        </span>
                                      )}
                                    </div>
                                    {note.note && (
                                      <div style={{ color: '#555', lineHeight: 1.4 }}>{note.note}</div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <p style={{ color: '#666', marginBottom: 24, fontSize: 18 }}>
                Ready to start your fasting journey?
              </p>
              <button
                onClick={handleStartFast}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '16px 36px',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: 20,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 30px rgba(34, 197, 94, 0.35)',
                }}
              >
                <Play size={24} /> Start 24h Fast
              </button>
              <p style={{ color: '#999', fontSize: 13, marginTop: 16 }}>
                First 10 hours free • $5 for 200 days unlimited
              </p>
            </>
          )}
        </div>

        {/* Diary Modal */}
        {showDiary && currentFast && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            zIndex: 100,
            overflowY: 'auto',
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 20,
              padding: 28,
              maxWidth: 540,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
            }}>
              <button
                onClick={() => setShowDiary(false)}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  width: 36,
                  height: 36,
                  background: '#f0f0f0',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 18,
                  color: '#666',
                }}
              >
                ✕
              </button>
              <h3 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#7c3aed' }}>
                How are you feeling? <span style={{ fontWeight: 400, opacity: 0.6 }}>Hour {Math.floor(elapsedHours)}</span>
              </h3>

            {/* Overall Mood selector */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Overall Mood</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {MOODS.map(mood => (
                  <button
                    key={mood.value}
                    onClick={() => setDiaryMood(mood.value)}
                    style={{
                      padding: '10px 18px',
                      background: diaryMood === mood.value ? mood.color : '#f5f5f5',
                      color: diaryMood === mood.value ? '#fff' : '#333',
                      border: diaryMood === mood.value ? 'none' : '1px solid rgba(0,0,0,0.08)',
                      borderRadius: 24,
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{mood.emoji}</span>
                    <span>{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Energy & Hunger sliders */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Energy: {diaryEnergy}/5
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      onClick={() => setDiaryEnergy(n)}
                      style={{
                        width: 40,
                        height: 40,
                        background: n <= diaryEnergy ? '#eab308' : '#f0f0f0',
                        border: 'none',
                        borderRadius: 10,
                        color: n <= diaryEnergy ? '#fff' : '#999',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Zap size={18} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Hunger: {diaryHunger}/5
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      onClick={() => setDiaryHunger(n)}
                      style={{
                        width: 40,
                        height: 40,
                        background: n <= diaryHunger ? '#ef4444' : '#f0f0f0',
                        border: 'none',
                        borderRadius: 10,
                        color: n <= diaryHunger ? '#fff' : '#999',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Feeling selectors by category */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                What are you experiencing? <span style={{ opacity: 0.6 }}>(tap all that apply)</span>
              </div>
              {Object.entries(FEELING_OPTIONS).map(([categoryId, category]) => (
                <div key={categoryId} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)', marginBottom: 8 }}>{category.label}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {category.options.map(option => {
                      const isSelected = selectedFeelings.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          onClick={() => toggleFeeling(option.id)}
                          style={{
                            padding: '8px 14px',
                            background: isSelected ? 'rgba(139, 92, 246, 0.15)' : '#f5f5f5',
                            color: isSelected ? '#7c3aed' : '#555',
                            border: isSelected ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(0,0,0,0.06)',
                            borderRadius: 20,
                            fontSize: 13,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 0.15s',
                          }}
                        >
                          <span>{option.emoji}</span>
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Selected feelings summary */}
            {selectedFeelings.length > 0 && (
              <div style={{
                padding: 12,
                background: 'rgba(139, 92, 246, 0.08)',
                borderRadius: 10,
                marginBottom: 16,
                fontSize: 13,
                color: '#555',
              }}>
                <strong>Selected:</strong> {selectedFeelings.map(id => {
                  for (const category of Object.values(FEELING_OPTIONS)) {
                    const opt = category.options.find(o => o.id === id);
                    if (opt) return `${opt.emoji} ${opt.label}`;
                  }
                  return id;
                }).join(', ')}
              </div>
            )}

            {/* Optional additional note */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Additional notes <span style={{ opacity: 0.6 }}>(optional)</span>
              </div>
              <textarea
                value={diaryNote}
                onChange={(e) => setDiaryNote(e.target.value)}
                placeholder="Any other thoughts or observations..."
                style={{
                  width: '100%',
                  minHeight: 70,
                  padding: 14,
                  background: '#f8f8f8',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 12,
                  color: '#333',
                  fontSize: 14,
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              onClick={handleAddNote}
              disabled={(selectedFeelings.length === 0 && !diaryNote.trim()) || savingNote}
              style={{
                padding: '14px 28px',
                background: (selectedFeelings.length > 0 || diaryNote.trim()) ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : '#e5e5e5',
                color: (selectedFeelings.length > 0 || diaryNote.trim()) ? '#fff' : '#999',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                cursor: (selectedFeelings.length > 0 || diaryNote.trim()) ? 'pointer' : 'not-allowed',
                boxShadow: (selectedFeelings.length > 0 || diaryNote.trim()) ? '0 4px 20px rgba(139, 92, 246, 0.25)' : 'none',
              }}
            >
              {savingNote ? 'Saving...' : 'Save Entry'}
            </button>
            </div>
          </div>
        )}

        {/* Previous notes for this fast */}
        {currentFast && notes.length > 0 && (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            border: '1px solid rgba(0,0,0,0.06)',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.5)' }}>
              Your Journey ({notes.length} {notes.length === 1 ? 'note' : 'notes'})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {notes.map((note, i) => {
                const mood = MOODS.find(m => m.value === note.mood);
                return (
                  <div key={note.id || i} style={{
                    display: 'flex',
                    gap: 12,
                    padding: 12,
                    background: '#f8f8f8',
                    borderRadius: 10,
                    borderLeft: `3px solid ${mood?.color || '#999'}`,
                  }}>
                    <div style={{ fontSize: 24 }}>{mood?.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 6, fontSize: 12, color: 'rgba(0,0,0,0.4)' }}>
                        <span>Hour {note.hour_mark}</span>
                        <span>Energy: {note.energy_level}/5</span>
                        <span>Hunger: {note.hunger_level}/5</span>
                      </div>
                      <div style={{ fontSize: 14, color: '#333' }}>{note.note}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Current milestone detail */}
        {currentFast && (
          <div style={{
            background: '#fff',
            border: `1px solid ${currentMilestone.color}30`,
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `${currentMilestone.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: currentMilestone.color,
              }}>
                <MilestoneIcon icon={currentMilestone.icon} size={24} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Current Stage • Hour {currentMilestone.hour}
                </div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: currentMilestone.color }}>
                  {currentMilestone.title}
                </h2>
              </div>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#555', lineHeight: 1.6 }}>
              {currentMilestone.detail}
            </p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {currentMilestone.benefits.map((benefit, i) => (
                <span key={i} style={{
                  padding: '6px 12px',
                  background: `${currentMilestone.color}12`,
                  borderRadius: 20,
                  fontSize: 12,
                  color: currentMilestone.color,
                  fontWeight: 500,
                }}>
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Next milestone preview */}
        {currentFast && nextMilestone && !isComplete && (
          <div style={{
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: `${nextMilestone.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: nextMilestone.color,
                }}>
                  <MilestoneIcon icon={nextMilestone.icon} size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>Next milestone</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: nextMilestone.color }}>{nextMilestone.title}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#333' }}>
                  {Math.ceil(nextMilestone.hour - elapsedHours)}h
                </div>
                <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>to go</div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Upgrade Modal - $5 per fast */}
      {showUpgrade && (
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
            borderRadius: 20,
            padding: 36,
            maxWidth: 420,
            width: '100%',
            textAlign: 'center',
          }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Flame size={40} color="#fff" />
            </div>

            <h2 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800 }}>Unlock Unlimited Fasting</h2>
            <p style={{ color: '#666', marginBottom: 28, fontSize: 16, lineHeight: 1.5 }}>
              You've used your free 10 hours. Unlock 200 days of unlimited fasting!
            </p>

            <div style={{
              background: 'rgba(34, 197, 94, 0.08)',
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 48, fontWeight: 800, color: '#16a34a' }}>$5</span>
                <span style={{ color: '#666', fontSize: 16 }}>/ 200 days</span>
              </div>
              <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
                Unlimited fasts with all features
              </p>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', textAlign: 'left' }}>
              {['Unlimited fasts for 200 days', 'Track 13 metabolic milestones', 'Journal your experience', 'Extend any fast past 24h'].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 14, color: '#555' }}>
                  <CheckCircle2 size={18} color="#22c55e" />
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={handlePayForFast}
              style={{
                width: '100%',
                padding: '18px 24px',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 18,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 24px rgba(34, 197, 94, 0.3)',
                marginBottom: 12,
              }}
            >
              Unlock 200 Days - $5
            </button>

            <button
              onClick={() => setShowUpgrade(false)}
              style={{
                width: '100%',
                padding: '14px',
                background: 'transparent',
                color: '#999',
                border: 'none',
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

      {/* Extend Fast Modal */}
      {showExtend && currentFast && (
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
            borderRadius: 20,
            padding: 36,
            maxWidth: 400,
            width: '100%',
            textAlign: 'center',
          }}>
            <div style={{
              width: 70,
              height: 70,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Timer size={36} color="#fff" />
            </div>

            <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800 }}>Extend Your Fast</h2>
            <p style={{ color: '#666', marginBottom: 24, fontSize: 15 }}>
              Push further! Add more hours to your current {targetHours}h fast.
            </p>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Add hours
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                {[2, 4, 6, 8, 12].map(hours => (
                  <button
                    key={hours}
                    onClick={() => setExtendHours(hours)}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 12,
                      border: extendHours === hours ? '2px solid #3b82f6' : '1px solid rgba(0,0,0,0.1)',
                      background: extendHours === hours ? 'rgba(59, 130, 246, 0.1)' : '#fff',
                      color: extendHours === hours ? '#3b82f6' : '#333',
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    +{hours}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              background: 'rgba(59, 130, 246, 0.08)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
            }}>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>New target:</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#3b82f6' }}>
                {targetHours + extendHours} hours
              </div>
              <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>
                Ends at {format(new Date(fastStartTime! + ((targetHours + extendHours) * 60 * 60 * 1000)), 'h:mm a, EEE')}
              </div>
            </div>

            <button
              onClick={handleExtendFast}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 17,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
                marginBottom: 12,
              }}
            >
              Extend by {extendHours} hours
            </button>

            <button
              onClick={() => setShowExtend(false)}
              style={{
                width: '100%',
                padding: '14px',
                background: 'transparent',
                color: '#999',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Payment Required Overlay - Shows at 10 hours */}
      {needsPayment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            zIndex: 9999,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            background: '#fff',
            borderRadius: 24,
            padding: 40,
            maxWidth: 440,
            width: '100%',
            textAlign: 'center',
            pointerEvents: 'auto',
          }}>
            <div style={{
              width: 90,
              height: 90,
              borderRadius: 24,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 8px 32px rgba(34, 197, 94, 0.3)',
            }}>
              <Flame size={48} color="#fff" />
            </div>

            <h2 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 800 }}>
              You're doing amazing!
            </h2>
            <p style={{ color: '#666', marginBottom: 24, fontSize: 18, lineHeight: 1.5 }}>
              You've reached <strong style={{ color: '#22c55e' }}>10 hours</strong> of fasting.
              <br />Unlock unlimited fasting for 200 days.
            </p>

            <div style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.1))',
              borderRadius: 16,
              padding: 24,
              marginBottom: 28,
            }}>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Unlimited fasting for</div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 56, fontWeight: 800, color: '#16a34a' }}>$5</span>
                <span style={{ fontSize: 18, color: '#666' }}>/ 200 days</span>
              </div>
              <div style={{ fontSize: 14, color: '#888', marginTop: 8 }}>
                Unlimited fasts • Extend anytime • Full features
              </div>
            </div>

            <div style={{ marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 13, color: '#999', marginBottom: 12 }}>What you'll unlock:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Unlimited fasts for 200 days',
                  'All 13 metabolic milestones',
                  'Journal & track your experience',
                  'Extend any fast past 24 hours',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircle2 size={18} color="#22c55e" />
                    <span style={{ fontSize: 14, color: '#555' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handlePayForFast}
              style={{
                width: '100%',
                padding: '20px 24px',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                fontSize: 20,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 6px 28px rgba(34, 197, 94, 0.35)',
                marginBottom: 16,
              }}
            >
              Unlock 200 Days - $5
            </button>

            <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
              Your fast is still running! Pay now to continue.
            </p>
          </div>
        </div>
      )}

      {/* Fast Completion Summary Modal */}
      {showCompletionSummary && completedFastSummary && (
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
            padding: 36,
            maxWidth: 420,
            width: '100%',
            textAlign: 'center',
          }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: completedFastSummary.completed
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : `linear-gradient(135deg, ${completedFastSummary.milestone.color}, ${completedFastSummary.milestone.color}dd)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              {completedFastSummary.completed ? (
                <Award size={40} color="#fff" />
              ) : (
                <MilestoneIcon icon={completedFastSummary.milestone.icon} size={40} />
              )}
            </div>

            <h2 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800 }}>
              {completedFastSummary.completed ? 'Fast Complete!' : 'Fast Ended'}
            </h2>

            <div style={{
              fontSize: 48,
              fontWeight: 800,
              color: completedFastSummary.completed ? '#16a34a' : completedFastSummary.milestone.color,
              marginBottom: 8,
            }}>
              {completedFastSummary.hours}h {completedFastSummary.minutes}m
            </div>

            <p style={{ color: '#666', marginBottom: 24, fontSize: 16 }}>
              {completedFastSummary.completed
                ? 'Amazing work! You completed your fast!'
                : `You reached the "${completedFastSummary.milestone.title}" stage`}
            </p>

            {/* Milestone reached */}
            <div style={{
              background: `${completedFastSummary.milestone.color}10`,
              border: `1px solid ${completedFastSummary.milestone.color}30`,
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              textAlign: 'left',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: completedFastSummary.milestone.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}>
                  <MilestoneIcon icon={completedFastSummary.milestone.icon} size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: completedFastSummary.milestone.color, fontWeight: 600 }}>
                    HIGHEST MILESTONE
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{completedFastSummary.milestone.title}</div>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: '#555', lineHeight: 1.5 }}>
                {completedFastSummary.milestone.detail}
              </p>
            </div>

            <button
              onClick={() => {
                setShowCompletionSummary(false);
                setCompletedFastSummary(null);
              }}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 17,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShare && shareTargetFast && (
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
            maxWidth: 420,
            width: '100%',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Share2 size={24} color="#fff" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Share Your Fast</h2>
                  <p style={{ margin: 0, fontSize: 13, color: '#666' }}>Inspire your friends!</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowShare(false);
                  setShareTargetFast(null);
                  setCurrentShare(null);
                }}
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

            {shareLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 14, color: '#666' }}>Loading...</div>
              </div>
            ) : currentShare ? (
              /* Share link created - show copy UI */
              <>
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginBottom: 8 }}>
                    SHARE LINK READY
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                  }}>
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/share/${currentShare.share_token}`}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: '#fff',
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        fontSize: 13,
                        color: '#333',
                      }}
                    />
                    <button
                      onClick={handleCopyShareLink}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '10px 16px',
                        background: shareCopied ? '#22c55e' : '#8b5cf6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                    >
                      {shareCopied ? <Check size={16} /> : <Copy size={16} />}
                      {shareCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {currentShare.view_count > 0 && (
                  <div style={{
                    fontSize: 13,
                    color: '#666',
                    textAlign: 'center',
                    marginBottom: 16,
                  }}>
                    This link has been viewed {currentShare.view_count} time{currentShare.view_count !== 1 ? 's' : ''}
                  </div>
                )}

                <div style={{
                  background: '#faf5ff',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}>
                  <p style={{ margin: 0, fontSize: 14, color: '#6b21a8', lineHeight: 1.6 }}>
                    Your friend will see your fasting duration, milestone reached, and an invitation to try fasting themselves!
                    {currentShare.include_notes && ' They can also see your journal entries.'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowShare(false);
                    setShareTargetFast(null);
                    setCurrentShare(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    background: '#f5f5f5',
                    color: '#333',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </>
            ) : (
              /* Create share form */
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 6 }}>
                    Your Name (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="How should we introduce you?"
                    value={shareName}
                    onChange={(e) => setShareName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #e5e5e5',
                      borderRadius: 10,
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: '#f9fafb',
                  borderRadius: 12,
                  marginBottom: 20,
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>Include journal entries</div>
                    <div style={{ fontSize: 12, color: '#666' }}>Share your feelings and notes</div>
                  </div>
                  <button
                    onClick={() => setShareIncludeNotes(!shareIncludeNotes)}
                    style={{
                      width: 48,
                      height: 28,
                      borderRadius: 14,
                      background: shareIncludeNotes ? '#8b5cf6' : '#d1d5db',
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#fff',
                      position: 'absolute',
                      top: 3,
                      left: shareIncludeNotes ? 23 : 3,
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>

                <div style={{
                  background: '#fffbeb',
                  border: '1px solid #fcd34d',
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 20,
                }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
                    Your friend will see your progress and be encouraged to start their own fasting journey!
                  </p>
                </div>

                <button
                  onClick={handleCreateShare}
                  disabled={shareLoading}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: shareLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
                  }}
                >
                  <Share2 size={18} />
                  Create Share Link
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Always-visible Fasting Timeline at Bottom */}
      {currentFast && (
        <div style={{
          background: '#fff',
          borderTop: '1px solid #e5e5e5',
          padding: '32px 24px 48px',
        }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <h3 style={{
              margin: '0 0 24px',
              fontSize: 20,
              fontWeight: 700,
              textAlign: 'center',
              color: '#333',
            }}>
              Your Fasting Journey
            </h3>

            <div className="journey-grid">
              {FASTING_MILESTONES.filter(m => m.hour > 0).map((m) => {
                const isPassed = elapsedHours >= m.hour;
                const isCurrent = currentMilestone.hour === m.hour;
                const hoursUntil = m.hour - elapsedHours;

                return (
                  <div key={m.hour} className="journey-card" style={{
                    display: 'flex',
                    gap: 16,
                    padding: '16px 20px',
                    background: isCurrent ? `${m.color}08` : isPassed ? '#fafafa' : '#fff',
                    borderRadius: 14,
                    border: isCurrent ? `2px solid ${m.color}` : '1px solid rgba(0,0,0,0.06)',
                    opacity: isPassed && !isCurrent ? 0.6 : 1,
                    transition: 'all 0.3s ease',
                  }}>
                    {/* Icon */}
                    <div className="icon-box" style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: isPassed || isCurrent ? m.color : '#e5e5e5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      flexShrink: 0,
                    }}>
                      {isPassed && !isCurrent ? (
                        <CheckCircle2 size={24} />
                      ) : (
                        <MilestoneIcon icon={m.icon} size={24} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: m.color,
                          background: `${m.color}15`,
                          padding: '3px 8px',
                          borderRadius: 6,
                        }}>
                          HOUR {m.hour}
                        </span>
                        {isCurrent && (
                          <span style={{
                            fontSize: 11,
                            background: m.color,
                            color: '#fff',
                            padding: '3px 10px',
                            borderRadius: 20,
                            fontWeight: 600,
                          }}>
                            NOW
                          </span>
                        )}
                        {isPassed && !isCurrent && (
                          <span style={{
                            fontSize: 11,
                            background: '#22c55e20',
                            color: '#16a34a',
                            padding: '3px 10px',
                            borderRadius: 20,
                            fontWeight: 600,
                          }}>
                            COMPLETE
                          </span>
                        )}
                        {!isPassed && !isCurrent && (
                          <span style={{
                            fontSize: 11,
                            color: '#999',
                          }}>
                            in {Math.ceil(hoursUntil)}h
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: '#333' }}>
                        {m.title}
                      </div>
                      <div style={{ fontSize: 14, color: '#666', lineHeight: 1.5 }}>
                        {m.detail}
                      </div>
                      {/* Benefits tags */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                        {m.benefits.map((benefit, i) => (
                          <span key={i} style={{
                            padding: '4px 10px',
                            background: isPassed || isCurrent ? `${m.color}12` : 'rgba(0,0,0,0.04)',
                            borderRadius: 16,
                            fontSize: 11,
                            color: isPassed || isCurrent ? m.color : '#888',
                            fontWeight: 500,
                          }}>
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
