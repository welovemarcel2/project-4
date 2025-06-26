/*
  # Fix Distribution Categories RLS Policy

  1. Changes
    - Update RLS policy for distribution_categories to allow proper access
    - Add WITH CHECK clause to ensure proper insert permissions
    - Simplify policy conditions for better performance

  2. Security
    - Maintain data isolation between projects
    - Ensure users can only access their own or shared data
    - Allow creation of categories for accessible quotes
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Distribution categories access control" ON distribution_categories;

-- Create new policy with proper access control
CREATE POLICY "Distribution categories access control"
ON distribution_categories
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quotes
    WHERE id = quote_id
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE id = quotes.project_id
      AND (
        owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_shares
          WHERE project_shares.project_id = projects.id
          AND project_shares.user_id = auth.uid()
        )
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quotes
    WHERE id = quote_id
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE id = quotes.project_id
      AND (
        owner_id = auth.uid()
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