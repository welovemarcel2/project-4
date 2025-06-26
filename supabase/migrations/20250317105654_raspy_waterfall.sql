/*
  # Fix RLS Policies Recursion

  1. Changes
    - Drop existing recursive policies
    - Create new non-recursive policies for projects and users
    - Fix policy dependencies to prevent infinite recursion
    - Add proper indexes for performance

  2. Security
    - Maintain proper access control
    - Ensure data isolation between users
    - Allow necessary data access patterns
*/

-- Drop existing policies
DROP POLICY IF EXISTS "projects_read_policy_v3" ON projects;
DROP POLICY IF EXISTS "projects_insert_policy_v3" ON projects;
DROP POLICY IF EXISTS "projects_update_policy_v3" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy_v3" ON projects;
DROP POLICY IF EXISTS "users_read_policy_v4" ON users;
DROP POLICY IF EXISTS "users_write_policy_v4" ON users;
DROP POLICY IF EXISTS "users_update_policy_v4" ON users;

-- Create new non-recursive projects policies
CREATE POLICY "projects_read_policy_v4"
ON projects
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR id IN (
    SELECT project_id FROM project_shares
    WHERE user_id = auth.uid()
  )
  OR production_id IN (
    SELECT id FROM productions
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "projects_insert_policy_v4"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects_update_policy_v4"
ON projects
FOR UPDATE
TO authenticated
USING (
  owner_id = auth.uid()
  OR id IN (
    SELECT project_id FROM project_shares
    WHERE user_id = auth.uid()
    AND can_edit = true
  )
  OR production_id IN (
    SELECT id FROM productions
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "projects_delete_policy_v4"
ON projects
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Create new non-recursive users policies
CREATE POLICY "users_read_policy_v5"
ON users
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR role = 'production'
  OR id IN (
    SELECT user_id FROM productions
    WHERE id IN (
      SELECT production_id FROM projects
      WHERE owner_id = auth.uid()
    )
  )
);

CREATE POLICY "users_write_policy_v5"
ON users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "users_update_policy_v5"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Create or update indexes
DROP INDEX IF EXISTS idx_projects_owner_id_v2;
CREATE INDEX idx_projects_owner_id_v3 ON projects(owner_id);
CREATE INDEX idx_projects_production_id_v2 ON projects(production_id);

-- Ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON projects TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;