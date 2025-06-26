/*
  # Fix Projects RLS Recursion

  1. Changes
    - Drop existing recursive policies for projects
    - Create new non-recursive policies with simplified conditions
    - Add proper indexes for performance

  2. Security
    - Maintain data isolation between users
    - Keep proper access control
    - Fix infinite recursion in projects policies
*/

-- Drop existing project policies
DROP POLICY IF EXISTS "projects_read_policy_v4" ON projects;
DROP POLICY IF EXISTS "projects_insert_policy_v4" ON projects;
DROP POLICY IF EXISTS "projects_update_policy_v4" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy_v4" ON projects;

-- Create new simplified project policies
CREATE POLICY "projects_read_policy_v5"
ON projects
FOR SELECT
TO authenticated
USING (
  -- Direct ownership
  owner_id = auth.uid()
  -- Direct share
  OR id IN (
    SELECT project_id 
    FROM project_shares 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "projects_insert_policy_v5"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects_update_policy_v5"
ON projects
FOR UPDATE
TO authenticated
USING (
  -- Direct ownership
  owner_id = auth.uid()
  -- Direct share with edit permission
  OR id IN (
    SELECT project_id 
    FROM project_shares 
    WHERE user_id = auth.uid() 
    AND can_edit = true
  )
);

CREATE POLICY "projects_delete_policy_v5"
ON projects
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Drop existing indexes
DROP INDEX IF EXISTS idx_projects_owner_id_v3;
DROP INDEX IF EXISTS idx_projects_production_id_v2;

-- Create optimized indexes
CREATE INDEX idx_projects_owner_id_v4 ON projects(owner_id);
CREATE INDEX idx_projects_owner_id_archived_v1 ON projects(owner_id, archived);

-- Ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON projects TO authenticated;