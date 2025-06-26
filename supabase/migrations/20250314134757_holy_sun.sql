/*
  # Fix Distribution Categories RLS Policy

  1. Changes
    - Drop existing RLS policies
    - Create separate policies for SELECT and INSERT/UPDATE/DELETE operations
    - Add proper checks for project ownership and share permissions

  2. Security
    - Allow read access to users who can access the quote
    - Allow write access only to project owners and users with edit permissions
    - Maintain data isolation between projects
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Distribution categories access control" ON distribution_categories;

-- Create SELECT policy
CREATE POLICY "Distribution categories read access"
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

-- Create INSERT/UPDATE/DELETE policy
CREATE POLICY "Distribution categories write access"
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