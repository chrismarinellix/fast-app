import { Link } from 'react-router-dom';
import {
  Flame, ArrowLeft, ExternalLink, BookOpen, Youtube, Microscope,
  Users, Smartphone, GraduationCap, Heart, Podcast
} from 'lucide-react';

const FASTING_APPS = [
  {
    name: 'Zero Fasting',
    url: 'https://zerofasting.com/',
    description: 'Popular app with community features and coaching',
  },
  {
    name: 'Life Fasting Tracker',
    url: 'https://lifefastingtracker.app/',
    description: 'Social fasting app with circles feature',
  },
  {
    name: 'Fastic',
    url: 'https://fastic.com/',
    description: 'Intermittent fasting app with meal plans',
  },
  {
    name: 'Simple: Intermittent Fasting',
    url: 'https://simple.life/',
    description: 'AI-powered fasting and nutrition guidance',
  },
];

const SCIENCE_RESOURCES = [
  {
    name: 'NIH Intermittent Fasting Research',
    url: 'https://www.nih.gov/news-events/nih-research-matters/intermittent-fasting-improves-health-markers',
    description: 'Government research on fasting health benefits',
  },
  {
    name: 'PubMed - Intermittent Fasting Studies',
    url: 'https://pubmed.ncbi.nlm.nih.gov/?term=intermittent+fasting',
    description: 'Peer-reviewed scientific research database',
  },
  {
    name: 'New England Journal of Medicine',
    url: 'https://www.nejm.org/doi/full/10.1056/NEJMra1905136',
    description: 'Effects of Intermittent Fasting on Health, Aging, and Disease',
  },
  {
    name: 'Cell Metabolism - Time-Restricted Eating',
    url: 'https://www.cell.com/cell-metabolism/fulltext/S1550-4131(19)30611-4',
    description: 'Ten-Hour Time-Restricted Eating study',
  },
];

const EXPERT_CONTENT = [
  {
    name: 'Huberman Lab Podcast',
    url: 'https://hubermanlab.com/effects-of-fasting-and-time-restricted-eating-on-fat-loss-and-health/',
    description: 'Stanford neuroscientist on fasting science',
    icon: Podcast,
  },
  {
    name: 'Dr. Peter Attia',
    url: 'https://peterattiamd.com/category/fasting/',
    description: 'Longevity-focused physician on fasting protocols',
    icon: Heart,
  },
  {
    name: 'Dr. Jason Fung',
    url: 'https://www.dietdoctor.com/authors/dr-jason-fung-m-d',
    description: 'Nephrologist and fasting expert',
    icon: GraduationCap,
  },
  {
    name: 'Dr. Rhonda Patrick',
    url: 'https://www.foundmyfitness.com/topics/fasting',
    description: 'Biomedical scientist on fasting and longevity',
    icon: Microscope,
  },
];

const YOUTUBE_CHANNELS = [
  {
    name: 'Dr. Eric Berg',
    url: 'https://www.youtube.com/@DrEricBergDC',
    description: '10M+ subscribers, extensive fasting content',
  },
  {
    name: 'Thomas DeLauer',
    url: 'https://www.youtube.com/@ThomasDeLauerOfficial',
    description: 'Celebrity trainer, science-based fasting tips',
  },
  {
    name: 'What I\'ve Learned',
    url: 'https://www.youtube.com/@WhatIveLearned',
    description: 'Well-researched health documentaries',
  },
  {
    name: 'Dr. Sten Ekberg',
    url: 'https://www.youtube.com/@drekberg',
    description: 'Holistic health and intermittent fasting',
  },
];

const COMMUNITIES = [
  {
    name: 'r/intermittentfasting',
    url: 'https://www.reddit.com/r/intermittentfasting/',
    description: '2M+ members sharing fasting journeys',
    members: '2M+',
  },
  {
    name: 'r/fasting',
    url: 'https://www.reddit.com/r/fasting/',
    description: 'Extended and water fasting community',
    members: '500K+',
  },
  {
    name: 'r/OMAD',
    url: 'https://www.reddit.com/r/omad/',
    description: 'One Meal A Day community',
    members: '300K+',
  },
  {
    name: 'Fasting Facebook Groups',
    url: 'https://www.facebook.com/groups/intermittentfastinglifestyle/',
    description: 'Active communities on Facebook',
    members: '1M+',
  },
];

