# Fast! - Fasting Tracker App

A beautiful, minimal fasting tracker with timer, milestones, mood tracking, and payment system.

**Live**: https://fast-fasting-app.netlify.app

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Auth**: Supabase (Magic Link + Google OAuth)
- **Database**: Supabase PostgreSQL
- **Payments**: Stripe (one-time $5 for 200 days)
- **Hosting**: Netlify + Netlify Functions

## Getting Started

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build
npm run build

# Deploy
netlify deploy --prod
```

## Features

- 13-stage fasting milestones with scientific explanations
- Real-time timer with progress visualization
- Mood and energy tracking during fasts
- 10 hours free, then $5 for 200 days unlimited
- Magic link and Google OAuth sign-in

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - Technical details and flow diagrams
- [Design System](docs/DESIGN.md) - Colors, typography, components
- [Debugging](docs/DEBUGGING.md) - Solved issues and troubleshooting

## Environment Variables

Create `.env.local` for local development:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_FAST_PRICE_ID=price_...
```

Set Netlify environment variables for functions:

```bash
netlify env:set STRIPE_SECRET_KEY "sk_live_..."
netlify env:set SUPABASE_URL "https://xxx.supabase.co"
netlify env:set SUPABASE_SERVICE_KEY "eyJ..."
netlify env:set STRIPE_WEBHOOK_SECRET "whsec_..."
```
