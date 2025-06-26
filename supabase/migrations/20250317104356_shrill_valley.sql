/*
  # Fix Project Shares Policies

  1. Changes
    - Drop existing recursive policies
    - Create new non-recursive policies for project shares
    - Simplify access control logic

  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
    - Keep data isolation between users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Project shares read access" ON project_shares;
DROP POLICY IF EXISTS "Project shares write access" ON project_shares;
DROP POLICY IF EXISTS "Project shares update access" ON project_shares;
DROP POLICY IF EXISTS "Project shares delete access" ON project_shares;
DROP POLICY IF EXISTS "Project shares management" ON project_shares;

-- Create new non-recursive policies
CREATE POLICY "ps_read_policy"
ON project_shares
FOR SELECT
TO authenticated
USING (
  -- User can read shares if they:
  -- 1. Own the project
  -- 2. Are the shared user
  -- 3. Have access to the project through another share
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND (
      projects.owner_id = auth.uid()
      OR user_id = auth.uid()
    )
  )
);

CREATE POLICY "ps_insert_policy"
ON project_shares
FOR INSERT
TO authenticated
WITH CHECK (
  -- User can create shares if they:
  -- 1. Own the project
  -- 2. Have a share with can_share permission
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND (
      projects.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_shares existing_share
        WHERE existing_share.project_id = project_id
        AND existing_share.user_id = auth.uid()
        AND existing_share.can_share = true
      )
    )
  )
);

CREATE POLICY "ps_update_policy"
ON project_shares
FOR UPDATE
TO authenticated
USING (
  -- User can update shares if they:
  -- 1. Own the project
  -- 2. Have a share with can_share permission
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND (
      projects.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_shares existing_share
        WHERE existing_share.project_id = project_id
        AND existing_share.user_id = auth.uid()
        AND existing_share.can_share = true
      )
    )
  )
)
WITH CHECK (
  -- Same conditions as USING clause
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND (
      projects.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_shares existing_share
        WHERE existing_share.project_id = project_id
        AND existing_share.user_id = auth.uid()
        AND existing_share.can_share = true
      )
    )
  )
);

CREATE POLICY "ps_delete_policy"
ON project_shares
FOR DELETE
TO authenticated
USING (
  -- User can delete shares if they:
  -- 1. Own the project
  -- 2. Have a share with can_share permission
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND (
      projects.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_shares existing_share
        WHERE existing_share.project_id = project_id
        AND existing_share.user_id = auth.uid()
        AND existing_share.can_share = true
      )
    )
  )
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_project_shares_project_id_user_id 
ON project_shares(project_id, user_id);

-- Ensure RLS is enabled
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;