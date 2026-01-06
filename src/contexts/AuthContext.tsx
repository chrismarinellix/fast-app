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
    setSession(newSession);
    setUser(newSession?.user ?? null);

    if (newSession) {
      try {
        // Load or create profile with timeout to prevent freezing
        const existingProfile = await withTimeout(
          getUserProfile(newSession.user.id),
          5000
        );

        if (!existingProfile) {
          console.log('Creating new profile for user:', newSession.user.id);
          const { error } = await supabase
            .from('profiles')
            .insert({
              id: newSession.user.id,
              email: newSession.user.email,
              subscription_status: 'free',
              fasts_completed: 0,
            });

          if (!error) {
            const newProfile = await withTimeout(
              getUserProfile(newSession.user.id),
              5000
            );
            setProfile(newProfile);
          } else {
            console.error('Error creating profile:', error);
          }
        } else {
          console.log('Loaded existing profile');
          setProfile(existingProfile);
        }
      } catch (e) {
        console.error('Profile operation timed out or failed:', e);
        // Still allow user to proceed - profile will load on refresh
      }
    } else {
      setProfile(null);
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
