import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, RotateCcw, CheckCircle2, PenLine, Flame, Brain, Zap,
  Heart, Sparkles, Clock, History, Share2, Edit3,
  LogOut, TrendingUp, Award, Target, Plus, Timer, Settings,
  Trash2, Link, Eye, Copy, X, Check, MessageSquare, Users
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import {
  getCurrentFast, startFast, endFast, getFastingHistory,
  getFastingNotes, addFastingNote, canStartFast, updateUserProfile,
  signOut, extendFast, setFastStartTime,
  getUserShares, deleteShare,
  getCommunityFasts,
  createShareConnection, getUserConnections, getPendingInvites,
  removeShareConnection,
  type FastingSession, type FastingNote, type FastShare,
  type CommunityFast, type ConnectionWithFast, type ShareConnection
} from '../lib/supabase';
import { redirectToCheckout, FAST_PRICE_ID } from '../lib/stripe';

// Free hours before payment required
const FREE_HOURS = 10;

// Admin emails
const ADMIN_EMAILS = ['chrismarinelli@live.com'];

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

// Popular fasting protocols
const FASTING_PROTOCOLS = [
  {
    id: '16:8',
    name: '16:8 Intermittent',
    hours: 16,
    shortDesc: 'Most popular beginner protocol',
    description: 'Fast for 16 hours, eat within an 8-hour window. This is the most popular and sustainable intermittent fasting method, often done daily.',
    benefits: ['Easy to maintain', 'Fits most lifestyles', 'Great for beginners', 'Mild ketosis'],
    popularWith: 'Beginners, busy professionals, daily fasters',
    icon: 'clock',
    color: '#3b82f6',
  },
  {
    id: '18:6',
    name: '18:6 Lean Gains',
    hours: 18,
    shortDesc: 'Popular for fat loss & muscle',
    description: 'Fast for 18 hours with a 6-hour eating window. Popularized by Martin Berkhan for body recomposition. Deeper ketosis while still manageable.',
    benefits: ['Enhanced fat burning', 'Muscle preservation', 'Better insulin sensitivity', 'Growth hormone boost'],
    popularWith: 'Fitness enthusiasts, weight lifters, fat loss seekers',
    icon: 'zap',
    color: '#8b5cf6',
  },
  {
    id: '20:4',
    name: '20:4 Warrior Diet',
    hours: 20,
    shortDesc: 'One main meal approach',
    description: 'Fast for 20 hours, eat within 4 hours. Based on ancient warrior eating patterns - small snacks during the day, one large meal at night.',
    benefits: ['Strong autophagy', 'Simplified eating', 'Mental clarity', 'Deep fat burning'],
    popularWith: 'Experienced fasters, those seeking simplicity, warriors',
    icon: 'flame',
    color: '#f97316',
  },
  {
    id: 'omad',
    name: 'OMAD (23:1)',
    hours: 23,
    shortDesc: 'One Meal A Day',
    description: 'Eat all your daily calories in one meal. Maximum autophagy benefits while still eating daily. Popular for weight loss and mental clarity.',
    benefits: ['Maximum daily autophagy', 'Simple routine', 'Strong ketosis', 'Time freedom'],
    popularWith: 'Experienced fasters, busy professionals, weight loss focused',
    icon: 'brain',
    color: '#ec4899',
  },
  {
    id: '24h',
    name: '24-Hour Fast',
    hours: 24,
    shortDesc: 'Full day reset',
    description: 'A complete 24-hour fast from dinner to dinner or lunch to lunch. Also known as Eat-Stop-Eat method. Great weekly reset for your metabolism.',
    benefits: ['Full autophagy cycle', 'Metabolic reset', 'Insulin sensitivity', 'Growth hormone surge'],
    popularWith: 'Weekly fasters, metabolic health seekers, those doing Eat-Stop-Eat',
    icon: 'sparkles',
    color: '#22c55e',
  },
  {
    id: '36h',
    name: '36-Hour Monk Fast',
    hours: 36,
    shortDesc: 'Extended healing fast',
    description: 'Skip an entire day of eating. Often done from dinner one day to breakfast two days later. Deeper cellular repair and significant fat burning.',
    benefits: ['Deep autophagy', 'Significant ketosis', 'Cellular regeneration', 'Mental breakthrough'],
    popularWith: 'Spiritual practitioners, experienced fasters, healing seekers',
    icon: 'heart',
    color: '#14b8a6',
  },
  {
    id: '48h',
    name: '48-Hour Extended',
    hours: 48,
    shortDesc: 'Two-day deep cleanse',
    description: 'A two-day fast for maximum autophagy and metabolic benefits. Body fully adapts to fat burning. Often done monthly for deep cellular renewal.',
    benefits: ['Peak autophagy', 'Stem cell regeneration', 'Full fat adaptation', 'Immune reset'],
    popularWith: 'Experienced fasters, longevity seekers, monthly reset practitioners',
    icon: 'sparkles',
    color: '#a855f7',
  },
  {
    id: '72h',
    name: '72-Hour Autophagy Max',
    hours: 72,
    shortDesc: 'Maximum cellular renewal',
    description: 'Three-day fast for peak autophagy and immune system regeneration. Research shows stem cell regeneration peaks around 72 hours.',
    benefits: ['Maximum stem cell renewal', 'Immune system reset', 'Deep cellular cleanup', 'Metabolic transformation'],
    popularWith: 'Advanced fasters, longevity researchers, quarterly reset practitioners',
    icon: 'sparkles',
    color: '#ef4444',
  },
];

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
  const [showAdjustTime, setShowAdjustTime] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMode, setShareMode] = useState<'choose' | 'link' | 'link-done'>('choose');
  const [shareName, setShareName] = useState('');
  const [shareShowNetwork, setShareShowNetwork] = useState(false);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [copiedShareToken, setCopiedShareToken] = useState<string | null>(null);
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);
  const [userShares, setUserShares] = useState<(FastShare & { fast?: FastingSession })[]>([]);
  const [userConnections, setUserConnections] = useState<ConnectionWithFast[]>([]);
  const [pendingInvites, setPendingInvites] = useState<ShareConnection[]>([]);
  const [communityFasts, setCommunityFasts] = useState<CommunityFast[]>([]);
  const [hoveredCommunityMilestone, setHoveredCommunityMilestone] = useState<{ fastId: string; hour: number } | null>(null);
  const [showProtocolSelect, setShowProtocolSelect] = useState(false);
  const [adjustHours, setAdjustHours] = useState(0);
  const [extendHours, setExtendHours] = useState(6);
  const [showCompletionSummary, setShowCompletionSummary] = useState(false);
  const [completedFastSummary, setCompletedFastSummary] = useState<{
    hours: number;
    minutes: number;
    milestone: typeof FASTING_MILESTONES[0];
    completed: boolean;
  } | null>(null);

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

  // Load community fasts
  useEffect(() => {
    const loadCommunity = async () => {
      const fasts = await getCommunityFasts();
      setCommunityFasts(fasts);
    };
    loadCommunity();
    // Refresh every 30 seconds
    const interval = setInterval(loadCommunity, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load user shares and connections when history is opened
  useEffect(() => {
    if (showHistory && user) {
      getUserShares(user.id).then(shares => {
        setUserShares(shares);
      });
      getUserConnections(user.id).then(connections => {
        setUserConnections(connections);
      });
      getPendingInvites(user.id).then(invites => {
        setPendingInvites(invites);
      });
    }
  }, [showHistory, user]);

  const handleStartFast = useCallback(async (targetHours: number = 24) => {
    if (!user || !profile) return;

    // Check if user can start
    const allowed = await canStartFast(profile);
    if (!allowed) {
      setShowUpgrade(true);
      setShowProtocolSelect(false);
      return;
    }

    const fast = await startFast(user.id, targetHours);
    setCurrentFast(fast);
    setShowDiary(false);
    setShowHistory(false);
    setShowProtocolSelect(false);
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

  // Find the current protocol based on target hours
  const currentProtocol = FASTING_PROTOCOLS.find(p => p.hours === targetHours) || FASTING_PROTOCOLS.find(p => p.id === '24h');

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

          {/* Admin link - only show for admin users */}
          {user?.email && ADMIN_EMAILS.includes(user.email) && (
            <button
              onClick={() => navigate('/admin')}
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
              <Settings size={16} />
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

              {/* Start and End time display */}
              {fastStartTime && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 24,
                  marginBottom: 24,
                  flexWrap: 'wrap',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                      Started
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#333' }}>
                      {format(new Date(fastStartTime), 'h:mm a')}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)' }}>
                      {format(new Date(fastStartTime), 'EEE, MMM d')}
                    </div>
                  </div>
                  <div style={{ width: 1, background: 'rgba(0,0,0,0.1)', alignSelf: 'stretch' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                      {isComplete ? 'Completed' : `${targetHours}h Goal`}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: isComplete ? '#16a34a' : '#333' }}>
                      {format(new Date(fastStartTime + fastDuration), 'h:mm a')}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)' }}>
                      {format(new Date(fastStartTime + fastDuration), 'EEE, MMM d')}
                    </div>
                  </div>
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
                  {FASTING_MILESTONES.filter(m => m.hour > 0 && m.hour <= targetHours).map(m => {
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
                          left: `${(m.hour / targetHours) * 100}%`,
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
                            background: '#fff',
                            color: '#333',
                            borderRadius: 12,
                            fontSize: 13,
                            width: 260,
                            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                            border: '1px solid rgba(0,0,0,0.08)',
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
                            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 16, color: '#1a1a1a' }}>{m.title}</div>
                            <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 10 }}>{m.detail}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {m.benefits.map(b => (
                                <span key={b} style={{
                                  fontSize: 11,
                                  padding: '3px 8px',
                                  background: `${m.color}15`,
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
                              borderTop: '8px solid #fff',
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

              {/* Protocol Info Card */}
              {currentProtocol && (
                <div style={{
                  background: `${currentProtocol.color}08`,
                  border: `1px solid ${currentProtocol.color}20`,
                  borderRadius: 14,
                  padding: '16px 20px',
                  marginBottom: 20,
                  textAlign: 'left',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: `${currentProtocol.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: currentProtocol.color,
                    }}>
                      <MilestoneIcon icon={currentProtocol.icon} size={22} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: currentProtocol.color, marginBottom: 4 }}>
                        {currentProtocol.name}
                      </div>
                      <div style={{ fontSize: 13, color: '#555', marginBottom: 8, lineHeight: 1.5 }}>
                        {currentProtocol.description}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                        {currentProtocol.benefits.map((benefit, i) => (
                          <span key={i} style={{
                            fontSize: 11,
                            padding: '3px 8px',
                            background: '#fff',
                            color: '#666',
                            borderRadius: 6,
                            border: '1px solid rgba(0,0,0,0.06)',
                          }}>
                            {benefit}
                          </span>
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: '#888' }}>
                        Popular with: {currentProtocol.popularWith}
                      </div>
                    </div>
                  </div>
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
                  onClick={() => {
                    setShareName(profile?.name || '');
                    setShareMode('choose');
                    setCopiedShareToken(null);
                    setShowShareModal(true);
                  }}
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
                  onClick={() => setShowAdjustTime(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 20px',
                    background: showAdjustTime ? 'rgba(234, 179, 8, 0.15)' : '#fff',
                    color: '#ca8a04',
                    border: '1px solid rgba(234, 179, 8, 0.3)',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Edit3 size={18} /> Fix Start
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
                  <Plus size={18} /> Add Hours
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

              {/* Community Fasts Section - Shows other users currently fasting */}
              {communityFasts.filter(f => f.user_id !== user?.id).length > 0 && (
                <div style={{
                  marginTop: 24,
                  background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                  borderRadius: 16,
                  padding: 20,
                }}>
                  <h3 style={{
                    margin: '0 0 16px 0',
                    fontSize: 16,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#333',
                  }}>
                    <Users size={18} color="#8b5cf6" />
                    Fasting Together ({communityFasts.filter(f => f.user_id !== user?.id).length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {communityFasts.filter(f => f.user_id !== user?.id).map(fast => {
                      const startTime = new Date(fast.start_time).getTime();
                      const durationMs = now - startTime;
                      const totalHrs = durationMs / (1000 * 60 * 60);
                      const days = Math.floor(totalHrs / 24);
                      const hrs = Math.floor(totalHrs % 24);
                      const mins = Math.floor((totalHrs - Math.floor(totalHrs)) * 60);
                      const secs = Math.floor((totalHrs * 3600) - (Math.floor(totalHrs) * 3600) - (mins * 60));
                      const milestone = FASTING_MILESTONES.filter(m => m.hour <= totalHrs).pop() || FASTING_MILESTONES[0];
                      const nextMilestone = FASTING_MILESTONES.find(m => m.hour > totalHrs);
                      const prog = Math.min(100, (totalHrs / fast.target_hours) * 100);
                      const isComplete = totalHrs >= fast.target_hours;

                      return (
                        <div
                          key={fast.id}
                          style={{
                            background: '#fff',
                            borderRadius: 16,
                            padding: 20,
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                            borderLeft: `4px solid ${milestone.color}`,
                          }}
                        >
                          {/* Name and Live badge */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 12,
                          }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#333' }}>
                              {fast.user_name}
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
                              <Timer size={12} />
                              LIVE
                            </div>
                          </div>

                          {/* Milestone badge */}
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            background: `${milestone.color}15`,
                            borderRadius: 20,
                            color: milestone.color,
                            fontSize: 13,
                            fontWeight: 600,
                            marginBottom: 12,
                          }}>
                            <MilestoneIcon icon={milestone.icon} size={16} />
                            {milestone.title}
                          </div>

                          {/* Timer */}
                          <div style={{
                            fontSize: 24,
                            fontWeight: 700,
                            color: isComplete ? '#16a34a' : milestone.color,
                            fontVariantNumeric: 'tabular-nums',
                            marginBottom: 10,
                          }}>
                            {days > 0 && <span>{days}d </span>}
                            {hrs}:{mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
                          </div>

                          {/* Progress bar with milestone dots */}
                          <div style={{ marginBottom: 8 }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 6,
                            }}>
                              <span style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: isComplete ? '#16a34a' : milestone.color,
                              }}>
                                {Math.round(prog)}% Complete
                              </span>
                              <span style={{ fontSize: 12, color: '#888' }}>
                                Goal: {fast.target_hours}h
                              </span>
                            </div>
                            <div style={{ position: 'relative' }}>
                              {/* Track */}
                              <div style={{
                                width: '100%',
                                height: 8,
                                background: 'rgba(0,0,0,0.06)',
                                borderRadius: 4,
                              }}>
                                {/* Fill */}
                                <div style={{
                                  width: `${prog}%`,
                                  height: '100%',
                                  background: isComplete ? '#22c55e' : `linear-gradient(90deg, ${milestone.color}, ${nextMilestone?.color || '#22c55e'})`,
                                  borderRadius: 4,
                                  transition: 'width 1s linear',
                                }} />
                              </div>
                              {/* Milestone dots */}
                              {FASTING_MILESTONES.filter(m => m.hour > 0 && m.hour <= fast.target_hours).map(m => {
                                const isPassed = totalHrs >= m.hour;
                                const isCurrent = milestone.hour === m.hour;
                                const isHovered = hoveredCommunityMilestone?.fastId === fast.id && hoveredCommunityMilestone?.hour === m.hour;
                                return (
                                  <div
                                    key={m.hour}
                                    onMouseEnter={() => setHoveredCommunityMilestone({ fastId: fast.id, hour: m.hour })}
                                    onMouseLeave={() => setHoveredCommunityMilestone(null)}
                                    style={{
                                      position: 'absolute',
                                      left: `${(m.hour / fast.target_hours) * 100}%`,
                                      top: '50%',
                                      transform: 'translate(-50%, -50%)',
                                      cursor: 'pointer',
                                      zIndex: isHovered ? 100 : 10,
                                    }}
                                  >
                                    <div style={{
                                      width: isCurrent ? 16 : isHovered ? 14 : 10,
                                      height: isCurrent ? 16 : isHovered ? 14 : 10,
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
                                        padding: '12px 16px',
                                        background: '#fff',
                                        color: '#333',
                                        borderRadius: 12,
                                        fontSize: 13,
                                        width: 220,
                                        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                                        border: '1px solid rgba(0,0,0,0.08)',
                                        zIndex: 1000,
                                      }}>
                                        <div style={{
                                          fontWeight: 700,
                                          color: m.color,
                                          marginBottom: 4,
                                          fontSize: 11,
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.05em',
                                        }}>
                                          Hour {m.hour} {isCurrent ? '• CURRENT' : isPassed ? '• ACHIEVED' : '• UPCOMING'}
                                        </div>
                                        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15, color: '#1a1a1a' }}>{m.title}</div>
                                        <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>{m.shortDesc}</div>
                                        {/* Arrow */}
                                        <div style={{
                                          position: 'absolute',
                                          bottom: -8,
                                          left: '50%',
                                          transform: 'translateX(-50%) rotate(45deg)',
                                          width: 14,
                                          height: 14,
                                          background: '#fff',
                                          borderRight: '1px solid rgba(0,0,0,0.08)',
                                          borderBottom: '1px solid rgba(0,0,0,0.08)',
                                        }} />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Started time */}
                          <div style={{ fontSize: 12, color: '#888' }}>
                            Started {format(new Date(fast.start_time), 'h:mm a')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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

                  {/* Share Connections Section */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Users size={18} color="#8b5cf6" /> Fasting Buddies
                      </h3>
                      <button
                        onClick={() => {
                          setShareMode('link');
                          setShareName(profile?.name || '');
                          setShowShareModal(true);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '6px 12px',
                          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={14} /> Share With Someone
                      </button>
                    </div>

                    {/* Pending Invites */}
                    {pendingInvites.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Pending Invites
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {pendingInvites.map((invite) => {
                            const inviteUrl = `${window.location.origin}/connect/${invite.invite_code}`;
                            return (
                              <div key={invite.id} style={{
                                background: '#fffbeb',
                                borderRadius: 10,
                                padding: '10px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                border: '1px solid #fde68a',
                              }}>
                                <Clock size={16} color="#f59e0b" />
                                <div style={{ flex: 1, fontSize: 13, color: '#92400e' }}>
                                  Waiting for someone to accept...
                                </div>
                                <button
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(inviteUrl);
                                  }}
                                  style={{
                                    padding: '4px 10px',
                                    background: '#f59e0b',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Copy Link
                                </button>
                                <button
                                  onClick={async () => {
                                    if (user) {
                                      await removeShareConnection(invite.id, user.id);
                                      const invites = await getPendingInvites(user.id);
                                      setPendingInvites(invites);
                                    }
                                  }}
                                  style={{
                                    padding: '4px 8px',
                                    background: 'transparent',
                                    color: '#dc2626',
                                    border: 'none',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Connected Buddies */}
                    {userConnections.length === 0 && pendingInvites.length === 0 ? (
                      <div style={{
                        background: '#fff',
                        borderRadius: 12,
                        padding: '20px',
                        textAlign: 'center',
                      }}>
                        <Users size={32} color="#ddd" style={{ marginBottom: 8 }} />
                        <p style={{ color: '#888', fontSize: 13, margin: 0 }}>
                          Share with a friend to see each other's fasts
                        </p>
                      </div>
                    ) : userConnections.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {userConnections.map((connection) => {
                          const isFasting = !!connection.current_fast;
                          let fastHours = 0;
                          if (connection.current_fast) {
                            const startTime = new Date(connection.current_fast.start_time).getTime();
                            fastHours = (Date.now() - startTime) / (1000 * 60 * 60);
                          }
                          const milestone = FASTING_MILESTONES.filter(m => m.hour <= fastHours).pop() || FASTING_MILESTONES[0];

                          return (
                            <div key={connection.connection_id} style={{
                              background: '#fff',
                              borderRadius: 10,
                              padding: '12px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                            }}>
                              <div style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: isFasting
                                  ? `linear-gradient(135deg, ${milestone.color}, ${milestone.color}dd)`
                                  : '#f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                {isFasting ? (
                                  <Flame size={18} color="#fff" />
                                ) : (
                                  <Users size={18} color="#999" />
                                )}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                                  {connection.display_name}
                                </div>
                                <div style={{ fontSize: 12, color: isFasting ? milestone.color : '#888' }}>
                                  {isFasting ? (
                                    <>
                                      {Math.floor(fastHours)}h {Math.floor((fastHours % 1) * 60)}m - {milestone.title}
                                    </>
                                  ) : (
                                    'Not fasting'
                                  )}
                                </div>
                              </div>
                              {isFasting && (
                                <div style={{
                                  padding: '4px 10px',
                                  background: `${milestone.color}20`,
                                  color: milestone.color,
                                  borderRadius: 12,
                                  fontSize: 11,
                                  fontWeight: 600,
                                }}>
                                  LIVE
                                </div>
                              )}
                              <button
                                onClick={async () => {
                                  if (user && confirm('Remove this connection?')) {
                                    await removeShareConnection(connection.connection_id, user.id);
                                    const connections = await getUserConnections(user.id);
                                    setUserConnections(connections);
                                  }
                                }}
                                style={{
                                  padding: '6px',
                                  background: 'transparent',
                                  color: '#999',
                                  border: 'none',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* My Shares Section */}
                  {userShares.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                      }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Link size={18} color="#8b5cf6" /> Active Shares
                        </h3>
                        <span style={{ fontSize: 12, color: '#888' }}>{userShares.length} link{userShares.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {userShares.slice(0, 3).map((share) => {
                          const shareUrl = `${window.location.origin}/share/${share.share_token}`;
                          const fastStart = share.fast ? new Date(share.fast.start_time) : null;
                          return (
                            <div key={share.id} style={{
                              background: '#fff',
                              borderRadius: 10,
                              padding: '12px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                                  {fastStart ? format(fastStart, 'MMM d, yyyy') : 'Fast'}
                                  {share.include_notes && <span style={{ color: '#8b5cf6', marginLeft: 6, fontSize: 11 }}>📝</span>}
                                </div>
                                <div style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span><Eye size={10} /> {share.view_count} view{share.view_count !== 1 ? 's' : ''}</span>
                                </div>
                              </div>
                              <button
                                onClick={async () => {
                                  await navigator.clipboard.writeText(shareUrl);
                                  setCopiedShareToken(share.share_token);
                                  setTimeout(() => setCopiedShareToken(null), 2000);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '6px 10px',
                                  background: copiedShareToken === share.share_token ? '#22c55e' : '#f0f0f0',
                                  color: copiedShareToken === share.share_token ? '#fff' : '#666',
                                  border: 'none',
                                  borderRadius: 6,
                                  fontSize: 11,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                }}
                              >
                                {copiedShareToken === share.share_token ? <Check size={12} /> : <Copy size={12} />}
                                {copiedShareToken === share.share_token ? 'Copied!' : 'Copy'}
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm('Delete this share link? Anyone with this link will no longer be able to view it.')) {
                                    const success = await deleteShare(share.id, user?.id || '');
                                    if (success) {
                                      setUserShares(shares => shares.filter(s => s.id !== share.id));
                                    }
                                  }
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '6px 8px',
                                  background: '#fee2e2',
                                  color: '#dc2626',
                                  border: 'none',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          );
                        })}
                        {userShares.length > 3 && (
                          <div style={{
                            padding: '10px',
                            textAlign: 'center',
                            color: '#888',
                            fontSize: 12,
                          }}>
                            +{userShares.length - 3} more shares
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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
                              onClick={(e) => {
                                e.stopPropagation();
                                setShareName(profile?.name || '');
                                setShareMode('choose');
                                setCopiedShareToken(null);
                                setShowShareModal(true);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '6px 12px',
                                background: '#f5f3ff',
                                color: '#7c3aed',
                                border: 'none',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <Share2 size={14} /> Share
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
                onClick={() => setShowProtocolSelect(true)}
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
                <Play size={24} /> Start Fast
              </button>
              <p style={{ color: '#999', fontSize: 13, marginTop: 16 }}>
                Choose from popular fasting protocols
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
              You've used your free 10 hours. Subscribe for unlimited fasting!
            </p>

            <div style={{
              background: 'rgba(34, 197, 94, 0.08)',
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 48, fontWeight: 800, color: '#16a34a' }}>$5</span>
                <span style={{ color: '#666', fontSize: 16 }}>/ 6 months</span>
              </div>
              <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
                Unlimited fasts with all features
              </p>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', textAlign: 'left' }}>
              {['Unlimited fasts for 6 months', 'Track 13 metabolic milestones', 'Journal your experience', 'Auto-renews for convenience'].map(item => (
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
              Subscribe - $5 / 6 months
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

      {/* Adjust Start Time Modal */}
      {showAdjustTime && currentFast && (() => {
        // Calculate the adjusted start time based on adjustHours (in minutes)
        const currentStartMs = new Date(currentFast.start_time).getTime();
        const adjustedStartMs = currentStartMs - (adjustHours * 60 * 1000); // adjustHours is actually minutes
        const adjustedStart = new Date(adjustedStartMs);
        const newElapsedMs = now - adjustedStartMs;
        const newElapsedHours = newElapsedMs / (1000 * 60 * 60);
        const diffHours = (adjustHours / 60);

        return (
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
                background: 'linear-gradient(135deg, #eab308, #ca8a04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <Edit3 size={36} color="#fff" />
              </div>

              <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800 }}>Fix Start Time</h2>
              <p style={{ color: '#666', marginBottom: 20, fontSize: 15 }}>
                Tap to adjust when you started
              </p>

              {/* Big time display that updates */}
              <div style={{
                background: adjustHours !== 0
                  ? (diffHours > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)')
                  : 'rgba(234, 179, 8, 0.1)',
                borderRadius: 16,
                padding: 24,
                marginBottom: 24,
              }}>
                <div style={{
                  fontSize: 42,
                  fontWeight: 800,
                  color: adjustHours !== 0
                    ? (diffHours > 0 ? '#16a34a' : '#dc2626')
                    : '#ca8a04',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {format(adjustedStart, 'h:mm a')}
                </div>
                <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                  {isToday(adjustedStart) ? 'Today' : isYesterday(adjustedStart) ? 'Yesterday' : format(adjustedStart, 'EEEE, MMM d')}
                </div>
                {adjustHours !== 0 && (
                  <div style={{
                    marginTop: 12,
                    fontSize: 16,
                    fontWeight: 700,
                    color: diffHours > 0 ? '#16a34a' : '#dc2626',
                  }}>
                    {diffHours > 0 ? '+' : ''}{diffHours.toFixed(1)}h → {Math.floor(newElapsedHours)}h {Math.floor((newElapsedHours % 1) * 60)}m fasted
                  </div>
                )}
              </div>

              {/* Time adjustment buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 24 }}>
                <button
                  onClick={() => setAdjustHours(prev => prev + 30)}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(34, 197, 94, 0.1)',
                    color: '#16a34a',
                    fontSize: 28,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ←
                </button>
                <div style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>
                  30 min<br/>per tap
                </div>
                <button
                  onClick={() => setAdjustHours(prev => prev - 30)}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#dc2626',
                    fontSize: 28,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  →
                </button>
              </div>

              {/* Reset button */}
              {adjustHours !== 0 && (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <button
                    onClick={() => setAdjustHours(0)}
                    style={{
                      padding: '8px 20px',
                      background: '#f5f5f5',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      color: '#666',
                      cursor: 'pointer',
                    }}
                  >
                    Reset
                  </button>
                </div>
              )}

              <button
                onClick={async () => {
                  if (!currentFast || adjustHours === 0) return;
                  try {
                    const updatedFast = await setFastStartTime(currentFast.id, adjustedStart);
                    if (updatedFast) {
                      setCurrentFast(updatedFast);
                      setShowAdjustTime(false);
                      setAdjustHours(0);
                    }
                  } catch (err) {
                    console.error('Failed to adjust start time:', err);
                  }
                }}
                disabled={adjustHours === 0}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: adjustHours !== 0 ? 'linear-gradient(135deg, #eab308, #ca8a04)' : '#ccc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: adjustHours !== 0 ? 'pointer' : 'not-allowed',
                  marginBottom: 10,
                }}
              >
                {adjustHours !== 0 ? `Set to ${format(adjustedStart, 'h:mm a')}` : 'Tap above to adjust'}
              </button>

              <button
                onClick={() => { setShowAdjustTime(false); setAdjustHours(0); }}
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
        );
      })()}

      {/* Protocol Selection Modal */}
      {showProtocolSelect && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
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
            maxWidth: 600,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Choose Your Fast</h2>
              <button
                onClick={() => setShowProtocolSelect(false)}
                style={{
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
            </div>

            <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>
              Select a fasting protocol that fits your goals. Each protocol has unique benefits.
            </p>

            <div style={{ display: 'grid', gap: 12 }}>
              {FASTING_PROTOCOLS.map(protocol => (
                <button
                  key={protocol.id}
                  onClick={() => handleStartFast(protocol.hours)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '16px 20px',
                    background: '#fff',
                    border: `2px solid ${protocol.color}20`,
                    borderRadius: 14,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = protocol.color;
                    e.currentTarget.style.background = `${protocol.color}08`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${protocol.color}20`;
                    e.currentTarget.style.background = '#fff';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: `${protocol.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <MilestoneIcon icon={protocol.icon} size={24} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{protocol.name}</span>
                        <span style={{
                          fontSize: 12,
                          padding: '2px 8px',
                          background: `${protocol.color}15`,
                          color: protocol.color,
                          borderRadius: 10,
                          fontWeight: 600,
                        }}>
                          {protocol.hours}h
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>{protocol.shortDesc}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {protocol.benefits.slice(0, 3).map((benefit, i) => (
                          <span key={i} style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            background: '#f5f5f5',
                            color: '#666',
                            borderRadius: 6,
                          }}>
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{
                      color: protocol.color,
                      fontWeight: 700,
                      fontSize: 24,
                      paddingLeft: 10,
                    }}>
                      →
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <p style={{ color: '#999', fontSize: 12, marginTop: 16, textAlign: 'center' }}>
              First 10 hours free • $5/6 months for unlimited fasting
            </p>
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
              <br />Subscribe for unlimited fasting.
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
                <span style={{ fontSize: 18, color: '#666' }}>/ 6 months</span>
              </div>
              <div style={{ fontSize: 14, color: '#888', marginTop: 8 }}>
                Unlimited fasts • Extend anytime • Full features
              </div>
            </div>

            <div style={{ marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 13, color: '#999', marginBottom: 12 }}>What you'll unlock:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Unlimited fasts for 6 months',
                  'All 13 metabolic milestones',
                  'Auto-renews for convenience',
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
              Subscribe - $5 / 6 months
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

      {/* Unified Share Modal */}
      {showShareModal && (
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
              marginBottom: 16,
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
                  <Users size={24} color="#fff" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                    {shareMode === 'link-done' ? 'Invite Created!' : 'Share With a Friend'}
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
                    {shareMode === 'link-done' ? 'Send this link to connect' : 'See each other\'s fasts live'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setCopiedShareToken(null);
                  setCreatedInviteCode(null);
                  setShareMode('choose');
                  setShareShowNetwork(false);
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


            {/* Choose Mode - show existing connections or redirect to link mode */}
            {shareMode === 'choose' && (
              <>
                {/* Show existing connections */}
                {userConnections.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, color: '#666', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Your Fasting Buddies
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                      {userConnections.slice(0, 4).map((connection) => (
                        <div
                          key={connection.connection_id}
                          style={{
                            padding: '10px 14px',
                            background: connection.current_fast ? 'linear-gradient(135deg, #22c55e, #16a34a)' : '#f0f0f0',
                            border: 'none',
                            borderRadius: 20,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            color: connection.current_fast ? '#fff' : '#666',
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          {connection.current_fast ? <Flame size={14} /> : <Users size={14} />}
                          {connection.display_name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Create new connection */}
                <div style={{
                  background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                  borderRadius: 16,
                  padding: 20,
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <Users size={28} color="#fff" />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 8 }}>
                    Share With a Friend
                  </div>
                  <div style={{ fontSize: 14, color: '#666', marginBottom: 16, lineHeight: 1.5 }}>
                    Create an invite link. When they accept, you'll both see each other's fasting progress live!
                  </div>
                  <button
                    onClick={() => {
                      setShareName(profile?.name || '');
                      setShareMode('link');
                    }}
                    style={{
                      padding: '14px 28px',
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 12,
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Plus size={18} />
                    Create Invite
                  </button>
                </div>
              </>
            )}

            {/* Connection Invite Created */}
            {shareMode === 'link-done' && createdInviteCode && (
              <>
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginBottom: 8 }}>
                    INVITE LINK READY
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                  }}>
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/connect/${createdInviteCode}`}
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
                      onClick={async () => {
                        await navigator.clipboard.writeText(`${window.location.origin}/connect/${createdInviteCode}`);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '10px 16px',
                        background: '#22c55e',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Check size={16} /> Copy
                    </button>
                  </div>
                </div>

                <p style={{ color: '#666', fontSize: 14, marginBottom: 16, textAlign: 'center' }}>
                  When they click this link and sign in, you'll both see each other's fasting progress!
                </p>

                {/* Quick share buttons */}
                <div style={{
                  display: 'flex',
                  gap: 10,
                  marginBottom: 16,
                }}>
                  <button
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/connect/${createdInviteCode}`;
                      const text = `Want to fast together? Accept my invite and we'll see each other's progress live!`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`, '_blank');
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      background: '#25D366',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/connect/${createdInviteCode}`;
                      const text = `Want to fast together? Accept my invite: ${shareUrl}`;
                      window.open(`sms:?body=${encodeURIComponent(text)}`, '_self');
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      background: '#333',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <MessageSquare size={18} />
                    SMS
                  </button>
                </div>

                {/* Native share button if available */}
                {'share' in navigator && (
                  <button
                    onClick={async () => {
                      const shareUrl = `${window.location.origin}/connect/${createdInviteCode}`;
                      try {
                        await navigator.share({
                          title: 'Fast Together',
                          text: `Want to fast together? Accept my invite and we'll see each other's progress live!`,
                          url: shareUrl,
                        });
                      } catch (e) {
                        // User cancelled or error
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    <Share2 size={18} />
                    More Options...
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setCreatedInviteCode(null);
                    setShareMode('choose');
                    setShareShowNetwork(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#f5f5f5',
                    color: '#666',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </>
            )}

            {/* Create Connection Invite Form */}
            {shareMode === 'link' && (
              <>
                {/* Explanation */}
                <div style={{
                  background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}>
                  <p style={{ margin: 0, fontSize: 14, color: '#5b21b6', lineHeight: 1.5 }}>
                    Create an invite link to share with a friend. Once they accept, you'll both see each other's fasting progress in real-time!
                  </p>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={shareName}
                    onChange={(e) => setShareName(e.target.value)}
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

                {/* Show Network Toggle - only if user has existing connections */}
                {userConnections.length > 0 && (
                  <button
                    onClick={() => setShareShowNetwork(!shareShowNetwork)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 16px',
                      background: shareShowNetwork ? 'rgba(139, 92, 246, 0.1)' : '#f5f5f5',
                      border: `2px solid ${shareShowNetwork ? 'rgba(139, 92, 246, 0.4)' : 'transparent'}`,
                      borderRadius: 12,
                      cursor: 'pointer',
                      marginBottom: 20,
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: shareShowNetwork ? '#8b5cf6' : '#ddd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}>
                      {shareShowNetwork && <Check size={16} color="#fff" />}
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>
                        Let them see your network
                      </div>
                      <div style={{ fontSize: 13, color: '#888' }}>
                        They'll also see {userConnections.length} other{userConnections.length !== 1 ? 's' : ''} you're sharing with
                      </div>
                    </div>
                    <Users size={20} color={shareShowNetwork ? '#8b5cf6' : '#bbb'} />
                  </button>
                )}

                <button
                  onClick={async () => {
                    if (!user || !shareName.trim()) return;

                    setIsCreatingShare(true);
                    try {
                      // Save name to profile if changed
                      if (shareName !== profile?.name) {
                        await updateUserProfile(user.id, { name: shareName });
                        await refreshProfile();
                      }

                      // Create connection invite
                      const connection = await createShareConnection(
                        user.id,
                        shareName.trim(),
                        shareShowNetwork
                      );

                      if (!connection) throw new Error('Failed to create invite');

                      // Copy invite link
                      const inviteUrl = `${window.location.origin}/connect/${connection.invite_code}`;
                      await navigator.clipboard.writeText(inviteUrl);

                      setCreatedInviteCode(connection.invite_code);
                      setShareMode('link-done');

                      // Refresh pending invites
                      const invites = await getPendingInvites(user.id);
                      setPendingInvites(invites);
                    } catch (e) {
                      console.error('Failed to create invite:', e);
                      alert('Failed to create invite link. Please try again.');
                    } finally {
                      setIsCreatingShare(false);
                    }
                  }}
                  disabled={!shareName.trim() || isCreatingShare}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: shareName.trim() && !isCreatingShare ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : '#e5e5e5',
                    color: shareName.trim() && !isCreatingShare ? '#fff' : '#999',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: shareName.trim() && !isCreatingShare ? 'pointer' : 'not-allowed',
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {isCreatingShare ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <Link size={18} /> Create Invite Link
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setShareShowNetwork(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
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
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
