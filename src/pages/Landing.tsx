import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame, Brain, Zap, Heart, Sparkles, Clock,
  Check, ArrowRight, Star, Shield, Users,
  TrendingUp, Award
} from 'lucide-react';
import { signInWithPassword, signUpWithPassword, signInWithGoogle } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const MILESTONES = [
  { hour: 12, title: 'Ketosis', desc: 'Your body starts burning fat for fuel', icon: Flame, color: '#ef4444' },
  { hour: 14, title: 'Autophagy', desc: 'Cellular cleanup begins', icon: Sparkles, color: '#10b981' },
  { hour: 16, title: 'Deep Repair', desc: 'Damaged cells recycled', icon: Zap, color: '#8b5cf6' },
  { hour: 24, title: 'Full Reset', desc: 'Maximum metabolic benefits', icon: Award, color: '#22c55e' },
];

const TESTIMONIALS = [
  { name: 'Sarah M.', text: 'Fast! made intermittent fasting so much easier. The milestone tracking keeps me motivated!', stars: 5 },
  { name: 'James K.', text: 'Finally completed my first 24-hour fast. The progress tracking and education really helped.', stars: 5 },
  { name: 'Emily R.', text: 'Love the journal feature. Being able to track how I feel helps me understand my body better.', stars: 5 },
];

const FEATURES = [
  { icon: Clock, title: 'Real-time Tracking', desc: 'Watch your progress with live countdown and elapsed time' },
  { icon: Sparkles, title: 'Milestone Markers', desc: 'Learn what happens in your body at each stage' },
  { icon: Heart, title: 'Journal Entries', desc: 'Log how you feel with mood, energy and hunger tracking' },
  { icon: TrendingUp, title: 'Progress History', desc: 'See your fasting journey over time' },
  { icon: Brain, title: 'Science-backed Info', desc: 'Understand the benefits of each fasting phase' },
  { icon: Shield, title: 'Privacy First', desc: 'Your data is encrypted and never shared' },
];

