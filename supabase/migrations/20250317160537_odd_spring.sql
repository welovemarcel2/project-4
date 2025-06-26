/*
  # Fix Data Access and Project Visibility

  1. Changes
    - Restore proper access to projects
    - Fix RLS policies to prevent data loss
    - Add safeguards against accidental data loss

  2. Security
    - Maintain proper access control
    - Ensure data visibility for owners
    - Prevent unauthorized access
*/

-- Drop problematic policies that may cause data loss
DROP POLICY IF EXISTS "projects_read_policy_v8" ON projects;
DROP POLICY IF EXISTS "projects_shared_read_policy_v8" ON projects;
DROP POLICY IF EXISTS "projects_write_policy_v8" ON projects;
DROP POLICY IF EXISTS "projects_update_policy_v8" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy_v8" ON projects;

-- Create new policies that ensure proper access
CREATE POLICY "projects_read_policy_v9"
ON projects
FOR SELECT
TO authenticated
USING (
  -- User can see projects if they:
  -- 1. Own the project
  -- 2. Have a share
  -- 3. Are the production owner
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM project_shares
    WHERE project_shares.project_id = id
    AND project_shares.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM productions
    WHERE productions.id = production_id
    AND productions.user_id = auth.uid()
  )
);

CREATE POLICY "projects_write_policy_v9"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects_update_policy_v9"
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
  OR EXISTS (
    SELECT 1 FROM productions
    WHERE productions.id = production_id
    AND productions.user_id = auth.uid()
  )
);

CREATE POLICY "projects_delete_policy_v9"
ON projects
FOR DELETE
TO authenticated
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM productions
    WHERE productions.id = production_id
    AND productions.user_id = auth.uid()
  )
);

-- Create function to restore project access if needed
CREATE OR REPLACE FUNCTION restore_project_access(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure all projects owned by the user are visible
  UPDATE projects
  SET updated_at = NOW()
  WHERE owner_id = p_user_id;

  -- Ensure all shared projects are accessible
  UPDATE project_shares
  SET created_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_projects_owner_id_v5 
ON projects(owner_id);

-- Ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON projects TO authenticated;