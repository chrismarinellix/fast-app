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
    // Set up auth state change listener to catch INITIAL_SESSION
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event);
      if (event === 'INITIAL_SESSION') {
        if (newSession) {
          console.log('Got initial session from storage');
          await handleSession(newSession);
        }
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await handleSession(newSession);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        await handleSession(null);
        setLoading(false);
      }
    });

    // Check for URL tokens (magic link / OAuth callback)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const searchParams = new URLSearchParams(window.location.search);
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const code = searchParams.get('code');

    // Process URL tokens if present
    const processUrlTokens = async () => {
      if (accessToken && refreshToken) {
        console.log('Found tokens in URL hash');
        try {
          const { data, error } = await withTimeout(
            supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            }),
            5000
          );

          if (error) {
            console.error('Error setting session:', error);
          } else if (data.session) {
            await handleSession(data.session);
            window.history.replaceState({}, '', window.location.pathname);
          }
        } catch (e) {
          console.error('setSession timeout:', e);
        }
        setLoading(false);
        return true;
      }

      if (code) {
        console.log('Found auth code in URL');
        try {
          const { data, error } = await withTimeout(
            supabase.auth.exchangeCodeForSession(code),
            5000
          );

          if (error) {
            console.error('Error exchanging code:', error);
          } else if (data.session) {
            await handleSession(data.session);
            window.history.replaceState({}, '', window.location.pathname);
          }
        } catch (e) {
          console.error('exchangeCodeForSession timeout:', e);
        }
        setLoading(false);
        return true;
      }

      return false;
    };

    processUrlTokens();

    // Fallback timeout in case INITIAL_SESSION doesn't fire
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => {
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
