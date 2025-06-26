/*
  # Fix Quotes RLS Policies

  1. Changes
    - Drop existing policies
    - Create new policies that properly handle deleted quotes
    - Add proper access control based on project ownership and sharing

  2. Security
    - Maintain data isolation between users
    - Keep proper access control
    - Ensure deleted quotes are filtered out
*/

-- Drop existing policies
DROP POLICY IF EXISTS "quotes_read_policy_v13" ON quotes;
DROP POLICY IF EXISTS "quotes_write_policy_v13" ON quotes;
DROP POLICY IF EXISTS "quotes_update_policy_v13" ON quotes;
DROP POLICY IF EXISTS "quotes_delete_policy_v13" ON quotes;

-- Create new policies
CREATE POLICY "quotes_read_policy_v14"
ON quotes
FOR SELECT
TO authenticated
USING (
  -- Only show non-deleted quotes that the user has access to
  NOT is_deleted
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
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

CREATE POLICY "quotes_write_policy_v14"
ON quotes
FOR INSERT
TO authenticated
WITH CHECK (
  -- Cannot create deleted quotes
  NOT is_deleted
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND (
      projects.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_shares
        WHERE project_shares.project_id = projects.id
        AND project_shares.user_id = auth.uid()
        AND project_shares.can_edit = true
      )
    )
  )
);

CREATE POLICY "quotes_update_policy_v14"
ON quotes
FOR UPDATE
TO authenticated
USING (
  -- Can update any quote (including deleted ones) if user has permission
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND (
      projects.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_shares
        WHERE project_shares.project_id = projects.id
        AND project_shares.user_id = auth.uid()
        AND project_shares.can_edit = true
      )
    )
  )
)
WITH CHECK (
  -- Same permission check for updates
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND (
      projects.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_shares
        WHERE project_shares.project_id = projects.id
        AND project_shares.user_id = auth.uid()
        AND project_shares.can_edit = true
      )
    )
  )
);

CREATE POLICY "quotes_delete_policy_v14"
ON quotes
FOR DELETE
TO authenticated
USING (
  -- Can only physically delete if user has permission
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND (
      projects.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_shares
        WHERE project_shares.project_id = projects.id
        AND project_shares.user_id = auth.uid()
        AND project_shares.can_edit = true
      )
    )
  )
);

-- Ensure RLS is enabled
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON quotes TO authenticated;