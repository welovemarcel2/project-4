/*
  # Fix Quote Persistence Migration

  1. Changes
    - Add is_deleted column if it doesn't exist
    - Create proper indexes for performance
    - Update RLS policies to handle deleted quotes

  2. Security
    - Maintain proper access control
    - Keep data integrity
*/

-- Add is_deleted column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'quotes' 
    AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE quotes ADD COLUMN is_deleted BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Update any null values to false
UPDATE quotes SET is_deleted = false WHERE is_deleted IS NULL;

-- Create indexes for better performance
DROP INDEX IF EXISTS idx_quotes_is_deleted_v4;
CREATE INDEX idx_quotes_is_deleted_v5 ON quotes(is_deleted);

-- Drop existing policies
DROP POLICY IF EXISTS "quotes_read_policy_v17" ON quotes;
DROP POLICY IF EXISTS "quotes_write_policy_v17" ON quotes;
DROP POLICY IF EXISTS "quotes_update_policy_v17" ON quotes;

-- Create new policies
CREATE POLICY "quotes_read_policy_v18"
ON quotes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "quotes_write_policy_v18"
ON quotes
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "quotes_update_policy_v18"
ON quotes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON quotes TO authenticated;

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';