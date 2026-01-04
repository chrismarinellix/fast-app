import { Link } from 'react-router-dom';
import { Flame, ArrowLeft, ExternalLink, BookOpen, Clock, Award } from 'lucide-react';

const ARTICLES = [
  {
    slug: 'getting-started',
    title: 'Getting Started with Intermittent Fasting',
    excerpt: 'Everything you need to know to begin your fasting journey safely and effectively.',
    readTime: 8,
    category: 'Beginner',
  },
  {
    slug: 'science-of-fasting',
    title: 'The Science Behind Fasting',
    excerpt: 'Understand what happens in your body during a fast, from ketosis to autophagy.',
    readTime: 12,
    category: 'Science',
  },
  {
    slug: 'autophagy-explained',
    title: 'Autophagy: Your Body\'s Cellular Cleanup',
    excerpt: 'Learn about the Nobel Prize-winning discovery of autophagy and how fasting triggers it.',
    readTime: 10,
    category: 'Science',
  },
  {
    slug: 'fasting-tips',
    title: '10 Tips for a Successful Fast',
    excerpt: 'Practical advice to help you complete your fasts and build a sustainable practice.',
    readTime: 6,
    category: 'Tips',
  },
  {
    slug: 'breaking-your-fast',
    title: 'How to Break Your Fast Properly',
    excerpt: 'What to eat after fasting to maximize benefits and avoid digestive issues.',
    readTime: 7,
    category: 'Nutrition',
  },
  {
    slug: 'fasting-mistakes',
    title: 'Common Fasting Mistakes to Avoid',
    excerpt: 'Learn from others\' mistakes and set yourself up for fasting success.',
    readTime: 8,
    category: 'Tips',
  },
];

const EXTERNAL_RESOURCES = [
  {
    title: 'Huberman Lab: Fasting Benefits',
    url: 'https://hubermanlab.com/effects-of-fasting-and-time-restricted-eating-on-fat-loss-and-health/',
    description: 'Dr. Andrew Huberman explains the science of fasting',
  },
  {
    title: 'Dr. Peter Attia on Fasting',
    url: 'https://peterattiamd.com/category/fasting/',
    description: 'In-depth medical perspective on fasting protocols',
  },
  {
    title: 'The Complete Guide to Fasting (Book)',
    url: 'https://www.amazon.com/Complete-Guide-Fasting-Intermittent-Alternate-Day/dp/1628600012',
    description: 'Dr. Jason Fung\'s comprehensive fasting guide',
  },
  {
    title: 'NIH: Intermittent Fasting Research',
    url: 'https://www.nih.gov/news-events/nih-research-matters/intermittent-fasting-improves-health-markers',
    description: 'Scientific research from the National Institutes of Health',
  },
  {
    title: 'Zero Fasting (Community)',
    url: 'https://zerofasting.com/',
    description: 'Popular fasting app and community',
  },
  {
    title: 'r/intermittentfasting (Reddit)',
    url: 'https://www.reddit.com/r/intermittentfasting/',
    description: 'Active community of fasters sharing experiences',
  },
];

export function Blog() {
  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        padding: '20px 24px',
        background: '#fff',
        borderBottom: '1px solid #e5e5e5',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: 1000,
          margin: '0 auto',
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Flame size={28} color="#22c55e" />
            <span style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>Fast!</span>
          </Link>
          <Link to="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: '#666',
            textDecoration: 'none',
            fontSize: 14,
          }}>
            <ArrowLeft size={18} /> Back to app
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        padding: '60px 24px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #22c55e15, #16a34a10)',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 16px', color: '#1a1a1a' }}>
            Fasting Resources
          </h1>
          <p style={{ fontSize: 18, color: '#666', margin: 0 }}>
            Learn everything about intermittent fasting with our guides and curated resources.
          </p>
        </div>
      </section>

      {/* Articles */}
      <section style={{ padding: '60px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <BookOpen size={24} color="#22c55e" />
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Articles & Guides</h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 24,
          }}>
            {ARTICLES.map((article) => (
              <Link
                key={article.slug}
                to={`/blog/${article.slug}`}
                style={{
                  background: '#fff',
                  padding: 24,
                  borderRadius: 12,
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'box-shadow 0.2s',
                  border: '1px solid #e5e5e5',
                }}
              >
                <div style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: 12,
                  fontSize: 12,
                  color: '#16a34a',
                  fontWeight: 600,
                  marginBottom: 12,
                }}>
                  {article.category}
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>
                  {article.title}
                </h3>
                <p style={{ margin: '0 0 12px', fontSize: 14, color: '#666', lineHeight: 1.5 }}>
                  {article.excerpt}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#999' }}>
                  <Clock size={14} />
                  {article.readTime} min read
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* External Resources */}
      <section style={{ padding: '60px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <ExternalLink size={24} color="#3b82f6" />
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>External Resources</h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}>
            {EXTERNAL_RESOURCES.map((resource, i) => (
              <a
                key={i}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: 16,
                  background: '#fafafa',
                  borderRadius: 10,
                  textDecoration: 'none',
                  color: 'inherit',
                  border: '1px solid #e5e5e5',
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: 'rgba(59, 130, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <ExternalLink size={18} color="#3b82f6" />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>
                    {resource.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
                    {resource.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Facts */}
      <section style={{ padding: '60px 24px', background: '#fafafa' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <Award size={24} color="#8b5cf6" />
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Quick Facts About Fasting</h2>
          </div>

          <div style={{
            display: 'grid',
            gap: 16,
          }}>
            {[
              { fact: 'Autophagy was discovered by Yoshinori Ohsumi, who won the Nobel Prize in 2016 for this work.' },
              { fact: 'Human growth hormone can increase up to 5x during extended fasts, promoting muscle preservation.' },
              { fact: 'Fasting triggers a metabolic switch from glucose to ketones around 12-14 hours.' },
              { fact: 'Studies show intermittent fasting can improve insulin sensitivity by up to 40%.' },
              { fact: 'The brain can use ketones for up to 75% of its energy needs during fasting.' },
              { fact: 'Fasting has been practiced for thousands of years across many cultures and religions.' },
            ].map((item, i) => (
              <div key={i} style={{
                padding: 20,
                background: '#fff',
                borderRadius: 10,
                borderLeft: '4px solid #8b5cf6',
              }}>
                <p style={{ margin: 0, fontSize: 15, color: '#333', lineHeight: 1.6 }}>
                  {item.fact}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '60px 24px',
        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
        textAlign: 'center',
      }}>
        <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 16px' }}>
          Ready to start your fasting journey?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.9)', margin: '0 0 24px' }}>
          Try your first fast for free with Fast!
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            padding: '14px 28px',
            background: '#fff',
            color: '#16a34a',
            borderRadius: 10,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          Get Started Free
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
        <p style={{ margin: 0, fontSize: 13 }}>
          © {new Date().getFullYear()} Fast! All rights reserved.
        </p>
      </footer>
    </div>
  );
}
