/*
  # Fix Projects Policies

  1. Changes
    - Drop existing recursive policies
    - Create new non-recursive policies for projects
    - Simplify access control logic

  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
    - Keep data isolation between users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Projects read access" ON projects;
DROP POLICY IF EXISTS "Projects insert access" ON projects;
DROP POLICY IF EXISTS "Projects update access" ON projects;
DROP POLICY IF EXISTS "Projects delete access" ON projects;
DROP POLICY IF EXISTS "Projects access control" ON projects;

-- Create new non-recursive policies
CREATE POLICY "projects_read_policy"
ON projects
FOR SELECT
TO authenticated
USING (
  -- User can read projects if they:
  -- 1. Own the project
  -- 2. Have a direct share
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM project_shares
    WHERE project_shares.project_id = id
    AND project_shares.user_id = auth.uid()
  )
);

CREATE POLICY "projects_insert_policy"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (
  -- Users can only create projects they own
  owner_id = auth.uid()
);

CREATE POLICY "projects_update_policy"
ON projects
FOR UPDATE
TO authenticated
USING (
  -- User can update if they:
  -- 1. Own the project
  -- 2. Have a share with edit permission
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM project_shares
    WHERE project_shares.project_id = id
    AND project_shares.user_id = auth.uid()
    AND project_shares.can_edit = true
  )
)
WITH CHECK (
  -- Same conditions as USING clause
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM project_shares
    WHERE project_shares.project_id = id
    AND project_shares.user_id = auth.uid()
    AND project_shares.can_edit = true
  )
);

CREATE POLICY "projects_delete_policy"
ON projects
FOR DELETE
TO authenticated
USING (
  -- Only project owners can delete projects
  owner_id = auth.uid()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_projects_owner_id 
ON projects(owner_id);

-- Ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;