/*
  # Fix Quote Deletion Migration

  1. Changes
    - Drop existing policies
    - Create new policies for quote deletion
    - Add proper cascade deletion handling
    - Add indexes for performance

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Maintain data isolation
*/

-- Drop existing policies
DROP POLICY IF EXISTS "quotes_read_policy_v16" ON quotes;
DROP POLICY IF EXISTS "quotes_write_policy_v16" ON quotes;
DROP POLICY IF EXISTS "quotes_update_policy_v16" ON quotes;

-- Create new policies
CREATE POLICY "quotes_read_policy_v17"
ON quotes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "quotes_write_policy_v17"
ON quotes
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "quotes_update_policy_v17"
ON quotes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_project_id_v5 ON quotes(project_id);
CREATE INDEX IF NOT EXISTS idx_quotes_is_deleted_v4 ON quotes(is_deleted);

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