import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mlimixgmnkhjgjutoncr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saW1peGdtbmtoamdqdXRvbmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1Mjc4MTUsImV4cCI6MjA4MzEwMzgxNX0.TBA1t7832cxQ19_Xob0-dfj2gMrcTVj54M5K05A3Lm4';

// Create client with session persistence enabled so users stay logged in
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'fast-app-auth',
  },
});

// Helper to run async operation with timeout
export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

// Types
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  subscription_status: 'free' | 'active' | 'cancelled' | 'expired';
  subscription_plan?: 'monthly' | 'yearly';
  stripe_customer_id?: string;
  fasts_completed: number;
  paid_until?: string; // ISO timestamp - $5 gives 200 days of unlimited fasts
  created_at: string;
}

export interface FastingSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  target_hours: number;
  completed: boolean;
  paid: boolean; // Whether $5 has been paid for this fast
  notes?: FastingNote[];
}

export interface FastingNote {
  id: string;
  fasting_id: string;
  hour_mark: number;
  mood: 'great' | 'good' | 'okay' | 'tough' | 'difficult';
  energy_level: number;
  hunger_level: number;
  note?: string;
  created_at: string;
}

// Auth functions
export async function signUpWithPassword(email: string, password: string) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signInWithPassword(email: string, password: string) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function resetPassword(email: string) {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
  return true;
}

export async function signInWithGoogle() {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });

  if (error) throw error;
}

export async function signOut() {
  if (!supabase) throw new Error('Supabase not configured');
  await supabase.auth.signOut();
}

// User profile functions
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Fasting functions
export async function getCurrentFast(userId: string): Promise<FastingSession | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('fasting_sessions')
    .select('*')
    .eq('user_id', userId)
    .is('end_time', null)
    .order('start_time', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching current fast:', error);
  }

  return data || null;
}

