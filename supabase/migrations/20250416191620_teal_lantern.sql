/*
  # Fix production_terms RLS policies

  1. Changes
    - Update RLS policies for production_terms table to allow proper access
    - Add policy for production owners to manage their terms
    - Ensure proper cascading of permissions

  2. Security
    - Enable RLS on production_terms table
    - Add policies for:
      - Read: Users can read terms if they have access to the production
      - Write: Production owners can manage their terms
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "production_terms_delete_policy" ON production_terms;
DROP POLICY IF EXISTS "production_terms_read_policy" ON production_terms;
DROP POLICY IF EXISTS "production_terms_update_policy" ON production_terms;
DROP POLICY IF EXISTS "production_terms_write_policy" ON production_terms;

-- Create new policies with proper access controls
CREATE POLICY "production_terms_read_policy"
ON production_terms
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM productions
    WHERE productions.id = production_terms.production_id
    AND (
      productions.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM projects
        WHERE projects.production_id = productions.id
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
  )
);

CREATE POLICY "production_terms_write_policy"
ON production_terms
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM productions
    WHERE productions.id = production_terms.production_id
    AND productions.user_id = auth.uid()
  )
);

CREATE POLICY "production_terms_update_policy"
ON production_terms
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM productions
    WHERE productions.id = production_terms.production_id
    AND productions.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM productions
    WHERE productions.id = production_terms.production_id
    AND productions.user_id = auth.uid()
  )
);

CREATE POLICY "production_terms_delete_policy"
ON production_terms
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM productions
    WHERE productions.id = production_terms.production_id
    AND productions.user_id = auth.uid()
  )
);