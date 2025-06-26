/*
  # Fix Quote RLS Policies

  1. Changes
    - Drop existing policies
    - Create new policies that properly handle deleted quotes
    - Add proper access control based on project ownership and sharing
    - Add indexes for performance

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Maintain data isolation between users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "quotes_read_policy_v15" ON quotes;
DROP POLICY IF EXISTS "quotes_write_policy_v15" ON quotes;
DROP POLICY IF EXISTS "quotes_update_policy_v15" ON quotes;

-- Create new policies
CREATE POLICY "quotes_read_policy_v16"
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

CREATE POLICY "quotes_write_policy_v16"
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

CREATE POLICY "quotes_update_policy_v16"
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
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_project_id_v4 ON quotes(project_id);
CREATE INDEX IF NOT EXISTS idx_quotes_is_deleted_v3 ON quotes(is_deleted);

-- Ensure RLS is enabled
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON quotes TO authenticated;

-- Create function to handle quote deletion
CREATE OR REPLACE FUNCTION handle_quote_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Instead of deleting, update is_deleted flag
  UPDATE quotes 
  SET is_deleted = true,
      updated_at = now()
  WHERE id = OLD.id;
  
  -- Don't actually delete the row
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS quote_deletion_trigger ON quotes;
CREATE TRIGGER quote_deletion_trigger
  BEFORE DELETE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION handle_quote_deletion();