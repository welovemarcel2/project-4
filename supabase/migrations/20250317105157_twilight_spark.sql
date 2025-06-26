/*
  # Fix Project and Production Access

  1. Changes
    - Update projects policies to allow access to archived projects
    - Update productions policies to allow proper access
    - Add indexes for better performance

  2. Security
    - Maintain RLS protection
    - Allow access to historical data
    - Keep proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "projects_read_policy_v2" ON projects;
DROP POLICY IF EXISTS "projects_insert_policy_v2" ON projects;
DROP POLICY IF EXISTS "projects_update_policy_v2" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy_v2" ON projects;
DROP POLICY IF EXISTS "Productions read access" ON productions;
DROP POLICY IF EXISTS "Productions write access" ON productions;
DROP POLICY IF EXISTS "Productions update access" ON productions;
DROP POLICY IF EXISTS "Productions delete access" ON productions;

-- Create new projects policies
CREATE POLICY "projects_read_policy_v3"
ON projects
FOR SELECT
TO authenticated
USING (
  -- Allow access if:
  -- 1. User owns the project
  -- 2. Project is shared with user
  -- 3. User is the production owner (through production_id)
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

CREATE POLICY "projects_insert_policy_v3"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects_update_policy_v3"
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
)
WITH CHECK (
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

CREATE POLICY "projects_delete_policy_v3"
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

-- Create new productions policies
CREATE POLICY "productions_read_policy"
ON productions
FOR SELECT
TO authenticated
USING (
  -- Allow access if:
  -- 1. User owns the production
  -- 2. User has access to a project linked to this production
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM projects
    WHERE projects.production_id = id
    AND (
      projects.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_shares
        WHERE project_shares.project_id = projects.id
        AND project_shares.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "productions_write_policy"
ON productions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "productions_update_policy"
ON productions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "productions_delete_policy"
ON productions
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_production_id 
ON projects(production_id);

CREATE INDEX IF NOT EXISTS idx_productions_user_id
ON productions(user_id);

-- Ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE productions ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON projects TO authenticated;
GRANT ALL ON productions TO authenticated;