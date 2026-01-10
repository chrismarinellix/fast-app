-- Share Groups Database Setup for Fast! App
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/mlimixgmnkhjgjutoncr/sql)

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
CREATE POLICY "Anyone can view groups" ON share_groups
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create groups" ON share_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups" ON share_groups
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for share_group_members
CREATE POLICY "Anyone can view group members" ON share_group_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join groups" ON share_group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" ON share_group_members
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own membership" ON share_group_members
  FOR UPDATE USING (auth.uid() = user_id);

-- RPC function for public access to group by invite code
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
