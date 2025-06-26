/*
  # Distribution Categories Access Control

  1. Security
    - Drop existing policies
    - Create new policies for read and write operations
    - Enable RLS
    - Grant necessary permissions

  2. Changes
    - Separate policies for SELECT, INSERT, UPDATE, and DELETE operations
    - Proper access control based on project ownership and sharing
    - Performance optimization with index
*/

-- Drop existing policies
DROP POLICY IF EXISTS "dc_read_policy" ON distribution_categories;
DROP POLICY IF EXISTS "dc_insert_policy" ON distribution_categories;
DROP POLICY IF EXISTS "dc_update_policy" ON distribution_categories;
DROP POLICY IF EXISTS "dc_delete_policy" ON distribution_categories;

-- Create separate policies for each operation
CREATE POLICY "dc_read_policy"
ON distribution_categories
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = quote_id
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = quotes.project_id
      AND (
        projects.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_shares
          WHERE project_shares.project_id = projects.id
          AND project_shares.user_id = auth.uid()
        )
      )
    )
  )
);

CREATE POLICY "dc_insert_policy"
ON distribution_categories
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = quote_id
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = quotes.project_id
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
);

CREATE POLICY "dc_update_policy"
ON distribution_categories
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = quote_id
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = quotes.project_id
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
);

CREATE POLICY "dc_delete_policy"
ON distribution_categories
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = quote_id
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = quotes.project_id
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
);

-- Ensure RLS is enabled
ALTER TABLE distribution_categories ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON distribution_categories TO authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_distribution_categories_quote_id 
ON distribution_categories(quote_id);