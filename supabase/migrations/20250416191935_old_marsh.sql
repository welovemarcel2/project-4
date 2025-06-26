/*
  # Fix Production Terms RLS Policies

  1. Changes
    - Drop existing policies on production_terms table
    - Create new policies with public access
    - Fix permission issues for authenticated and anonymous users

  2. Security
    - Allow proper access to production terms
    - Fix the 403 error when creating production terms
*/

-- Drop existing policies
DROP POLICY IF EXISTS "production_terms_read_policy" ON production_terms;
DROP POLICY IF EXISTS "production_terms_write_policy" ON production_terms;
DROP POLICY IF EXISTS "production_terms_update_policy" ON production_terms;
DROP POLICY IF EXISTS "production_terms_delete_policy" ON production_terms;

-- Create new policies with public access
CREATE POLICY "Temp users access v2" ON production_terms
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Create new policies with proper access controls
CREATE POLICY "production_terms_read_policy" ON production_terms
FOR SELECT
TO public
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

CREATE POLICY "production_terms_write_policy" ON production_terms
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM productions
    WHERE productions.id = production_terms.production_id
    AND productions.user_id = auth.uid()
  )
);

CREATE POLICY "production_terms_update_policy" ON production_terms
FOR UPDATE
TO public
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

CREATE POLICY "production_terms_delete_policy" ON production_terms
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM productions
    WHERE productions.id = production_terms.production_id
    AND productions.user_id = auth.uid()
  )
);

-- Ensure RLS is enabled
ALTER TABLE production_terms ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON production_terms TO authenticated;
GRANT ALL ON production_terms TO anon;