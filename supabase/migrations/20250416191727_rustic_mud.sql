/*
  # Fix production_terms RLS policies

  1. Changes
    - Update RLS policies for production_terms table to:
      - Allow production users to create and update their own terms
      - Allow reading terms for shared projects
      - Ensure proper cascading permissions

  2. Security
    - Enable RLS on production_terms table
    - Add policies for:
      - Read access: Users can read terms if they:
        a) Own the production
        b) Have access to a project that uses the production
      - Write access: Production owners can create/update their own terms
*/

-- Drop existing policies
DROP POLICY IF EXISTS "production_terms_read_policy" ON production_terms;
DROP POLICY IF EXISTS "production_terms_write_policy" ON production_terms;
DROP POLICY IF EXISTS "production_terms_update_policy" ON production_terms;
DROP POLICY IF EXISTS "production_terms_delete_policy" ON production_terms;

-- Create new comprehensive policies
CREATE POLICY "production_terms_read_policy" ON production_terms
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM productions 
    WHERE productions.id = production_terms.production_id
    AND (
      -- Production owner can read
      productions.user_id = auth.uid()
      OR
      -- Users with access to projects using this production can read
      EXISTS (
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
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM productions
    WHERE productions.id = production_terms.production_id
    AND productions.user_id = auth.uid()
  )
);

CREATE POLICY "production_terms_update_policy" ON production_terms
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM productions
    WHERE productions.id = production_terms.production_id
    AND productions.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM productions
    WHERE productions.id = production_terms.production_id
    AND productions.user_id = auth.uid()
  )
);

CREATE POLICY "production_terms_delete_policy" ON production_terms
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM productions
    WHERE productions.id = production_terms.production_id
    AND productions.user_id = auth.uid()
  )
);