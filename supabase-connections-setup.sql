-- Share Connections - 1-to-1 reciprocal sharing
-- Run this SQL in Supabase SQL Editor

-- Drop existing groups tables if desired (optional - keep for migration)
-- DROP TABLE IF EXISTS share_group_members CASCADE;
-- DROP TABLE IF EXISTS share_groups CASCADE;

-- Create share_connections table for direct 1-to-1 sharing
CREATE TABLE IF NOT EXISTS share_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,  -- initiator
  user_b UUID REFERENCES profiles(id) ON DELETE CASCADE,           -- recipient (null until accepted)
  invite_code VARCHAR(12) UNIQUE NOT NULL,
  display_name_a VARCHAR(100) NOT NULL,
  display_name_b VARCHAR(100),                                     -- filled when B accepts
  show_network_to_b BOOLEAN DEFAULT FALSE,                         -- can B see A's other connections?
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(user_a, user_b)                                           -- prevent duplicate connections
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_connections_user_a ON share_connections(user_a);
CREATE INDEX IF NOT EXISTS idx_connections_user_b ON share_connections(user_b);
CREATE INDEX IF NOT EXISTS idx_connections_invite_code ON share_connections(invite_code);

-- Enable RLS
ALTER TABLE share_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own connections (where they are user_a or user_b)
CREATE POLICY "Users can view their own connections" ON share_connections
  FOR SELECT USING (
    auth.uid() = user_a OR auth.uid() = user_b
  );

-- Anyone can view connection by invite code (for accepting invites)
CREATE POLICY "Anyone can view by invite code" ON share_connections
  FOR SELECT USING (true);

-- Authenticated users can create connections
CREATE POLICY "Authenticated users can create connections" ON share_connections
  FOR INSERT WITH CHECK (auth.uid() = user_a);

-- Users can update connections they're part of (for accepting)
CREATE POLICY "Users can update their connections" ON share_connections
  FOR UPDATE USING (
    auth.uid() = user_a OR (auth.uid() IS NOT NULL AND user_b IS NULL)
  );

-- Users can delete connections they created or accepted
CREATE POLICY "Users can delete their connections" ON share_connections
  FOR DELETE USING (
    auth.uid() = user_a OR auth.uid() = user_b
  );

-- RPC function to get connection by invite code (public access for invites)
CREATE OR REPLACE FUNCTION get_connection_by_invite_code(code TEXT)
RETURNS TABLE (
  id UUID,
  user_a UUID,
  user_b UUID,
  invite_code VARCHAR(12),
  display_name_a VARCHAR(100),
  display_name_b VARCHAR(100),
  show_network_to_b BOOLEAN,
  created_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.user_a, c.user_b, c.invite_code, c.display_name_a,
         c.display_name_b, c.show_network_to_b, c.created_at, c.accepted_at
  FROM share_connections c
  WHERE UPPER(c.invite_code) = UPPER(code);
END;
$$ LANGUAGE plpgsql;

-- RPC function to get user's connections with their current fasts
CREATE OR REPLACE FUNCTION get_user_connections_with_fasts(p_user_id UUID)
RETURNS TABLE (
  connection_id UUID,
  connected_user_id UUID,
  display_name VARCHAR(100),
  is_initiator BOOLEAN,
  show_network BOOLEAN,
  connected_at TIMESTAMPTZ,
  current_fast_id UUID,
  current_fast_start TIMESTAMPTZ,
  current_fast_target INTEGER
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as connection_id,
    CASE WHEN c.user_a = p_user_id THEN c.user_b ELSE c.user_a END as connected_user_id,
    CASE WHEN c.user_a = p_user_id THEN c.display_name_b ELSE c.display_name_a END as display_name,
    c.user_a = p_user_id as is_initiator,
    -- Show network only if: I'm user_b AND user_a enabled it, OR I'm user_a (I can always see my network)
    CASE
      WHEN c.user_a = p_user_id THEN true
      WHEN c.user_b = p_user_id AND c.show_network_to_b THEN true
      ELSE false
    END as show_network,
    c.accepted_at as connected_at,
    f.id as current_fast_id,
    f.start_time as current_fast_start,
    f.target_hours as current_fast_target
  FROM share_connections c
  LEFT JOIN fasting_sessions f ON (
    f.user_id = CASE WHEN c.user_a = p_user_id THEN c.user_b ELSE c.user_a END
    AND f.end_time IS NULL
  )
  WHERE (c.user_a = p_user_id OR c.user_b = p_user_id)
    AND c.accepted_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- RPC function to accept a connection invite
CREATE OR REPLACE FUNCTION accept_share_connection(
  p_invite_code TEXT,
  p_user_id UUID,
  p_display_name TEXT
)
RETURNS TABLE (
  id UUID,
  user_a UUID,
  user_b UUID,
  display_name_a VARCHAR(100),
  display_name_b VARCHAR(100),
  show_network_to_b BOOLEAN,
  accepted_at TIMESTAMPTZ
) SECURITY DEFINER AS $$
DECLARE
  v_connection share_connections%ROWTYPE;
BEGIN
  -- Get the connection
  SELECT * INTO v_connection
  FROM share_connections c
  WHERE UPPER(c.invite_code) = UPPER(p_invite_code);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Connection not found';
  END IF;

  IF v_connection.user_b IS NOT NULL THEN
    RAISE EXCEPTION 'Connection already accepted';
  END IF;

  IF v_connection.user_a = p_user_id THEN
    RAISE EXCEPTION 'Cannot accept your own invite';
  END IF;

  -- Update the connection
  UPDATE share_connections c
  SET user_b = p_user_id,
      display_name_b = p_display_name,
      accepted_at = NOW()
  WHERE c.id = v_connection.id
  RETURNING c.id, c.user_a, c.user_b, c.display_name_a, c.display_name_b,
            c.show_network_to_b, c.accepted_at
  INTO id, user_a, user_b, display_name_a, display_name_b, show_network_to_b, accepted_at;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
