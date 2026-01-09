import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame, Brain, Zap, Heart, Sparkles, Clock,
  Check, ArrowRight, Star, Shield, Users,
  TrendingUp, Award
} from 'lucide-react';
import { signInWithPassword, signUpWithPassword, resetPassword } from '../lib/supabase';
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
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await signUpWithPassword(email.trim(), password);
        // Auto sign in after sign up
        await signInWithPassword(email.trim(), password);
      } else {
        await signInWithPassword(email.trim(), password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Try signing up if you\'re new.');
      } else if (err.message?.includes('User already registered')) {
        setError('Account exists. Try logging in instead.');
        setIsSignUp(false);
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await resetPassword(email.trim());
      setSuccessMessage('Check your email for a password reset link!');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
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
        {/* Nav - single set of links */}
        <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <a href="/community" className="mobile-hide" style={{ color: '#666', textDecoration: 'none', fontSize: 14 }}>Community</a>
          <a href="/resources" className="mobile-hide" style={{ color: '#666', textDecoration: 'none', fontSize: 14 }}>Resources</a>
          <a href="/blog" className="mobile-hide" style={{ color: '#666', textDecoration: 'none', fontSize: 14 }}>Blog</a>
          <a href="#signup" style={{ color: '#666', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Login</a>
          <a href="#signup" style={{
            padding: '10px 20px',
            background: '#22c55e',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
          }}>Sign Up</a>
        </nav>
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
          {isForgotPassword ? (
              <>
                <h3 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>
                  Reset your password
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

                {successMessage && (
                  <div style={{
                    padding: 12,
                    background: 'rgba(34, 197, 94, 0.1)',
                    borderRadius: 8,
                    color: '#16a34a',
                    fontSize: 14,
                    marginBottom: 16,
                  }}>
                    {successMessage}
                  </div>
                )}

                <form onSubmit={handleForgotPassword}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e5e5e5',
                      borderRadius: 10,
                      fontSize: 16,
                      marginBottom: 12,
                      outline: 'none',
                    }}
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      background: loading ? '#ccc' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>

                <p style={{ margin: '16px 0 0', fontSize: 14, color: '#666', textAlign: 'center' }}>
                  <button
                    onClick={() => { setIsForgotPassword(false); setError(null); setSuccessMessage(null); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#22c55e',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    ← Back to login
                  </button>
                </p>
              </>
            ) : (
              <>
                <h3 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>
                  {isSignUp ? 'Create your account' : 'Welcome back'}
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

                <form onSubmit={handleSubmit}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e5e5e5',
                      borderRadius: 10,
                      fontSize: 16,
                      marginBottom: 12,
                      outline: 'none',
                    }}
                    disabled={loading}
                  />
                  <div style={{ position: 'relative', marginBottom: 8 }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        paddingRight: 50,
                        border: '2px solid #e5e5e5',
                        borderRadius: 10,
                        fontSize: 16,
                        outline: 'none',
                      }}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#999',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {!isSignUp && (
                    <div style={{ textAlign: 'right', marginBottom: 12 }}>
                      <button
                        type="button"
                        onClick={() => { setIsForgotPassword(true); setError(null); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#666',
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !email.trim() || !password.trim()}
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      background: loading ? '#ccc' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Log In'}
                    {!loading && <ArrowRight size={18} />}
                  </button>
                </form>

                <p style={{ margin: '16px 0 0', fontSize: 14, color: '#666', textAlign: 'center' }}>
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#22c55e',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    {isSignUp ? 'Log in' : 'Sign up'}
                  </button>
                </p>
              </>
            )}
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
              <a href="/community" style={{ display: 'block', color: '#999', textDecoration: 'none', fontSize: 14 }}>Community</a>
            </div>
            <div>
              <h4 style={{ color: '#fff', margin: '0 0 12px', fontSize: 14 }}>Resources</h4>
              <a href="/resources" style={{ display: 'block', color: '#999', textDecoration: 'none', fontSize: 14, marginBottom: 8 }}>Fasting Resources</a>
              <a href="/blog" style={{ display: 'block', color: '#999', textDecoration: 'none', fontSize: 14, marginBottom: 8 }}>Blog</a>
              <a href="/community" style={{ display: 'block', color: '#999', textDecoration: 'none', fontSize: 14 }}>Fasting Protocols</a>
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
