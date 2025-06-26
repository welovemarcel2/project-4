/*
  # Fix Projects RLS Recursion V4

  1. Changes
    - Drop all existing project policies
    - Create new non-recursive policies with direct conditions
    - Simplify policy logic to avoid any potential circular dependencies
    - Add proper indexes for performance

  2. Security
    - Maintain data isolation between users
    - Keep proper access control
    - Fix infinite recursion by avoiding complex policy conditions
*/

-- Drop all existing project policies
DROP POLICY IF EXISTS "projects_read_policy_v6" ON projects;
DROP POLICY IF EXISTS "projects_shared_read_policy_v6" ON projects;
DROP POLICY IF EXISTS "projects_write_policy_v6" ON projects;
DROP POLICY IF EXISTS "projects_update_policy_v6" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy_v6" ON projects;

-- Create new simplified project policies
CREATE POLICY "projects_read_policy_v7"
ON projects
FOR SELECT
TO authenticated
USING (
  -- Simple direct ownership check
  owner_id = auth.uid()
);

CREATE POLICY "projects_shared_read_policy_v7"
ON projects
FOR SELECT
TO authenticated
USING (
  -- Simple direct share check
  id IN (
    SELECT project_id 
    FROM project_shares 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "projects_write_policy_v7"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (
  -- Only allow creating own projects
  owner_id = auth.uid()
);

CREATE POLICY "projects_update_policy_v7"
ON projects
FOR UPDATE
TO authenticated
USING (
  -- Allow update if owner or has edit permission
  owner_id = auth.uid()
  OR id IN (
    SELECT project_id 
    FROM project_shares 
    WHERE user_id = auth.uid() 
    AND can_edit = true
  )
);

CREATE POLICY "projects_delete_policy_v7"
ON projects
FOR DELETE
TO authenticated
USING (
  -- Only owners can delete
  owner_id = auth.uid()
);

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_projects_owner_id;
DROP INDEX IF EXISTS idx_projects_owner_id_archived;

-- Create optimized indexes if they don't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_projects_owner_id_v2'
  ) THEN
    CREATE INDEX idx_projects_owner_id_v2 ON projects(owner_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_projects_owner_id_archived_v2'
  ) THEN
    CREATE INDEX idx_projects_owner_id_archived_v2 ON projects(owner_id, archived);
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON projects TO authenticated;