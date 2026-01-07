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

export interface FastShare {
  id: string;
  fasting_id: string;
  user_id: string;
  share_token: string;
  sharer_name?: string;
  include_notes: boolean;
  view_count: number;
  created_at: string;
}

export interface SharedFastData {
  share_id: string;
  fasting_id: string;
  sharer_name?: string;
  include_notes: boolean;
  view_count: number;
  start_time: string;
  end_time?: string;
  target_hours: number;
  completed: boolean;
}

export interface SharedFastNote {
  hour_mark: number;
  mood: string;
  energy_level: number;
  hunger_level: number;
  note?: string;
  created_at: string;
}

// Auth functions
export async function signInWithEmail(email: string) {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/dashboard`,
    },
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

// =====================================================
// SHARE FUNCTIONS
// =====================================================

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
export async function createFastShare(
  fastId: string,
  userId: string,
  sharerName?: string,
  includeNotes: boolean = false
): Promise<FastShare | null> {
  if (!supabase) return null;

  // Check if share already exists for this fast
  const { data: existing } = await supabase
    .from('fast_shares')
    .select('*')
    .eq('fasting_id', fastId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Update existing share settings
    const { data, error } = await supabase
      .from('fast_shares')
      .update({
        sharer_name: sharerName,
        include_notes: includeNotes,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Create new share
  const { data, error } = await supabase
    .from('fast_shares')
    .insert({
      fasting_id: fastId,
      user_id: userId,
      share_token: generateShareToken(),
      sharer_name: sharerName,
      include_notes: includeNotes,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get share for a fast (for the owner)
export async function getFastShare(fastId: string): Promise<FastShare | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('fast_shares')
    .select('*')
    .eq('fasting_id', fastId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching share:', error);
  }

  return data || null;
}

// Get shared fast data by token (public, no auth required)
export async function getSharedFast(token: string): Promise<SharedFastData | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('get_shared_fast', { token });

  if (error) {
    console.error('Error fetching shared fast:', error);
    return null;
  }

  return data?.[0] || null;
}

// Get notes for a shared fast (public, only if include_notes is true)
export async function getSharedFastNotes(token: string): Promise<SharedFastNote[]> {
  if (!supabase) return [];

  const { data, error } = await supabase.rpc('get_shared_fast_notes', { token });

  if (error) {
    console.error('Error fetching shared fast notes:', error);
    return [];
  }

  return data || [];
}

// Delete a share
export async function deleteFastShare(shareId: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('fast_shares')
    .delete()
    .eq('id', shareId);

  if (error) throw error;
}
