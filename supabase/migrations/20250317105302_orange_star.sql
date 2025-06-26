/*
  # Fix Infinite Recursion in RLS Policies

  1. Changes
    - Simplify project_shares policies to avoid recursion
    - Update productions policies to avoid circular dependencies
    - Add proper indexes for performance

  2. Security
    - Maintain data isolation
    - Keep proper access control
    - Fix infinite recursion issues
*/

-- Drop existing policies
DROP POLICY IF EXISTS "ps_read_policy" ON project_shares;
DROP POLICY IF EXISTS "ps_insert_policy" ON project_shares;
DROP POLICY IF EXISTS "ps_update_policy" ON project_shares;
DROP POLICY IF EXISTS "ps_delete_policy" ON project_shares;

-- Create new simplified policies for project_shares
CREATE POLICY "ps_read_policy_v2"
ON project_shares
FOR SELECT
TO authenticated
USING (
  -- User can read shares if they:
  -- 1. Are the owner of the project
  -- 2. Are the shared user
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND projects.owner_id = auth.uid()
  )
  OR user_id = auth.uid()
);

CREATE POLICY "ps_write_policy_v2"
ON project_shares
FOR INSERT
TO authenticated
WITH CHECK (
  -- User can create shares if they own the project
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND projects.owner_id = auth.uid()
  )
);

CREATE POLICY "ps_update_policy_v2"
ON project_shares
FOR UPDATE
TO authenticated
USING (
  -- User can update shares if they own the project
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND projects.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND projects.owner_id = auth.uid()
  )
);

CREATE POLICY "ps_delete_policy_v2"
ON project_shares
FOR DELETE
TO authenticated
USING (
  -- User can delete shares if they own the project
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND projects.owner_id = auth.uid()
  )
);

-- Drop existing productions policies
DROP POLICY IF EXISTS "productions_read_policy" ON productions;
DROP POLICY IF EXISTS "productions_write_policy" ON productions;
DROP POLICY IF EXISTS "productions_update_policy" ON productions;
DROP POLICY IF EXISTS "productions_delete_policy" ON productions;

-- Create new simplified productions policies
CREATE POLICY "productions_read_policy_v2"
ON productions
FOR SELECT
TO authenticated
USING (
  -- User can read productions if they:
  -- 1. Own the production
  -- 2. Own a project linked to this production
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM projects
    WHERE projects.production_id = id
    AND projects.owner_id = auth.uid()
  )
);

CREATE POLICY "productions_write_policy_v2"
ON productions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "productions_update_policy_v2"
ON productions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "productions_delete_policy_v2"
ON productions
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_shares_project_id_user_id_v2
ON project_shares(project_id, user_id);

CREATE INDEX IF NOT EXISTS idx_productions_user_id_v2
ON productions(user_id);

-- Ensure RLS is enabled
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE productions ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON project_shares TO authenticated;
GRANT ALL ON productions TO authenticated;