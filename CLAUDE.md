# Fast! Fasting Tracker App

## Quick Reference

- **Live URL**: https://fast-fasting-app.netlify.app
- **Stack**: React 19 + Vite + Supabase + Stripe + Netlify Functions
- **Pricing**: $5 for 200 days unlimited fasting (10 hours free)

## Authentication

### Email + Password (Primary)
- Users sign in with email + password
- Browser autofill works for saved credentials
- Toggle between "Sign in" and "Create account" modes
- `signInWithPassword()` and `signUpWithPassword()` in supabase.ts

### Google OAuth (Alternative)
- One-click sign in via Google
- `signInWithGoogle()` in supabase.ts

### Session Persistence
Sessions are persisted automatically by Supabase client:
```typescript
const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'fast-app-auth',
  },
});
```

Profile loading is non-blocking - if it fails, a minimal profile is used so users can proceed.

### Supabase Keys
Must use **legacy JWT format** keys (start with `eyJ...`). New format (`sb_...`) doesn't work.

### Netlify Environment Variables
Set WITHOUT `--scope` flag:
```bash
netlify env:set STRIPE_SECRET_KEY "sk_live_..."
```

After changing env vars, deploy with:
```bash
netlify deploy --prod --skip-functions-cache
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Supabase client (minimal auth config) |
| `src/contexts/AuthContext.tsx` | Manual auth session handling |
| `src/pages/Dashboard.tsx` | Main app - timer, milestones, payment overlay |
| `src/pages/Landing.tsx` | Login page |
| `src/pages/Test.tsx` | Debug/diagnostic page at /test |
| `src/lib/stripe.ts` | Stripe checkout with step logging |
| `netlify/functions/stripe-webhook.ts` | Handles payment completion (200 days) |

## Environment Variables

### Frontend (.env.local)
```
VITE_SUPABASE_URL=https://mlimixgmnkhjgjutoncr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51SDrgULjCULrSd7w...
VITE_STRIPE_FAST_PRICE_ID=price_1SmAi5LjCULrSd7wKBcYfaj1
```

### Netlify Functions
```
SUPABASE_URL, SUPABASE_SERVICE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
```

## Commands

```bash
npm run dev          # Local development
npm run build        # Build for production
netlify deploy --prod --skip-functions-cache  # Deploy
```

## Debugging

- Check `/test` page for Supabase connectivity diagnostics
- `stripe.ts` has step-by-step console logging for payment flow
- If payment button shows alert but 502 error, check Netlify env vars

## Payment Logic

**Important**: `canStartFast()` in `supabase.ts` checks `paid_until` FIRST before subscription status. This allows users who paid $5 (200 days) to start unlimited fasts even with `subscription_status: 'free'`.

## Stripe Integration

**Important**: `stripe.redirectToCheckout()` was deprecated in late 2025. We use direct URL redirect:
```typescript
const { url } = await createCheckoutSession(...);
window.location.href = url;
```

The checkout function returns both `sessionId` and `url` from the Netlify function.

## Share Feature

Users can share their fasting progress with friends:
- Share button on active fasts and past fasts in history
- Options: include name, include journal entries
- Share via WhatsApp, SMS, or native share (Web Share API)
- Copy link also available
- Public share page at `/share/:token`

### Share Database
```sql
fast_shares (
  id, fasting_id, user_id, share_token,
  sharer_name, include_notes, view_count, created_at
)
```

Public access via Supabase functions:
- `get_shared_fast(token)` - returns fast data, increments view count
- `get_shared_fast_notes(token)` - returns notes if include_notes is true

## Database

Supabase PostgreSQL with RLS. Key tables:
- `profiles` - user data, `paid_until` timestamp
- `fasting_sessions` - fast records
- `fasting_notes` - mood/energy logs
- `fast_shares` - shareable links for fasts
