import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, withTimeout, getUserProfile, type UserProfile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await getUserProfile(user.id);
      setProfile(userProfile);
    }
  };

  const handleSession = async (newSession: Session | null) => {
    console.log('handleSession called, session:', !!newSession);
    setSession(newSession);
    setUser(newSession?.user ?? null);

    if (newSession) {
      // Load profile in background - don't block auth
      loadProfileInBackground(newSession.user.id, newSession.user.email || '');
    } else {
      setProfile(null);
    }
  };

  const loadProfileInBackground = async (userId: string, email: string) => {
    try {
      console.log('Loading profile for:', userId);
      const existingProfile = await withTimeout(getUserProfile(userId), 3000);

      if (existingProfile) {
        console.log('Profile loaded');
        setProfile(existingProfile);
      } else {
        console.log('No profile found, creating...');
        // Try to create profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: email,
            subscription_status: 'free',
            fasts_completed: 0,
          });

        if (!error) {
          const newProfile = await withTimeout(getUserProfile(userId), 3000);
          setProfile(newProfile);
        } else if (error.code === '23505') {
          // Profile already exists (race condition), fetch it
          const existingProfile = await withTimeout(getUserProfile(userId), 3000);
          setProfile(existingProfile);
        } else {
          console.error('Error creating profile:', error);
        }
      }
    } catch (e) {
      console.error('Profile load failed:', e);
      // Create a minimal profile so user can proceed
      setProfile({
        id: userId,
        email: email,
        subscription_status: 'free',
        fasts_completed: 0,
        created_at: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state change listener - Supabase handles URL tokens automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event);

      if (!mounted) return;

      // Handle all auth events
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (newSession) {
          await handleSession(newSession);
        }
        setLoading(false);
        // Clean URL after successful auth
        if (window.location.hash || window.location.search.includes('code=')) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      } else if (event === 'SIGNED_OUT') {
        await handleSession(null);
        setLoading(false);
      }
    });

    // Fallback: if no auth event fires within 2 seconds, stop loading
    const timeout = setTimeout(() => {
      if (mounted) {
        console.log('Auth timeout - stopping loading');
        setLoading(false);
      }
    }, 2000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
