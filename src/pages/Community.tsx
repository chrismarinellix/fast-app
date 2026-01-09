import { Link } from 'react-router-dom';
import {
  Flame, ArrowLeft, Clock, Zap, Brain, Heart, Award,
  TrendingUp, Calendar, BookOpen, Users, Sparkles, Check, ArrowRight
} from 'lucide-react';

// Popular fasting protocols
const FASTING_PROTOCOLS = [
  {
    name: '16:8',
    title: 'Lean Gains',
    fastHours: 16,
    eatHours: 8,
    description: 'The most popular protocol. Fast for 16 hours, eat within an 8-hour window. Perfect for beginners.',
    benefits: ['Easy to maintain', 'Fits most schedules', 'Good for weight loss', 'Improves insulin sensitivity'],
    example: 'Skip breakfast, eat from 12pm-8pm',
    difficulty: 'Beginner',
    color: '#22c55e',
  },
  {
    name: '18:6',
    title: 'Moderate Fast',
    fastHours: 18,
    eatHours: 6,
    description: 'A step up from 16:8. Provides deeper benefits while still being manageable for most people.',
    benefits: ['Enhanced autophagy', 'Better fat burning', 'Increased HGH', 'Mental clarity'],
    example: 'Eat from 12pm-6pm only',
    difficulty: 'Intermediate',
    color: '#3b82f6',
  },
  {
    name: '20:4',
    title: 'Warrior Diet',
    fastHours: 20,
    eatHours: 4,
    description: 'Based on ancient warrior eating patterns. One main meal with a small eating window.',
    benefits: ['Maximum autophagy', 'Deep ketosis', 'Significant fat loss', 'Time efficiency'],
    example: 'Eat from 4pm-8pm only',
    difficulty: 'Advanced',
    color: '#8b5cf6',
  },
  {
    name: 'OMAD',
    title: 'One Meal A Day',
    fastHours: 23,
    eatHours: 1,
    description: 'Eat one large, nutritious meal per day. Maximum simplicity and fasting benefits.',
    benefits: ['Simplest routine', 'Peak autophagy', 'Maximum fat adaptation', 'Save time and money'],
    example: 'One meal at dinner time',
    difficulty: 'Advanced',
    color: '#ef4444',
  },
  {
    name: '5:2',
    title: 'Alternate Day',
    fastHours: 24,
    eatHours: 0,
    description: 'Eat normally 5 days, restrict calories to 500-600 on 2 non-consecutive days.',
    benefits: ['Flexible schedule', 'Easier psychologically', 'Proven weight loss', 'Less daily restriction'],
    example: 'Fast Monday and Thursday',
    difficulty: 'Intermediate',
    color: '#f59e0b',
  },
  {
    name: '24-Hour',
    title: 'Full Day Fast',
    fastHours: 24,
    eatHours: 0,
    description: 'Complete 24-hour fast from dinner to dinner or lunch to lunch, done weekly.',
    benefits: ['Full metabolic reset', 'Deep cellular cleanup', 'Growth hormone surge', 'Break plateaus'],
    example: 'Dinner to dinner, once weekly',
    difficulty: 'Advanced',
    color: '#ec4899',
  },
];

const FAST_APP_FEATURES = [
  {
    icon: Clock,
    title: 'Real-time Tracking',
    description: 'Watch your fasting timer count up with elapsed and remaining time side by side.',
  },
  {
    icon: Sparkles,
    title: '13 Metabolic Milestones',
    description: 'Learn what happens in your body at each stage, from ketosis to deep autophagy.',
  },
  {
    icon: Brain,
    title: 'Science-Backed Education',
    description: 'Understand the "why" behind fasting with explanations at every milestone.',
  },
  {
    icon: BookOpen,
    title: 'Fasting Journal',
    description: 'Track your mood, energy, and hunger to optimize your fasting experience.',
  },
  {
    icon: TrendingUp,
    title: 'Progress History',
    description: 'See your fasting streaks, total hours fasted, and improvement over time.',
  },
  {
    icon: Calendar,
    title: 'Flexible Targets',
    description: 'Set custom fasting goals from 12 to 72+ hours. Supports all protocols.',
  },
];

