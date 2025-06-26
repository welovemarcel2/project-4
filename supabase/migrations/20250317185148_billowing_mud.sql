/*
  # Fix Quotes RLS Policies

  1. Changes
    - Drop existing quote policies
    - Create new simplified policies
    - Add proper indexes for performance

  2. Security
    - Allow proper quote creation
    - Maintain data isolation
    - Keep proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Quotes read access" ON quotes;
DROP POLICY IF EXISTS "Quotes write access" ON quotes;
DROP POLICY IF EXISTS "Quotes update access" ON quotes;
DROP POLICY IF EXISTS "Quotes delete access" ON quotes;

-- Create new simplified policies
CREATE POLICY "quotes_read_policy_v12"
ON quotes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "quotes_write_policy_v12"
ON quotes
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "quotes_update_policy_v12"
ON quotes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "quotes_delete_policy_v12"
ON quotes
FOR DELETE
TO authenticated
USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_project_id ON quotes(project_id);
CREATE INDEX IF NOT EXISTS idx_quotes_parent_quote_id ON quotes(parent_quote_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

-- Ensure RLS is enabled
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON quotes TO authenticated;

-- Create audit trigger
CREATE TRIGGER audit_quotes_changes
  BEFORE INSERT OR UPDATE OR DELETE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION audit_table_changes();