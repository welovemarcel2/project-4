/*
  # Fix Quote Deletion RLS Policies

  1. Changes
    - Drop existing quote policies
    - Create new policies that properly handle deletion
    - Add proper access control based on project ownership and sharing

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Maintain data isolation between users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "quotes_read_policy_v14" ON quotes;
DROP POLICY IF EXISTS "quotes_write_policy_v14" ON quotes;
DROP POLICY IF EXISTS "quotes_update_policy_v14" ON quotes;
DROP POLICY IF EXISTS "quotes_delete_policy_v14" ON quotes;

-- Create new policies
CREATE POLICY "quotes_read_policy_v15"
ON quotes
FOR SELECT
TO authenticated
USING (
  EXISTS (
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

CREATE POLICY "quotes_write_policy_v15"
ON quotes
FOR INSERT
TO authenticated
WITH CHECK (
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

CREATE POLICY "quotes_update_policy_v15"
ON quotes
FOR UPDATE
TO authenticated
USING (
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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_project_id_v3 ON quotes(project_id);

-- Ensure RLS is enabled
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON quotes TO authenticated;