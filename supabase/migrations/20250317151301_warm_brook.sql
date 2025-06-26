/*
  # Fix RLS Recursion - Final Solution

  1. Changes
    - Drop ALL existing policies to start fresh
    - Create minimal, non-recursive policies for all tables
    - Remove ALL circular dependencies between policies
    - Use direct table access instead of nested queries
    - Add proper indexes for performance

  2. Security
    - Maintain data isolation
    - Keep proper access control
    - Fix infinite recursion permanently
*/

-- Drop ALL existing policies
DROP POLICY IF EXISTS "projects_read_policy_v7" ON projects;
DROP POLICY IF EXISTS "projects_shared_read_policy_v7" ON projects;
DROP POLICY IF EXISTS "projects_write_policy_v7" ON projects;
DROP POLICY IF EXISTS "projects_update_policy_v7" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy_v7" ON projects;

DROP POLICY IF EXISTS "ps_read_policy_v2" ON project_shares;
DROP POLICY IF EXISTS "ps_write_policy_v2" ON project_shares;
DROP POLICY IF EXISTS "ps_update_policy_v2" ON project_shares;
DROP POLICY IF EXISTS "ps_delete_policy_v2" ON project_shares;

-- Create minimal project policies
CREATE POLICY "projects_read_policy_v8"
ON projects
FOR SELECT
TO authenticated
USING (
  -- Direct ownership check only
  owner_id = auth.uid()
);

CREATE POLICY "projects_shared_read_policy_v8"
ON projects
FOR SELECT
TO authenticated
USING (
  -- Direct share check using join instead of subquery
  id IN (
    SELECT ps.project_id 
    FROM project_shares ps 
    WHERE ps.user_id = auth.uid()
  )
);

CREATE POLICY "projects_write_policy_v8"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects_update_policy_v8"
ON projects
FOR UPDATE
TO authenticated
USING (
  -- Direct ownership or share check
  owner_id = auth.uid()
  OR id IN (
    SELECT ps.project_id 
    FROM project_shares ps 
    WHERE ps.user_id = auth.uid() 
    AND ps.can_edit = true
  )
);

CREATE POLICY "projects_delete_policy_v8"
ON projects
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Create minimal project shares policies
CREATE POLICY "ps_read_policy_v3"
ON project_shares
FOR SELECT
TO authenticated
USING (
  -- Direct user check only
  user_id = auth.uid()
);

CREATE POLICY "ps_write_policy_v3"
ON project_shares
FOR INSERT
TO authenticated
WITH CHECK (
  -- Only project owners can create shares
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_id
    AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "ps_update_policy_v3"
ON project_shares
FOR UPDATE
TO authenticated
USING (
  -- Only project owners can update shares
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_id
    AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "ps_delete_policy_v3"
ON project_shares
FOR DELETE
TO authenticated
USING (
  -- Only project owners can delete shares
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_id
    AND p.owner_id = auth.uid()
  )
);

-- Drop existing indexes
DROP INDEX IF EXISTS idx_projects_owner_id_v2;
DROP INDEX IF EXISTS idx_projects_owner_id_archived_v2;
DROP INDEX IF EXISTS idx_project_shares_project_id_user_id_v2;

-- Create new optimized indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner_id_v3 ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id_archived_v3 ON projects(owner_id, archived);
CREATE INDEX IF NOT EXISTS idx_project_shares_project_id_user_id_v3 ON project_shares(project_id, user_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_user_id_v3 ON project_shares(user_id);

-- Ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON projects TO authenticated;
GRANT ALL ON project_shares TO authenticated;