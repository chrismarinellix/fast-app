# Fast! App - Debugging Log

## SOLVED: Auth Loading Forever

### Root Cause
The default Supabase JS client auth configuration causes the client to hang when `autoRefreshToken`, `persistSession`, and `detectSessionInUrl` are enabled. Direct fetch requests to Supabase work fine, but the client times out.

### Solution
Use minimal auth config and handle sessions manually:

```typescript
// src/lib/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
```

Then in AuthContext.tsx, manually:
1. Detect tokens in URL hash (`access_token`, `refresh_token`)
2. Call `supabase.auth.setSession()` with extracted tokens
3. Store session in localStorage (`fast-app-session` key)
4. Restore session from localStorage on app load

### Key Files Modified
- `src/lib/supabase.ts` - Minimal client config + withTimeout helper
- `src/contexts/AuthContext.tsx` - Manual session handling

---

## SOLVED: 502 Error on Netlify Functions

### Root Cause
Environment variables set with `netlify env:set VAR --scope functions` don't work properly. The variables weren't available to the functions.

### Solution
Set env vars without the `--scope` flag:
```bash
netlify env:set STRIPE_SECRET_KEY "sk_live_..."
netlify env:set SUPABASE_URL "https://xxx.supabase.co"
netlify env:set SUPABASE_SERVICE_KEY "eyJ..."
netlify env:set STRIPE_WEBHOOK_SECRET "whsec_..."
```

Then deploy with fresh functions cache:
```bash
netlify deploy --prod --skip-functions-cache
```

---

## SOLVED: Legacy vs New Supabase Keys

### Issue
New format Supabase keys (`sb_publishable_...`) don't work with Supabase JS client.

### Solution
Use legacy JWT format keys that start with `eyJ...`. These can be regenerated in Supabase Dashboard > Settings > API > Scroll down to "Legacy API Keys".

---

## Debug Tools

### Test Page
Created `/test` route (`src/pages/Test.tsx`) with diagnostic tests:
- Direct fetch to Supabase
- Minimal client test
- Full auth test
- Environment check

### Console Logging
Added step-by-step logging in `src/lib/stripe.ts`:
```
Step 1: Loading Stripe...
Step 2: Stripe loaded, creating checkout session...
Step 3: Session created: cs_xxx
Step 4: Redirecting to Stripe checkout...
```

---

---

## SOLVED: Payment Loop - canStartFast Not Checking paid_until

### Issue
Users who paid were still being asked to pay again when starting a new fast.

### Root Cause
The `canStartFast()` function in `supabase.ts` only checked `subscription_status`, not `paid_until`. So even with a valid `paid_until` date in the future, users with `subscription_status: 'free'` couldn't start more than 1 fast.

### Solution
Updated `canStartFast()` to check `paid_until` first:
```typescript
export async function canStartFast(profile: UserProfile): Promise<boolean> {
  // Check if user has paid access (paid_until in the future)
  if (profile.paid_until && new Date(profile.paid_until) > new Date()) {
    return true; // Paid users can fast unlimited
  }
  // Free users can do 1 fast
  if (profile.subscription_status === 'free') {
    return profile.fasts_completed < 1;
  }
  return profile.subscription_status === 'active';
}
```

---

## SOLVED: stripe.redirectToCheckout Deprecated

### Issue
Stripe removed `stripe.redirectToCheckout()` in late 2025. Error: "stripe.redirectToCheckout is no longer supported in this version of Stripe.js"

### Solution
1. Update `create-checkout.ts` to return the session URL:
```typescript
body: JSON.stringify({ sessionId: session.id, url: session.url }),
```

2. Update `stripe.ts` to redirect using `window.location.href`:
```typescript
const { sessionId, url } = await createCheckoutSession(...);
window.location.href = url;  // Instead of stripe.redirectToCheckout()
```

---

## Environment

| Service | Value |
|---------|-------|
| Frontend | React 19 + Vite + TypeScript |
| Auth | Supabase (Magic Link + Google OAuth) |
| Hosting | Netlify |
| Database | Supabase PostgreSQL |
| Payments | Stripe |
| Live URL | https://fast-fasting-app.netlify.app |
