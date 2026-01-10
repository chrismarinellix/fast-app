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
| `src/lib/supabase.ts` | Supabase client, auth, fasting, and share functions |
| `src/contexts/AuthContext.tsx` | Manual auth session handling |
| `src/pages/Dashboard.tsx` | Main app - timer, milestones, sharing, history |
| `src/pages/ShareView.tsx` | Public share page with live timer |
| `src/pages/GroupView.tsx` | Group fasting page for viewing group members' fasts |
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

Users can share their fasting progress with friends for mutual accountability.

### How It Works
1. User clicks "Share" on active fast or past fasts in History
2. Enters their name and chooses whether to include journal entries
3. Gets a unique share link (12-character token, not the raw fast ID)
4. Shares via WhatsApp, SMS, native share sheet, or copy link
5. Link stays active until manually deleted

### Share Modal Flow
- **Step 1**: Enter name + toggle "Include Your Journey" (defaults to OFF)
- **Step 2**: See share link + WhatsApp/SMS/More Options buttons

### ShareView Page (`/share/:token`)
- Shows live-updating timer (seconds tick in real-time for ongoing fasts)
- Displays milestone reached, duration, status
- Shows journal entries if sharer opted in
- "Share your fast back!" CTA encourages reciprocal sharing
- "Not fasting yet?" message for viewers who haven't started

### Share Management
- History panel shows "Active Shares" section with view counts
- Copy link button on each share
- Delete button to revoke shares
- Shares persist until deleted (no expiration)

### Key Functions (supabase.ts)
- `createShare(fastId, userId, name, includeNotes)` - creates share with unique token
- `getExistingShare(fastId, userId)` - checks if share already exists
- `getUserShares(userId)` - gets all shares for a user
- `deleteShare(shareId, userId)` - revokes a share
- `getSharedFast(token)` - public access, increments view count
- `getSharedFastNotes(fastId)` - gets notes if include_notes is true

### Share Database
```sql
fast_shares (
  id UUID PRIMARY KEY,
  fasting_id UUID REFERENCES fasting_sessions(id),
  user_id UUID REFERENCES profiles(id),
  share_token VARCHAR(32) UNIQUE,  -- 12-char random token
  sharer_name TEXT,
  include_notes BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ
)
```

## Share Groups Feature

Users can create fasting groups to fast together with friends. All group members can see each other's fasting progress in real-time.

### How It Works
1. User clicks "Create Group" in History panel → enters group name
2. Gets redirected to group page with unique invite code
3. Shares invite link with friends (WhatsApp, SMS, copy link)
4. Friends join via invite link → enter their name → see group
5. All members can see who's currently fasting with live timers

### GroupView Page (`/group/:inviteCode`)
- Shows group name and member count
- "Currently Fasting" section with live timers for active fasts
- "Group Members" section showing members not currently fasting
- Join/Leave buttons for group management
- Invite link copying for sharing
- "Start Fasting" CTA for members not currently fasting

### Group Management (Dashboard History Panel)
- "Fasting Groups" section shows all groups user belongs to
- "Create Group" button opens modal
- View button navigates to group page
- Invite button copies invite link

### Key Functions (supabase.ts)
- `createShareGroup(name, userId, displayName)` - creates group with 8-char invite code
- `getGroupByInviteCode(inviteCode)` - fetches group by code
- `joinShareGroup(groupId, userId, displayName)` - joins a group
- `leaveShareGroup(groupId, userId)` - leaves a group
- `getUserGroups(userId)` - gets all groups for a user
- `getGroupMembers(groupId)` - gets members with their current/recent fasts
- `getGroupDetails(inviteCode)` - gets group + members for group view
- `deleteShareGroup(groupId, userId)` - deletes group (creator only)

### Share Groups Database
```sql
-- Run this SQL in Supabase SQL Editor to create the tables

-- Groups table
CREATE TABLE share_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  invite_code VARCHAR(12) UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group memberships
CREATE TABLE share_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES share_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  display_name VARCHAR(100) NOT NULL,
  include_notes BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE share_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for share_groups
CREATE POLICY "Users can view groups they belong to" ON share_groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM share_group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view groups by invite code" ON share_groups
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create groups" ON share_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups" ON share_groups
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for share_group_members
CREATE POLICY "Users can view group members" ON share_group_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join groups" ON share_group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" ON share_group_members
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own membership" ON share_group_members
  FOR UPDATE USING (auth.uid() = user_id);

-- Optional: RPC function for public access to group by invite code
CREATE OR REPLACE FUNCTION get_group_by_invite_code(code TEXT)
RETURNS TABLE (
  id UUID,
  name VARCHAR(100),
  invite_code VARCHAR(12),
  created_by UUID,
  created_at TIMESTAMPTZ
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT g.id, g.name, g.invite_code, g.created_by, g.created_at
  FROM share_groups g
  WHERE UPPER(g.invite_code) = UPPER(code);
END;
$$ LANGUAGE plpgsql;
```

## Database

Supabase PostgreSQL with RLS. Key tables:
- `profiles` - user data, `paid_until` timestamp
- `fasting_sessions` - fast records
- `fasting_notes` - mood/energy logs
- `fast_shares` - shareable links for fasts
- `share_groups` - fasting groups
- `share_group_members` - group memberships
