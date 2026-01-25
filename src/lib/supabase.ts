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
  paid_until?: string; // ISO timestamp - subscription period end date
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
  confirmed_at?: string; // Last time user confirmed they're still fasting
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
    // Try to use the database function for public access (bypasses RLS)
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_shared_fast', { token: token });

    // The function returns an array of rows
    if (!rpcError && rpcData && rpcData.length > 0) {
      const row = rpcData[0];
      return {
        id: row.share_id,
        fasting_id: row.fasting_id,
        user_id: '', // Not returned by function
        start_time: row.start_time,
        end_time: row.end_time,
        target_hours: row.target_hours,
        completed: row.completed,
        sharer_name: row.sharer_name,
        include_notes: row.include_notes,
        view_count: row.view_count,
        share_token: token,
      };
    }

    // Fallback: try direct query (works if user is authenticated)
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
export async function getSharedFastNotes(shareToken: string, fastId?: string): Promise<SharedFastNote[]> {
  if (!supabase) return [];

  try {
    // Try RPC function first for public access
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_shared_fast_notes', { token: shareToken });

    if (!rpcError && rpcData && rpcData.length > 0) {
      return rpcData.map((row: { hour_mark: number; mood: string; energy_level: number; hunger_level: number; note?: string; created_at: string }) => ({
        id: '',
        fasting_id: fastId || '',
        hour_mark: row.hour_mark,
        mood: row.mood as SharedFastNote['mood'],
        energy_level: row.energy_level,
        hunger_level: row.hunger_level,
        note: row.note,
        created_at: row.created_at,
      }));
    }

    // Fallback: direct query (works if user is authenticated)
    if (fastId) {
      const { data, error } = await supabase
        .from('fasting_notes')
        .select('*')
        .eq('fasting_id', fastId)
        .order('hour_mark', { ascending: true });

      if (!error && data) return data;
    }

    return [];
  } catch (e) {
    console.error('Error fetching shared fast notes:', e);
    return [];
  }
}

// ============ SHARE GROUPS ============

export interface ShareGroup {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface ShareGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  display_name: string;
  include_notes: boolean;
  joined_at: string;
}

export interface GroupMemberWithFast extends ShareGroupMember {
  current_fast?: FastingSession;
  recent_fasts?: FastingSession[];
}

// Generate a random invite code for groups
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new fasting group
export async function createShareGroup(
  name: string,
  userId: string,
  displayName: string
): Promise<{ group: ShareGroup; membership: ShareGroupMember } | null> {
  if (!supabase) {
    console.error('createShareGroup: supabase not initialized');
    return null;
  }

  console.log('createShareGroup called:', { name, userId, displayName });

  try {
    const inviteCode = generateInviteCode();
    console.log('Generated invite code:', inviteCode);

    // Create the group
    const { data: group, error: groupError } = await supabase
      .from('share_groups')
      .insert({
        name,
        invite_code: inviteCode,
        created_by: userId,
      })
      .select()
      .single();

    console.log('Group insert result:', { group, groupError });

    if (groupError) throw groupError;

    // Add creator as first member
    const { data: membership, error: memberError } = await supabase
      .from('share_group_members')
      .insert({
        group_id: group.id,
        user_id: userId,
        display_name: displayName,
        include_notes: false,
      })
      .select()
      .single();

    console.log('Membership insert result:', { membership, memberError });

    if (memberError) throw memberError;

    return { group, membership };
  } catch (e) {
    console.error('Error creating share group:', e);
    return null;
  }
}

