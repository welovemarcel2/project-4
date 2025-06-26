/*
  # Fix Distribution Categories RLS Policies

  1. Changes
    - Adds proper RLS policy for distribution categories
    - Ensures authenticated users can perform operations
    - Adds necessary indexes for performance

  2. Security
    - Enables RLS on distribution_categories table
    - Adds policy for authenticated users to manage their categories
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Distribution categories management" ON distribution_categories;

-- Create new policy with proper access control
CREATE POLICY "Distribution categories management"
ON distribution_categories
FOR ALL
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
)
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

-- Ensure RLS is enabled
ALTER TABLE distribution_categories ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON distribution_categories TO authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_distribution_categories_quote_id 
ON distribution_categories(quote_id);