export function Landing() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard');
    return null;
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#fafafa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
      }}>
        <Flame size={48} color="#22c55e" />
        <div style={{ fontSize: 24, fontWeight: 700 }}>Fast!</div>
        <div style={{ color: '#999', fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        const result = await signUpWithPassword(email.trim(), password.trim());
        if (result.user && !result.session) {
          // Email confirmation required
          setSuccess('Check your email to confirm your account, then sign in.');
          setIsSignUp(false);
        }
      } else {
        await signInWithPassword(email.trim(), password.trim());
        // Auth context will handle redirect
      }
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Try again or create an account.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please check your email and confirm your account first.');
      } else {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Flame size={32} color="#22c55e" />
          <span style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a' }}>Fast!</span>
        </div>
        {/* Desktop nav */}
        <nav className="desktop-nav" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <a href="#features" style={{ color: '#666', textDecoration: 'none', fontSize: 14 }}>Features</a>
          <a href="#pricing" style={{ color: '#666', textDecoration: 'none', fontSize: 14 }}>Pricing</a>
          <a href="#signup" style={{ color: '#666', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Login</a>
          <a href="#signup" style={{
            padding: '10px 20px',
            background: '#22c55e',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
          }}>Sign Up Free</a>
        </nav>
        {/* Mobile nav */}
        <div className="mobile-show" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="#signup" style={{ color: '#666', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Login</a>
          <a href="#signup" style={{
            padding: '8px 16px',
            background: '#22c55e',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
          }}>Sign Up</a>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        padding: '80px 24px',
        textAlign: 'center',
        maxWidth: 900,
        margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-block',
          padding: '8px 16px',
          background: 'rgba(34, 197, 94, 0.1)',
          borderRadius: 20,
          fontSize: 14,
          color: '#16a34a',
          fontWeight: 500,
          marginBottom: 24,
        }}>
          Your fasting companion
        </div>

        <h1 style={{
          fontSize: 'clamp(40px, 8vw, 72px)',
          fontWeight: 800,
          lineHeight: 1.1,
          margin: '0 0 24px',
          color: '#1a1a1a',
        }}>
          Transform your health with<br />
          <span style={{ color: '#22c55e' }}>intermittent fasting</span>
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 2.5vw, 20px)',
          color: '#666',
          maxWidth: 600,
          margin: '0 auto 40px',
          lineHeight: 1.6,
        }}>
          Track your fasts, understand what's happening in your body, and build a sustainable fasting practice with science-backed guidance.
        </p>

        {/* CTA Form */}
        <div id="signup" style={{
          background: '#fff',
          padding: 32,
          borderRadius: 16,
          maxWidth: 400,
          margin: '0 auto',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>
              {isSignUp ? 'Create your account' : 'Sign in'}
            </h3>

            {error && (
              <div style={{
                padding: 12,
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 8,
                color: '#dc2626',
                fontSize: 14,
                marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                padding: 12,
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: 8,
                color: '#16a34a',
                fontSize: 14,
                marginBottom: 16,
              }}>
                {success}
              </div>
            )}

            <form onSubmit={handleEmailSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e5e5e5',
                  borderRadius: 10,
                  fontSize: 16,
                  marginBottom: 12,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                disabled={loading}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e5e5e5',
                  borderRadius: 10,
                  fontSize: 16,
                  marginBottom: 16,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  background: loading || !email.trim() || !password.trim() ? '#ccc' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: loading || !email.trim() || !password.trim() ? 'not-allowed' : 'pointer',
                  boxShadow: loading || !email.trim() || !password.trim() ? 'none' : '0 4px 14px rgba(34, 197, 94, 0.3)',
                }}
              >
                {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <p style={{ margin: '16px 0', fontSize: 14, color: '#666', textAlign: 'center' }}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setSuccess(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#22c55e',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: 14,
                }}
              >
                {isSignUp ? 'Sign in' : 'Create one'}
              </button>
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              margin: '20px 0',
            }}>
              <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
              <span style={{ color: '#999', fontSize: 12 }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 24px',
                background: '#fff',
                color: '#333',
                border: '2px solid #e5e5e5',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
        </div>

        {/* Social proof */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          marginTop: 40,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={20} color="#666" />
            <span style={{ color: '#666', fontSize: 14 }}>1,000+ fasters</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={20} color="#fbbf24" fill="#fbbf24" />
            <span style={{ color: '#666', fontSize: 14 }}>4.9/5 rating</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={20} color="#666" />
            <span style={{ color: '#666', fontSize: 14 }}>100% secure</span>
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section style={{
        padding: '80px 24px',
        background: '#fff',
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 700, marginBottom: 16 }}>
            Understand what happens in your body
          </h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: 48, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
            Track your progress through key metabolic milestones with science-backed information
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 24,
          }}>
            {MILESTONES.map((m) => (
              <div key={m.hour} style={{
                background: '#fafafa',
                padding: 24,
                borderRadius: 16,
                textAlign: 'center',
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: `${m.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: m.color,
                }}>
                  <m.icon size={28} />
                </div>
                <div style={{ fontSize: 14, color: m.color, fontWeight: 600, marginBottom: 4 }}>
                  {m.hour} hours
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>{m.title}</h3>
                <p style={{ margin: 0, color: '#666', fontSize: 14 }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{
        padding: '80px 24px',
        background: '#fafafa',
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 700, marginBottom: 48 }}>
            Everything you need to succeed
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
          }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: '#fff',
                padding: 24,
                borderRadius: 16,
                display: 'flex',
                gap: 16,
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(34, 197, 94, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#22c55e',
                  flexShrink: 0,
                }}>
                  <f.icon size={24} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>{f.title}</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: 14 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{
        padding: '80px 24px',
        background: '#fff',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 800, marginBottom: 16 }}>
            Start free. Unlock unlimited.
          </h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: 48, fontSize: 18 }}>
            First 10 hours free. Just $5 for 200 days of unlimited fasting.
          </p>

          {/* Single pricing card */}
          <div style={{
            maxWidth: 420,
            margin: '0 auto',
            background: '#fff',
            borderRadius: 24,
            border: '2px solid #22c55e',
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(34, 197, 94, 0.15)',
          }}>
            {/* Free part */}
            <div style={{
              padding: 32,
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(22, 163, 74, 0.05))',
              borderBottom: '1px solid rgba(34, 197, 94, 0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Flame size={24} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>First 10 Hours</div>
                  <div style={{ color: '#22c55e', fontWeight: 800, fontSize: 28 }}>FREE</div>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['Start fasting immediately', 'Track 5 early milestones', 'See your progress', 'Journal your experience'].map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 14, color: '#555' }}>
                    <Check size={16} color="#22c55e" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Paid part */}
            <div style={{ padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Sparkles size={24} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>200 Days Unlimited</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ color: '#16a34a', fontWeight: 800, fontSize: 28 }}>$5</span>
                    <span style={{ color: '#999', fontSize: 14 }}>for 200 days</span>
                  </div>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
                {['Unlimited fasts for 200 days', 'All 13 metabolic milestones', 'Extend any fast past 24h', 'Journal & progress history'].map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 14, color: '#555' }}>
                    <Check size={16} color="#22c55e" />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="#signup" style={{
                display: 'block',
                padding: '16px 24px',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                borderRadius: 12,
                textDecoration: 'none',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: 16,
                boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)',
              }}>
                Start Your Free Fast
              </a>
            </div>
          </div>

          {/* Value Props */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 48,
            marginTop: 48,
            flexWrap: 'wrap',
          }}>
            {[
              { icon: '🆓', text: '10 hours free' },
              { icon: '💵', text: '$5 to unlock' },
              { icon: '🔄', text: 'Pay per fast' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{icon}</span>
                <span style={{ color: '#666', fontSize: 15, fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{
        padding: '80px 24px',
        background: '#fafafa',
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 700, marginBottom: 48 }}>
            Loved by fasters everywhere
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
          }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{
                background: '#fff',
                padding: 24,
                borderRadius: 16,
              }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {Array(t.stars).fill(0).map((_, j) => (
                    <Star key={j} size={18} color="#fbbf24" fill="#fbbf24" />
                  ))}
                </div>
                <p style={{ margin: '0 0 16px', color: '#333', fontSize: 15, lineHeight: 1.6 }}>
                  "{t.text}"
                </p>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{
        padding: '80px 24px',
        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
        textAlign: 'center',
      }}>
        <h2 style={{ color: '#fff', fontSize: 32, fontWeight: 700, marginBottom: 16 }}>
          Ready to start your fasting journey?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 32, fontSize: 18 }}>
          Your first fast is completely free. No credit card required.
        </p>
        <a href="#signup" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '16px 32px',
          background: '#fff',
          color: '#16a34a',
          borderRadius: 12,
          textDecoration: 'none',
          fontSize: 18,
          fontWeight: 700,
        }}>
          Start Fasting Now <ArrowRight size={20} />
        </a>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px 24px',
        background: '#1a1a1a',
        color: '#999',
      }}>
        <div style={{
          maxWidth: 1000,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 24,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Flame size={24} color="#22c55e" />
              <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Fast!</span>
            </div>
            <p style={{ fontSize: 14, maxWidth: 250 }}>
              Your companion for intermittent fasting success.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            <div>
              <h4 style={{ color: '#fff', margin: '0 0 12px', fontSize: 14 }}>Product</h4>
              <a href="#features" style={{ display: 'block', color: '#999', textDecoration: 'none', fontSize: 14, marginBottom: 8 }}>Features</a>
              <a href="#pricing" style={{ display: 'block', color: '#999', textDecoration: 'none', fontSize: 14, marginBottom: 8 }}>Pricing</a>
              <a href="/blog" style={{ display: 'block', color: '#999', textDecoration: 'none', fontSize: 14 }}>Blog</a>
            </div>
            <div>
              <h4 style={{ color: '#fff', margin: '0 0 12px', fontSize: 14 }}>Resources</h4>
              <a href="/blog/getting-started" style={{ display: 'block', color: '#999', textDecoration: 'none', fontSize: 14, marginBottom: 8 }}>Getting Started</a>
              <a href="/blog/science" style={{ display: 'block', color: '#999', textDecoration: 'none', fontSize: 14, marginBottom: 8 }}>The Science</a>
              <a href="/blog/tips" style={{ display: 'block', color: '#999', textDecoration: 'none', fontSize: 14 }}>Fasting Tips</a>
            </div>
            <div>
              <h4 style={{ color: '#fff', margin: '0 0 12px', fontSize: 14 }}>Legal</h4>
              <a href="/privacy" style={{ display: 'block', color: '#999', textDecoration: 'none', fontSize: 14, marginBottom: 8 }}>Privacy</a>
              <a href="/terms" style={{ display: 'block', color: '#999', textDecoration: 'none', fontSize: 14 }}>Terms</a>
            </div>
          </div>
        </div>
        <div style={{
          maxWidth: 1000,
          margin: '40px auto 0',
          paddingTop: 24,
          borderTop: '1px solid #333',
          textAlign: 'center',
          fontSize: 13,
        }}>
          © {new Date().getFullYear()} Fast! All rights reserved.
        </div>
      </footer>
    </div>
  );
}