// Get group by invite code (for joining)
export async function getGroupByInviteCode(inviteCode: string): Promise<ShareGroup | null> {
  if (!supabase) return null;

  try {
    // Try RPC function first (bypasses RLS for public invite links)
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_group_by_invite_code', { code: inviteCode.toUpperCase() });

    if (!rpcError && rpcData && rpcData.length > 0) {
      return rpcData[0];
    }

    // Fallback: direct query (works if authenticated)
    const { data, error } = await supabase
      .from('share_groups')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (e) {
    console.error('Error fetching group by invite code:', e);
    return null;
  }
}

// Join a group
export async function joinShareGroup(
  groupId: string,
  userId: string,
  displayName: string,
  includeNotes: boolean = false
): Promise<ShareGroupMember | null> {
  if (!supabase) return null;

  try {
    // Check if already a member
    const { data: existing } = await supabase
      .from('share_group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (existing) return existing; // Already a member

    const { data, error } = await supabase
      .from('share_group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        display_name: displayName,
        include_notes: includeNotes,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (e) {
    console.error('Error joining group:', e);
    return null;
  }
}

// Leave a group
export async function leaveShareGroup(groupId: string, userId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('share_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Error leaving group:', e);
    return false;
  }
}

// Get all groups a user belongs to
export async function getUserGroups(userId: string): Promise<(ShareGroupMember & { group: ShareGroup })[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('share_group_members')
      .select(`
        *,
        group:share_groups (*)
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('Error fetching user groups:', e);
    return [];
  }
}

// Get all members of a group with their current fasts
export async function getGroupMembers(groupId: string): Promise<GroupMemberWithFast[]> {
  if (!supabase) return [];

  try {
    // Get all members
    const { data: members, error: memberError } = await supabase
      .from('share_group_members')
      .select('*')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    if (memberError) throw memberError;
    if (!members || members.length === 0) return [];

    // Get current/recent fasts for each member
    const userIds = members.map(m => m.user_id);

    const { data: fasts, error: fastsError } = await supabase
      .from('fasting_sessions')
      .select('*')
      .in('user_id', userIds)
      .order('start_time', { ascending: false });

    if (fastsError) throw fastsError;

    // Group fasts by user
    const fastsByUser: Record<string, FastingSession[]> = {};
    (fasts || []).forEach(fast => {
      if (!fastsByUser[fast.user_id]) fastsByUser[fast.user_id] = [];
      fastsByUser[fast.user_id].push(fast);
    });

    // Combine members with their fasts
    return members.map(member => {
      const userFasts = fastsByUser[member.user_id] || [];
      const currentFast = userFasts.find(f => !f.end_time);
      const recentFasts = userFasts.filter(f => f.end_time).slice(0, 3);

      return {
        ...member,
        current_fast: currentFast,
        recent_fasts: recentFasts,
      };
    });
  } catch (e) {
    console.error('Error fetching group members:', e);
    return [];
  }
}

// Get group details including members (for group view page)
export async function getGroupDetails(inviteCode: string): Promise<{
  group: ShareGroup;
  members: GroupMemberWithFast[];
} | null> {
  if (!supabase) return null;

  try {
    const group = await getGroupByInviteCode(inviteCode);
    if (!group) return null;

    const members = await getGroupMembers(group.id);
    return { group, members };
  } catch (e) {
    console.error('Error fetching group details:', e);
    return null;
  }
}

// Update member settings (display name, include notes)
export async function updateGroupMemberSettings(
  groupId: string,
  userId: string,
  settings: { display_name?: string; include_notes?: boolean }
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('share_group_members')
      .update(settings)
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Error updating member settings:', e);
    return false;
  }
}

// Delete a group (only creator can do this)
export async function deleteShareGroup(groupId: string, userId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    // Verify user is the creator
    const { data: group } = await supabase
      .from('share_groups')
      .select('created_by')
      .eq('id', groupId)
      .single();

    if (!group || group.created_by !== userId) {
      console.error('Only the group creator can delete the group');
      return false;
    }

    // Delete all members first
    await supabase
      .from('share_group_members')
      .delete()
      .eq('group_id', groupId);

    // Delete the group
    const { error } = await supabase
      .from('share_groups')
      .delete()
      .eq('id', groupId);

    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Error deleting group:', e);
    return false;
  }
}

// Community fasts - get all active fasts from all users
export interface CommunityFast {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  start_time: string;
  target_hours: number;
}

export async function getCommunityFasts(): Promise<CommunityFast[]> {
  if (!supabase) return [];

  try {
    // Use RPC function to bypass RLS and get user details
    const { data, error } = await supabase.rpc('get_community_fasts');

    if (error) {
      console.error('RPC error, falling back to direct query:', error);
      // Fallback to direct query (won't have names due to RLS)
      const { data: fasts, error: fastsError } = await supabase
        .from('fasting_sessions')
        .select('id, user_id, start_time, target_hours')
        .is('end_time', null)
        .order('start_time', { ascending: false });

      if (fastsError) throw fastsError;
      return (fasts || []).map(fast => ({
        id: fast.id,
        user_id: fast.user_id,
        user_name: 'Faster',
        user_email: '',
        start_time: fast.start_time,
        target_hours: fast.target_hours || 24,
      }));
    }

    return (data || []).map((fast: any) => ({
      id: fast.id,
      user_id: fast.user_id,
      user_name: fast.user_name || 'Faster',
      user_email: fast.user_email || '',
      start_time: fast.start_time,
      target_hours: fast.target_hours || 24,
    }));
  } catch (e) {
    console.error('Error fetching community fasts:', e);
    return [];
  }
}

// ============ SHARE CONNECTIONS (1-to-1 Reciprocal Sharing) ============

export interface ShareConnection {
  id: string;
  user_a: string;
  user_b: string | null;
  invite_code: string;
  display_name_a: string;
  display_name_b: string | null;
  show_network_to_b: boolean;
  created_at: string;
  accepted_at: string | null;
}

export interface ConnectionWithFast {
  connection_id: string;
  connected_user_id: string;
  display_name: string;
  is_initiator: boolean;
  show_network: boolean;
  connected_at: string;
  current_fast?: {
    id: string;
    start_time: string;
    target_hours: number;
  };
}

// Generate a random invite code for connections
function generateConnectionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new share connection invite
export async function createShareConnection(
  userId: string,
  displayName: string,
  showNetworkToB: boolean = false
): Promise<ShareConnection | null> {
  if (!supabase) return null;

  try {
    const inviteCode = generateConnectionCode();

    const { data, error } = await supabase
      .from('share_connections')
      .insert({
        user_a: userId,
        invite_code: inviteCode,
        display_name_a: displayName,
        show_network_to_b: showNetworkToB,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (e) {
    console.error('Error creating share connection:', e);
    return null;
  }
}

// Get connection by invite code (for accepting)
export async function getConnectionByInviteCode(inviteCode: string): Promise<ShareConnection | null> {
  if (!supabase) return null;

  try {
    // Try RPC function first (for public access)
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_connection_by_invite_code', { code: inviteCode.toUpperCase() });

    if (!rpcError && rpcData && rpcData.length > 0) {
      return rpcData[0];
    }

    // Fallback: direct query
    const { data, error } = await supabase
      .from('share_connections')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (e) {
    console.error('Error fetching connection:', e);
    return null;
  }
}

// Accept a share connection invite
export async function acceptShareConnection(
  inviteCode: string,
  userId: string,
  displayName: string
): Promise<ShareConnection | null> {
  if (!supabase) return null;

  try {
    // Try RPC function first
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('accept_share_connection', {
        p_invite_code: inviteCode.toUpperCase(),
        p_user_id: userId,
        p_display_name: displayName,
      });

    if (!rpcError && rpcData && rpcData.length > 0) {
      return rpcData[0];
    }

    // Fallback: manual update
    const connection = await getConnectionByInviteCode(inviteCode);
    if (!connection) throw new Error('Connection not found');
    if (connection.user_b) throw new Error('Connection already accepted');
    if (connection.user_a === userId) throw new Error('Cannot accept your own invite');

    const { data, error } = await supabase
      .from('share_connections')
      .update({
        user_b: userId,
        display_name_b: displayName,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', connection.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (e) {
    console.error('Error accepting share connection:', e);
    return null;
  }
}

// Get all connections for a user (accepted only)
export async function getUserConnections(userId: string): Promise<ConnectionWithFast[]> {
  if (!supabase) return [];

  try {
    // Try RPC function for optimized query with fasts
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_user_connections_with_fasts', { p_user_id: userId });

    if (!rpcError && rpcData) {
      return rpcData.map((row: {
        connection_id: string;
        connected_user_id: string;
        display_name: string;
        is_initiator: boolean;
        show_network: boolean;
        connected_at: string;
        current_fast_id?: string;
        current_fast_start?: string;
        current_fast_target?: number;
      }) => ({
        connection_id: row.connection_id,
        connected_user_id: row.connected_user_id,
        display_name: row.display_name,
        is_initiator: row.is_initiator,
        show_network: row.show_network,
        connected_at: row.connected_at,
        current_fast: row.current_fast_id ? {
          id: row.current_fast_id,
          start_time: row.current_fast_start!,
          target_hours: row.current_fast_target!,
        } : undefined,
      }));
    }

    // Fallback: manual query
    const { data: connections, error } = await supabase
      .from('share_connections')
      .select('*')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .not('accepted_at', 'is', null);

    if (error) throw error;
    if (!connections || connections.length === 0) return [];

    // Get current fasts for connected users
    const connectedUserIds = connections.map(c =>
      c.user_a === userId ? c.user_b : c.user_a
    ).filter(Boolean);

    const { data: fasts } = await supabase
      .from('fasting_sessions')
      .select('id, user_id, start_time, target_hours')
      .in('user_id', connectedUserIds)
      .is('end_time', null);

    const fastsByUser: Record<string, { id: string; start_time: string; target_hours: number }> = {};
    (fasts || []).forEach(f => {
      fastsByUser[f.user_id] = f;
    });

    return connections.map(c => {
      const isInitiator = c.user_a === userId;
      const connectedUserId = isInitiator ? c.user_b : c.user_a;
      return {
        connection_id: c.id,
        connected_user_id: connectedUserId!,
        display_name: isInitiator ? c.display_name_b! : c.display_name_a,
        is_initiator: isInitiator,
        show_network: isInitiator || c.show_network_to_b,
        connected_at: c.accepted_at!,
        current_fast: connectedUserId ? fastsByUser[connectedUserId] : undefined,
      };
    });
  } catch (e) {
    console.error('Error fetching user connections:', e);
    return [];
  }
}

// Get pending invites (sent but not yet accepted)
export async function getPendingInvites(userId: string): Promise<ShareConnection[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('share_connections')
      .select('*')
      .eq('user_a', userId)
      .is('user_b', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('Error fetching pending invites:', e);
    return [];
  }
}

// Remove a share connection
export async function removeShareConnection(connectionId: string, userId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('share_connections')
      .delete()
      .eq('id', connectionId)
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);

    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Error removing share connection:', e);
    return false;
  }
}

// Get network connections (people connected to someone I'm connected with, if allowed)
export async function getNetworkConnections(
  userId: string,
  throughUserId: string
): Promise<ConnectionWithFast[]> {
  if (!supabase) return [];

  try {
    // First check if I have permission to see this user's network
    const { data: myConnection } = await supabase
      .from('share_connections')
      .select('*')
      .or(`and(user_a.eq.${throughUserId},user_b.eq.${userId}),and(user_a.eq.${userId},user_b.eq.${throughUserId})`)
      .not('accepted_at', 'is', null)
      .single();

    if (!myConnection) return [];

    // Check if I can see their network
    const canSeeNetwork = myConnection.user_a === userId ||
      (myConnection.user_b === userId && myConnection.show_network_to_b);

    if (!canSeeNetwork) return [];

    // Get their other connections
    const { data: theirConnections } = await supabase
      .from('share_connections')
      .select('*')
      .or(`user_a.eq.${throughUserId},user_b.eq.${throughUserId}`)
      .not('accepted_at', 'is', null)
      .neq('id', myConnection.id);

    if (!theirConnections || theirConnections.length === 0) return [];

    // Get fasts for those users
    const networkUserIds = theirConnections.map(c =>
      c.user_a === throughUserId ? c.user_b : c.user_a
    ).filter(id => id !== userId);

    const { data: fasts } = await supabase
      .from('fasting_sessions')
      .select('id, user_id, start_time, target_hours')
      .in('user_id', networkUserIds)
      .is('end_time', null);

    const fastsByUser: Record<string, { id: string; start_time: string; target_hours: number }> = {};
    (fasts || []).forEach(f => {
      fastsByUser[f.user_id] = f;
    });

    return theirConnections
      .filter(c => {
        const connectedId = c.user_a === throughUserId ? c.user_b : c.user_a;
        return connectedId !== userId;
      })
      .map(c => {
        const connectedUserId = c.user_a === throughUserId ? c.user_b! : c.user_a;
        const displayName = c.user_a === throughUserId ? c.display_name_b! : c.display_name_a;
        return {
          connection_id: c.id,
          connected_user_id: connectedUserId,
          display_name: displayName,
          is_initiator: false,
          show_network: false,
          connected_at: c.accepted_at!,
          current_fast: fastsByUser[connectedUserId],
        };
      });
  } catch (e) {
    console.error('Error fetching network connections:', e);
    return [];
  }
}

// Set start time directly (for time picker)
export async function setFastStartTime(fastId: string, newStartTime: Date): Promise<FastingSession | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('fasting_sessions')
    .update({
      start_time: newStartTime.toISOString(),
    })
    .eq('id', fastId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Confirm that user is still fasting (for long fasts)
export async function confirmFast(fastId: string): Promise<FastingSession | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('fasting_sessions')
    .update({
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', fastId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
