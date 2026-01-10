-- Fix RLS policies for share groups
-- Run this in Supabase SQL Editor

-- Drop old policies
DROP POLICY IF EXISTS "Authenticated users can create groups" ON share_groups;
DROP POLICY IF EXISTS "Users can join groups" ON share_group_members;

-- Allow any authenticated user to create groups
CREATE POLICY "Authenticated users can create groups" ON share_groups
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow any authenticated user to join groups
CREATE POLICY "Users can join groups" ON share_group_members
  FOR INSERT TO authenticated WITH CHECK (true);
