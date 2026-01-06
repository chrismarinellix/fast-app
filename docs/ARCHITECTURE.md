# Fast! App - Technical Architecture

## Overview
A fasting tracker app with timer, milestones, mood tracking, and payment system.

## Tech Stack

### Frontend
- **Framework**: React 19.2
- **Build Tool**: Vite 7.2
- **Router**: React Router 7.11
- **Styling**: Inline styles (no CSS framework)
- **Icons**: Lucide React
- **Date Handling**: date-fns

### Backend (Serverless)
- **Platform**: Netlify Functions
- **Runtime**: Node.js
- **Functions**:
  - `create-checkout.ts` - Creates Stripe checkout session
  - `create-portal.ts` - Creates Stripe billing portal session
  - `stripe-webhook.ts` - Handles Stripe webhook events

### Database
- **Provider**: Supabase (PostgreSQL)
- **Tables**:
  - `profiles` - User data, subscription status, paid_until
  - `fasting_sessions` - Fast records with start/end times
  - `fasting_notes` - Mood/energy logs during fasts
- **Auth**: Supabase Auth (Magic Link + Google OAuth)
- **Security**: Row Level Security (RLS) enabled

### Payments
- **Provider**: Stripe
- **Model**: $5 for 200 days of unlimited fasting
- **Flow**:
  1. User hits 10-hour paywall
  2. Redirect to Stripe Checkout
  3. Webhook updates `profiles.paid_until`

## File Structure

```
fast-app/
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx      # Auth state provider (manual session handling)
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client (minimal auth config)
│   │   └── stripe.ts            # Stripe checkout functions
│   ├── pages/
│   │   ├── Landing.tsx          # Home/login page
│   │   ├── Dashboard.tsx        # Main app (timer, milestones, payment overlay)
│   │   └── Test.tsx             # Debug/diagnostic page
│   ├── App.tsx                  # Router setup
│   └── main.tsx                 # Entry point
├── netlify/
│   └── functions/               # Serverless functions
├── docs/                        # Documentation
├── .env.local                   # Local environment variables
├── netlify.toml                 # Netlify configuration
└── supabase-schema.sql          # Database schema
```

## Auth Flow

### IMPORTANT: Manual Session Handling
Default Supabase auth config causes hanging. We use minimal config and handle auth manually:

```typescript
// Minimal client - no auto session handling
const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
```

### Magic Link Flow
1. User enters email on Landing.tsx
2. `signInWithEmail()` calls Supabase Auth
3. Supabase sends magic link to email
4. User clicks link, redirected to `/dashboard#access_token=xxx&refresh_token=xxx`
5. AuthContext manually extracts tokens from URL hash
6. Calls `supabase.auth.setSession()` with extracted tokens
7. Stores session in localStorage (`fast-app-session`)
8. Profile loaded from database

### Google OAuth Flow
1. User clicks "Sign in with Google"
2. `signInWithGoogle()` redirects to Google
3. User authenticates, redirected back with tokens in hash
4. Same manual token extraction as magic link

## Environment Variables

### Frontend (VITE_ prefix)
```
VITE_SUPABASE_URL=https://mlimixgmnkhjgjutoncr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (legacy JWT format)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51SDrgULjCULrSd7w...
VITE_STRIPE_FAST_PRICE_ID=price_1SmAi5LjCULrSd7wKBcYfaj1
```

### Backend (Netlify Functions)
```
SUPABASE_URL=https://mlimixgmnkhjgjutoncr.supabase.co
SUPABASE_SERVICE_KEY=eyJ... (service_role key)
STRIPE_SECRET_KEY=sk_live_51SDrgULjCULrSd7w...
STRIPE_WEBHOOK_SECRET=whsec_1RvH4rYv32nwtB7JJVewhsd7GiY9pzXt
```

**Important**: Set Netlify env vars WITHOUT `--scope` flag:
```bash
netlify env:set STRIPE_SECRET_KEY "sk_live_..."
```

## Payment Flow

1. User starts fast (free)
2. Timer runs for 10 hours (FREE_HOURS)
3. At 10 hours, payment overlay appears
4. User clicks "Unlock 200 Days - $5"
5. Redirect to Stripe Checkout (one-time payment)
6. On success, webhook fires `checkout.session.completed`
7. Webhook sets `profiles.paid_until` = now + 200 days
8. User has unlimited fasts for 200 days

## Database Schema

### profiles
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | User ID (from auth.users) |
| email | TEXT | User email |
| subscription_status | TEXT | free/active/cancelled/expired |
| paid_until | TIMESTAMPTZ | When paid access expires |
| fasts_completed | INTEGER | Total completed fasts |
| stripe_customer_id | TEXT | Stripe customer ID |

### fasting_sessions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Session ID |
| user_id | UUID | FK to profiles |
| start_time | TIMESTAMPTZ | When fast started |
| end_time | TIMESTAMPTZ | When fast ended |
| target_hours | INTEGER | Target duration |
| completed | BOOLEAN | Reached target? |

### fasting_notes
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Note ID |
| fasting_id | UUID | FK to fasting_sessions |
| hour_mark | INTEGER | Hours into fast |
| mood | TEXT | great/good/okay/tough/difficult |
| energy_level | INTEGER | 1-5 |
| hunger_level | INTEGER | 1-5 |
| note | TEXT | Optional text |

## Key Gotchas

1. **Supabase Auth Hanging**: Must use minimal auth config. Default config times out.
2. **Legacy Keys**: Must use legacy JWT format keys (`eyJ...`), not new format (`sb_...`).
3. **Netlify Env Vars**: Don't use `--scope functions`, set without scope.
4. **Session Storage**: Using localStorage key `fast-app-session` for manual session persistence.
