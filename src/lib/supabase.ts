import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Types
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  subscription_status: 'free' | 'active' | 'cancelled' | 'expired';
  subscription_plan?: 'monthly' | 'yearly';
  stripe_customer_id?: string;
  fasts_completed: number;
  created_at: string;
}

export interface FastingSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  target_hours: number;
  completed: boolean;
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
    .select('*')
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

// Check if user can start a new fast (subscription check)
export async function canStartFast(profile: UserProfile): Promise<boolean> {
  // Free users can do 1 fast
  if (profile.subscription_status === 'free') {
    return profile.fasts_completed < 1;
  }
  // Active subscribers can fast unlimited
  return profile.subscription_status === 'active';
}