export async function startFast(userId: string, targetHours: number = 24): Promise<FastingSession | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('fasting_sessions')
    .insert({
      user_id: userId,
      target_hours: targetHours,
      start_time: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function endFast(fastId: string, completed: boolean): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('fasting_sessions')
    .update({
      end_time: new Date().toISOString(),
      completed,
    })
    .eq('id', fastId);

  if (error) throw error;
}

export async function getFastingHistory(userId: string): Promise<FastingSession[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('fasting_sessions')
    .select(`
      *,
      notes:fasting_notes(*)
    `)
    .eq('user_id', userId)
    .not('end_time', 'is', null)
    .order('start_time', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }

  return data || [];
}

export async function addFastingNote(note: Omit<FastingNote, 'id' | 'created_at'>): Promise<FastingNote | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('fasting_notes')
    .insert(note)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getFastingNotes(fastingId: string): Promise<FastingNote[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('fasting_notes')
    .select('*')
    .eq('fasting_id', fastingId)
    .order('hour_mark', { ascending: true });

  if (error) {
    console.error('Error fetching notes:', error);
    return [];
  }

  return data || [];
}

// Check if user can start a new fast
export async function canStartFast(profile: UserProfile): Promise<boolean> {
  // Check if user has paid access (paid_until in the future)
  if (profile.paid_until && new Date(profile.paid_until) > new Date()) {
    return true; // Paid users can fast unlimited
  }
  // Free users can do 1 fast
  if (profile.subscription_status === 'free') {
    return profile.fasts_completed < 1;
  }
  // Active subscribers can fast unlimited
  return profile.subscription_status === 'active';
}

// Mark a fast as paid
export async function markFastPaid(fastId: string): Promise<FastingSession | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('fasting_sessions')
    .update({ paid: true })
    .eq('id', fastId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Extend a fast by adding hours to the target
export async function extendFast(fastId: string, additionalHours: number): Promise<FastingSession | null> {
  if (!supabase) return null;

  // First get the current fast
  const { data: currentFast, error: fetchError } = await supabase
    .from('fasting_sessions')
    .select('*')
    .eq('id', fastId)
    .single();

  if (fetchError || !currentFast) {
    console.error('Error fetching fast:', fetchError);
    return null;
  }

  // Update with new target hours
  const { data, error } = await supabase
    .from('fasting_sessions')
    .update({
      target_hours: currentFast.target_hours + additionalHours,
    })
    .eq('id', fastId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Adjust the start time of a fast (backdate it)
export async function adjustFastStartTime(fastId: string, hoursBack: number): Promise<FastingSession | null> {
  if (!supabase) return null;

  // First get the current fast
  const { data: currentFast, error: fetchError } = await supabase
    .from('fasting_sessions')
    .select('*')
    .eq('id', fastId)
    .single();

  if (fetchError || !currentFast) {
    console.error('Error fetching fast:', fetchError);
    return null;
  }

  // Calculate new start time
  const currentStart = new Date(currentFast.start_time);
  const newStart = new Date(currentStart.getTime() - (hoursBack * 60 * 60 * 1000));

  // Update with new start time
  const { data, error } = await supabase
    .from('fasting_sessions')
    .update({
      start_time: newStart.toISOString(),
    })
    .eq('id', fastId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============ SHARING ============

export interface FastShare {
  id: string;
  fasting_id: string;
  user_id: string;
  share_token: string;
  sharer_name: string;
  include_notes: boolean;
  view_count: number;
  created_at: string;
}

export interface SharedFastData {
  id: string;
  fasting_id: string;
  user_id: string;
  sharer_name: string;
  start_time: string;
  end_time?: string;
  target_hours: number;
  completed: boolean;
  include_notes: boolean;
  view_count: number;
  share_token: string;
}

export interface SharedFastNote {
  id: string;
  fasting_id: string;
  hour_mark: number;
  mood: 'great' | 'good' | 'okay' | 'tough' | 'difficult';
  energy_level: number;
  hunger_level: number;
  note?: string;
  created_at: string;
}

// Generate a random share token
function generateShareToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Create a share link for a fast
export async function createShare(
  fastId: string,
  userId: string,
  sharerName: string,
  includeNotes: boolean
): Promise<FastShare | null> {
  if (!supabase) return null;

  try {
    const shareToken = generateShareToken();

    const { data, error } = await supabase
      .from('fast_shares')
      .insert({
        fasting_id: fastId,
        user_id: userId,
        share_token: shareToken,
        sharer_name: sharerName,
        include_notes: includeNotes,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (e) {
    console.error('Error creating share:', e);
    return null;
  }
}

// Get all shares for a user
export async function getUserShares(userId: string): Promise<(FastShare & { fast?: FastingSession })[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('fast_shares')
      .select(`
        *,
        fast:fasting_sessions (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('Error fetching user shares:', e);
    return [];
  }
}

// Delete a share
export async function deleteShare(shareId: string, userId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('fast_shares')
      .delete()
      .eq('id', shareId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Error deleting share:', e);
    return false;
  }
}

// Check if a fast already has a share for this user
export async function getExistingShare(fastId: string, userId: string): Promise<FastShare | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('fast_shares')
      .select('*')
      .eq('fasting_id', fastId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (e) {
    console.error('Error checking existing share:', e);
    return null;
  }
}

// Get a shared fast by share token (public access)
export async function getSharedFast(token: string): Promise<SharedFastData | null> {
  if (!supabase) return null;

  try {
    // First try to find in fast_shares table (new way)
    const { data: shareData, error: shareError } = await supabase
      .from('fast_shares')
      .select(`
        id, fasting_id, user_id, share_token, sharer_name, include_notes, view_count, created_at,
        fast:fasting_sessions (id, user_id, start_time, end_time, target_hours, completed)
      `)
      .eq('share_token', token)
      .single();

    if (!shareError && shareData && shareData.fast) {
      // Increment view count
      await supabase
        .from('fast_shares')
        .update({ view_count: (shareData.view_count || 0) + 1 })
        .eq('id', shareData.id);

      const fastData = shareData.fast as unknown as {
        id: string;
        user_id: string;
        start_time: string;
        end_time?: string;
        target_hours: number;
        completed: boolean;
      } | Array<{
        id: string;
        user_id: string;
        start_time: string;
        end_time?: string;
        target_hours: number;
        completed: boolean;
      }>;
      const fast = Array.isArray(fastData) ? fastData[0] : fastData;

      return {
        id: shareData.id,
        fasting_id: fast.id,
        user_id: fast.user_id,
        start_time: fast.start_time,
        end_time: fast.end_time,
        target_hours: fast.target_hours,
        completed: fast.completed,
        sharer_name: shareData.sharer_name,
        include_notes: shareData.include_notes,
        view_count: shareData.view_count + 1,
        share_token: shareData.share_token,
      };
    }

    // Fallback: check if token is a direct fast ID (backwards compatibility)
    const { data: directFast, error: directError } = await supabase
      .from('fasting_sessions')
      .select(`
        id, user_id, start_time, end_time, target_hours, completed,
        profiles:user_id (name)
      `)
      .eq('id', token)
      .single();

    if (directError || !directFast) return null;

    const profileData = directFast.profiles as { name?: string } | { name?: string }[] | null;
    const sharerName = Array.isArray(profileData)
      ? profileData[0]?.name
      : profileData?.name;

    return {
      id: token,
      fasting_id: directFast.id,
      user_id: directFast.user_id,
      start_time: directFast.start_time,
      end_time: directFast.end_time,
      target_hours: directFast.target_hours,
      completed: directFast.completed,
      sharer_name: sharerName || 'Someone',
      include_notes: true, // Legacy shares show notes
      view_count: 0,
      share_token: token,
    };
  } catch (e) {
    console.error('Error fetching shared fast:', e);
    return null;
  }
}

// Get notes for a shared fast (public access)
export async function getSharedFastNotes(fastId: string): Promise<SharedFastNote[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('fasting_notes')
      .select('*')
      .eq('fasting_id', fastId)
      .order('hour_mark', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('Error fetching shared fast notes:', e);
    return [];
  }
}
