/*
  # Fix Projects RLS Recursion V3

  1. Changes
    - Drop existing project policies
    - Create new non-recursive policies with direct conditions
    - Add proper indexes for performance if they don't exist
    - Fix infinite recursion by avoiding circular dependencies

  2. Security
    - Maintain data isolation between users
    - Keep proper access control
    - Fix infinite recursion in projects policies
*/

-- Drop existing project policies
DROP POLICY IF EXISTS "projects_read_policy_v5" ON projects;
DROP POLICY IF EXISTS "projects_insert_policy_v5" ON projects;
DROP POLICY IF EXISTS "projects_update_policy_v5" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy_v5" ON projects;

-- Create new simplified project policies
CREATE POLICY "projects_read_policy_v6"
ON projects
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
);

CREATE POLICY "projects_shared_read_policy_v6"
ON projects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_shares
    WHERE project_shares.project_id = id
    AND project_shares.user_id = auth.uid()
  )
);

CREATE POLICY "projects_write_policy_v6"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects_update_policy_v6"
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

CREATE POLICY "projects_delete_policy_v6"
ON projects
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_projects_owner_id_v4;
DROP INDEX IF EXISTS idx_projects_owner_id_archived_v1;

-- Create optimized indexes if they don't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_projects_owner_id'
  ) THEN
    CREATE INDEX idx_projects_owner_id ON projects(owner_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_projects_owner_id_archived'
  ) THEN
    CREATE INDEX idx_projects_owner_id_archived ON projects(owner_id, archived);
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON projects TO authenticated;