/*
  # Fix Quote Budgets RLS Policies

  1. Changes
    - Drop existing RLS policies
    - Create new simplified policies for quote_budgets
    - Add proper indexes for performance

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Maintain data isolation
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "quote_budgets_read_policy" ON quote_budgets;
DROP POLICY IF EXISTS "quote_budgets_write_policy" ON quote_budgets;
DROP POLICY IF EXISTS "quote_budgets_update_policy" ON quote_budgets;

-- Create new simplified policies
CREATE POLICY "quote_budgets_read_policy"
ON quote_budgets
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

CREATE POLICY "quote_budgets_write_policy"
ON quote_budgets
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

CREATE POLICY "quote_budgets_update_policy"
ON quote_budgets
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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_quote_budgets_quote_id_v2 
ON quote_budgets(quote_id);

-- Ensure RLS is enabled
ALTER TABLE quote_budgets ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON quote_budgets TO authenticated;