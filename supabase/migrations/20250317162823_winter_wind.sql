/*
  # Fix Project Creation Policies

  1. Changes
    - Drop existing project policies
    - Create new policies that allow proper project creation
    - Fix permissions for project creation
    - Add proper indexes for performance

  2. Security
    - Maintain data isolation between users
    - Allow proper project creation
    - Keep access control for existing projects
*/

-- Drop existing project policies
DROP POLICY IF EXISTS "projects_read_policy_v9" ON projects;
DROP POLICY IF EXISTS "projects_write_policy_v9" ON projects;
DROP POLICY IF EXISTS "projects_update_policy_v9" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy_v9" ON projects;

-- Create new simplified project policies
CREATE POLICY "projects_read_policy_v10"
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

CREATE POLICY "projects_write_policy_v10"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow creating projects if:
  -- 1. User is the owner
  -- 2. User exists in the users table
  owner_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
  )
);

CREATE POLICY "projects_update_policy_v10"
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
);

CREATE POLICY "projects_delete_policy_v10"
ON projects
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Create optimized indexes if they don't exist
DO $$ 
BEGIN
  -- Drop old indexes if they exist
  DROP INDEX IF EXISTS idx_projects_owner_id_v4;
  DROP INDEX IF EXISTS idx_projects_owner_id_archived_v4;
  
  -- Create new indexes only if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_projects_owner_id_v6'
  ) THEN
    CREATE INDEX idx_projects_owner_id_v6 ON projects(owner_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_projects_owner_id_archived_v6'
  ) THEN
    CREATE INDEX idx_projects_owner_id_archived_v6 ON projects(owner_id, archived);
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON projects TO authenticated;