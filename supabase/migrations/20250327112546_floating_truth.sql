/*
  # Add isDeleted Column to Quotes Table

  1. Changes
    - Add isDeleted boolean column with default false
    - Add index for better performance on isDeleted queries
    - Update RLS policies to filter out deleted quotes

  2. Security
    - Maintain existing RLS policies
    - Add isDeleted check to policies
*/

-- Add isDeleted column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'quotes' 
    AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE quotes 
    ADD COLUMN is_deleted BOOLEAN DEFAULT false;

    -- Update existing rows
    UPDATE quotes 
    SET is_deleted = false 
    WHERE is_deleted IS NULL;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_is_deleted 
ON quotes(is_deleted);

-- Update RLS policies to exclude deleted quotes
DROP POLICY IF EXISTS "quotes_read_policy_v12" ON quotes;
DROP POLICY IF EXISTS "quotes_write_policy_v12" ON quotes;
DROP POLICY IF EXISTS "quotes_update_policy_v12" ON quotes;
DROP POLICY IF EXISTS "quotes_delete_policy_v12" ON quotes;

-- Create new policies that filter out deleted quotes
CREATE POLICY "quotes_read_policy_v13"
ON quotes
FOR SELECT
TO authenticated
USING (
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

CREATE POLICY "quotes_write_policy_v13"
ON quotes
FOR INSERT
TO authenticated
WITH CHECK (
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

CREATE POLICY "quotes_update_policy_v13"
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

CREATE POLICY "quotes_delete_policy_v13"
ON quotes
FOR DELETE
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
);

-- Flush schema cache to ensure changes are recognized
NOTIFY pgrst, 'reload schema';