const FASTING_BENEFITS = [
  { icon: Zap, title: 'Weight Loss', description: 'Burn stored fat for fuel during your fast', color: '#f59e0b' },
  { icon: Brain, title: 'Mental Clarity', description: 'Ketones provide clean fuel for your brain', color: '#3b82f6' },
  { icon: Heart, title: 'Heart Health', description: 'Improved cholesterol and blood pressure', color: '#ef4444' },
  { icon: Sparkles, title: 'Cellular Repair', description: 'Autophagy cleans up damaged cells', color: '#8b5cf6' },
  { icon: TrendingUp, title: 'Insulin Sensitivity', description: 'Better blood sugar regulation', color: '#22c55e' },
  { icon: Award, title: 'Longevity', description: 'Fasting activates longevity pathways', color: '#06b6d4' },
];

function ProtocolCard({ protocol }: { protocol: typeof FASTING_PROTOCOLS[0] }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid #e5e5e5',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        background: `linear-gradient(135deg, ${protocol.color}15, ${protocol.color}08)`,
        borderBottom: `2px solid ${protocol.color}30`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{
            fontSize: 32,
            fontWeight: 800,
            color: protocol.color,
          }}>
            {protocol.name}
          </span>
          <span style={{
            padding: '4px 10px',
            background: protocol.color,
            color: '#fff',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
          }}>
            {protocol.difficulty}
          </span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>{protocol.title}</div>
      </div>

      {/* Content */}
      <div style={{ padding: 24 }}>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#666', lineHeight: 1.6 }}>
          {protocol.description}
        </p>

        {/* Fast/Eat Split */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
        }}>
          <div style={{
            flex: protocol.fastHours,
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 8,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#dc2626' }}>{protocol.fastHours}h</div>
            <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase' }}>Fasting</div>
          </div>
          {protocol.eatHours > 0 && (
            <div style={{
              flex: protocol.eatHours,
              padding: '12px 16px',
              background: 'rgba(34, 197, 94, 0.1)',
              borderRadius: 8,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>{protocol.eatHours}h</div>
              <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase' }}>Eating</div>
            </div>
          )}
        </div>

        {/* Example */}
        <div style={{
          padding: '12px 16px',
          background: '#f5f5f5',
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 14,
          color: '#555',
        }}>
          <strong>Example:</strong> {protocol.example}
        </div>

        {/* Benefits */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>Benefits:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {protocol.benefits.map((benefit, i) => (
              <span key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                background: `${protocol.color}10`,
                borderRadius: 12,
                fontSize: 12,
                color: protocol.color,
              }}>
                <Check size={12} />
                {benefit}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Community() {
  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        padding: '20px 24px',
        background: '#fff',
        borderBottom: '1px solid #e5e5e5',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: 1100,
          margin: '0 auto',
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Flame size={28} color="#22c55e" />
            <span style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>Fast!</span>
          </Link>
          <nav style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <Link to="/resources" style={{ color: '#666', textDecoration: 'none', fontSize: 14 }}>Resources</Link>
            <Link to="/blog" style={{ color: '#666', textDecoration: 'none', fontSize: 14 }}>Blog</Link>
            <Link to="/" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#22c55e',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
            }}>
              <ArrowLeft size={16} /> Start Fasting
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        padding: '80px 24px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(34, 197, 94, 0.1) 0%, transparent 100%)',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: 'rgba(34, 197, 94, 0.1)',
            borderRadius: 20,
            marginBottom: 24,
          }}>
            <Users size={18} color="#16a34a" />
            <span style={{ fontSize: 14, color: '#16a34a', fontWeight: 500 }}>Join the fasting community</span>
          </div>

          <h1 style={{ fontSize: 48, fontWeight: 800, margin: '0 0 20px', color: '#1a1a1a', lineHeight: 1.1 }}>
            Master Intermittent Fasting with <span style={{ color: '#22c55e' }}>Fast!</span>
          </h1>

          <p style={{ fontSize: 20, color: '#666', margin: '0 0 32px', lineHeight: 1.6 }}>
            Whether you're doing 16:8, 20:4, or OMAD, our simple tracking app helps you reach your fasting goals with science-backed guidance every step of the way.
          </p>

          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff',
              borderRadius: 12,
              textDecoration: 'none',
              fontSize: 18,
              fontWeight: 700,
              boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)',
            }}
          >
            Start Your Free Fast <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ padding: '60px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 700, margin: '0 0 48px' }}>
            Why People Fast
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 24,
          }}>
            {FASTING_BENEFITS.map((benefit, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: `${benefit.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: benefit.color,
                }}>
                  <benefit.icon size={28} />
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>{benefit.title}</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#666' }}>{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fasting Protocols */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 16px' }}>
              Popular Fasting Protocols
            </h2>
            <p style={{ fontSize: 18, color: '#666', maxWidth: 600, margin: '0 auto' }}>
              Choose the fasting schedule that fits your lifestyle. Fast! supports all of these and more.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24,
          }}>
            {FASTING_PROTOCOLS.map((protocol, i) => (
              <ProtocolCard key={i} protocol={protocol} />
            ))}
          </div>
        </div>
      </section>

      {/* About Fast! App */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 20,
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Flame size={28} color="#fff" />
              </div>
              <span style={{ fontSize: 36, fontWeight: 800 }}>Fast!</span>
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 16px' }}>
              The Simple Fasting Tracker
            </h2>
            <p style={{ fontSize: 18, color: '#666', maxWidth: 600, margin: '0 auto' }}>
              No complicated features. No subscription pressure. Just a clean, beautiful way to track your fasts and learn what's happening in your body.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
          }}>
            {FAST_APP_FEATURES.map((feature, i) => (
              <div key={i} style={{
                padding: 24,
                background: '#fafafa',
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
                  <feature.icon size={24} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600 }}>{feature.title}</h3>
                  <p style={{ margin: 0, fontSize: 14, color: '#666', lineHeight: 1.5 }}>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Reminder */}
          <div style={{
            marginTop: 48,
            padding: 32,
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(22, 163, 74, 0.05))',
            borderRadius: 20,
            textAlign: 'center',
            border: '2px solid rgba(34, 197, 94, 0.2)',
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 700 }}>
              Start free, unlock unlimited
            </h3>
            <p style={{ margin: '0 0 20px', color: '#666', fontSize: 16 }}>
              Your first 10 hours are completely free. Then just $5 for 200 days of unlimited fasting.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#22c55e' }}>FREE</div>
                <div style={{ fontSize: 13, color: '#666' }}>First 10 hours</div>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#16a34a' }}>$5</div>
                <div style={{ fontSize: 13, color: '#666' }}>200 days unlimited</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 700, margin: '0 0 48px' }}>
            How to Get Started
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[
              { step: 1, title: 'Choose your protocol', desc: 'Start with 16:8 if you\'re new to fasting. You can always adjust later.' },
              { step: 2, title: 'Set your eating window', desc: 'Pick times that work with your schedule. Many people skip breakfast and eat from noon to 8pm.' },
              { step: 3, title: 'Start your first fast', desc: 'Open Fast!, tap start, and watch your progress through each metabolic milestone.' },
              { step: 4, title: 'Stay hydrated', desc: 'Water, black coffee, and plain tea are fine during your fast. They won\'t break it.' },
              { step: 5, title: 'Break your fast mindfully', desc: 'When your eating window opens, start with something light before your main meal.' },
            ].map((item) => (
              <div key={item.step} style={{
                display: 'flex',
                gap: 20,
                padding: 24,
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #e5e5e5',
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 20,
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {item.step}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 600 }}>{item.title}</h3>
                  <p style={{ margin: 0, fontSize: 15, color: '#666' }}>{item.desc}</p>
                </div>
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
        <h2 style={{ color: '#fff', fontSize: 36, fontWeight: 800, margin: '0 0 16px' }}>
          Ready to transform your health?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.9)', margin: '0 0 32px', fontSize: 18 }}>
          Join thousands of fasters using Fast! to track their journey.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '18px 36px',
            background: '#fff',
            color: '#16a34a',
            borderRadius: 12,
            textDecoration: 'none',
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          Start Fasting Now <ArrowRight size={20} />
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px 24px',
        background: '#1a1a1a',
        color: '#999',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          <Flame size={20} color="#22c55e" />
          <span style={{ color: '#fff', fontWeight: 600 }}>Fast!</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16, fontSize: 14 }}>
          <Link to="/resources" style={{ color: '#999', textDecoration: 'none' }}>Resources</Link>
          <Link to="/community" style={{ color: '#999', textDecoration: 'none' }}>Community</Link>
          <Link to="/blog" style={{ color: '#999', textDecoration: 'none' }}>Blog</Link>
        </div>
        <p style={{ margin: 0, fontSize: 13 }}>
          © {new Date().getFullYear()} Fast! All rights reserved.
        </p>
      </footer>
    </div>
  );
}
