/*
  # Fix Project Access Policies

  1. Changes
    - Drop and recreate project access policies
    - Simplify policy conditions to avoid recursion
    - Add proper indexes for performance

  2. Security
    - Maintain data isolation between users
    - Allow proper access for project owners and shared users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "projects_read_policy" ON projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON projects;
DROP POLICY IF EXISTS "projects_update_policy" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON projects;

-- Create new policies with simpler conditions
CREATE POLICY "projects_read_policy_v2"
ON projects
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM project_shares
    WHERE project_shares.project_id = id
    AND project_shares.user_id = auth.uid()
  )
);

CREATE POLICY "projects_insert_policy_v2"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects_update_policy_v2"
ON projects
FOR UPDATE
TO authenticated
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM project_shares
    WHERE project_shares.project_id = id
    AND project_shares.user_id = auth.uid()
    AND project_shares.can_edit = true
  )
)
WITH CHECK (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM project_shares
    WHERE project_shares.project_id = id
    AND project_shares.user_id = auth.uid()
    AND project_shares.can_edit = true
  )
);

CREATE POLICY "projects_delete_policy_v2"
ON projects
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_projects_owner_id_v2 
ON projects(owner_id);

-- Grant necessary permissions
GRANT ALL ON projects TO authenticated;