const BOOKS = [
  {
    name: 'The Complete Guide to Fasting',
    author: 'Dr. Jason Fung',
    url: 'https://www.amazon.com/Complete-Guide-Fasting-Intermittent-Alternate-Day/dp/1628600012',
    description: 'Comprehensive guide to all fasting protocols',
  },
  {
    name: 'The Obesity Code',
    author: 'Dr. Jason Fung',
    url: 'https://www.amazon.com/Obesity-Code-Unlocking-Secrets-Weight/dp/1771641258',
    description: 'Understanding insulin and weight loss',
  },
  {
    name: 'Fast. Feast. Repeat.',
    author: 'Gin Stephens',
    url: 'https://www.amazon.com/Fast-Feast-Repeat-Comprehensive-Intermittent/dp/1250757622',
    description: 'Practical guide to intermittent fasting lifestyle',
  },
  {
    name: 'Life in the Fasting Lane',
    author: 'Dr. Jason Fung, Eve Mayer, Megan Ramos',
    url: 'https://www.amazon.com/Life-Fasting-Lane-Intermittent-Transform/dp/0062969447',
    description: 'Real stories and practical advice',
  },
];

function ResourceSection({ title, icon: Icon, color, children }: {
  title: string;
  icon: any;
  color: string;
  children: React.ReactNode
}) {
  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon size={20} color={color} />
        </div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ResourceCard({ name, url, description, extra }: {
  name: string;
  url: string;
  description: string;
  extra?: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        padding: 20,
        background: '#fff',
        borderRadius: 12,
        textDecoration: 'none',
        border: '1px solid #e5e5e5',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#22c55e';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e5e5e5';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>
            {name}
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: '#666', lineHeight: 1.5 }}>
            {description}
          </p>
          {extra && (
            <span style={{
              display: 'inline-block',
              marginTop: 8,
              padding: '4px 8px',
              background: 'rgba(34, 197, 94, 0.1)',
              borderRadius: 6,
              fontSize: 12,
              color: '#16a34a',
              fontWeight: 500,
            }}>
              {extra}
            </span>
          )}
        </div>
        <ExternalLink size={16} color="#999" style={{ flexShrink: 0, marginTop: 4 }} />
      </div>
    </a>
  );
}

export function Resources() {
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
          maxWidth: 1000,
          margin: '0 auto',
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Flame size={28} color="#22c55e" />
            <span style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>Fast!</span>
          </Link>
          <nav style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <Link to="/community" style={{ color: '#666', textDecoration: 'none', fontSize: 14 }}>Community</Link>
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
        padding: '60px 24px 40px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(34, 197, 94, 0.08) 0%, transparent 100%)',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, margin: '0 0 16px', color: '#1a1a1a' }}>
            Fasting Resources
          </h1>
          <p style={{ fontSize: 18, color: '#666', margin: 0, lineHeight: 1.6 }}>
            Curated collection of the best fasting apps, science, experts, communities, and books to support your intermittent fasting journey.
          </p>
        </div>
      </section>

      {/* Resources */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 80px' }}>

        <ResourceSection title="Fasting Apps" icon={Smartphone} color="#22c55e">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {FASTING_APPS.map((app, i) => (
              <ResourceCard key={i} name={app.name} url={app.url} description={app.description} />
            ))}
          </div>
        </ResourceSection>

        <ResourceSection title="Scientific Research" icon={Microscope} color="#3b82f6">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {SCIENCE_RESOURCES.map((resource, i) => (
              <ResourceCard key={i} name={resource.name} url={resource.url} description={resource.description} />
            ))}
          </div>
        </ResourceSection>

        <ResourceSection title="Expert Content" icon={GraduationCap} color="#8b5cf6">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {EXPERT_CONTENT.map((expert, i) => (
              <ResourceCard key={i} name={expert.name} url={expert.url} description={expert.description} />
            ))}
          </div>
        </ResourceSection>

        <ResourceSection title="YouTube Channels" icon={Youtube} color="#ef4444">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {YOUTUBE_CHANNELS.map((channel, i) => (
              <ResourceCard key={i} name={channel.name} url={channel.url} description={channel.description} />
            ))}
          </div>
        </ResourceSection>

        <ResourceSection title="Communities" icon={Users} color="#f59e0b">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {COMMUNITIES.map((community, i) => (
              <ResourceCard
                key={i}
                name={community.name}
                url={community.url}
                description={community.description}
                extra={community.members}
              />
            ))}
          </div>
        </ResourceSection>

        <ResourceSection title="Books" icon={BookOpen} color="#06b6d4">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {BOOKS.map((book, i) => (
              <ResourceCard
                key={i}
                name={book.name}
                url={book.url}
                description={book.description}
                extra={`by ${book.author}`}
              />
            ))}
          </div>
        </ResourceSection>

      </div>

      {/* CTA */}
      <section style={{
        padding: '60px 24px',
        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
        textAlign: 'center',
      }}>
        <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 16px' }}>
          Ready to track your fasts?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.9)', margin: '0 0 24px', fontSize: 16 }}>
          Fast! makes it simple to track your fasting progress with milestone education and journaling.
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
          Start Your Free Fast
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
