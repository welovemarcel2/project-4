/*
  # Add is_deleted Column to Quotes Table

  1. Changes
    - Add is_deleted column with default false
    - Create index for better performance
    - Update existing rows

  2. Security
    - Maintain existing RLS policies
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
    ALTER TABLE quotes 
    ADD COLUMN is_deleted BOOLEAN DEFAULT false;

    -- Update existing rows
    UPDATE quotes 
    SET is_deleted = false 
    WHERE is_deleted IS NULL;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_is_deleted_v2 
ON quotes(is_deleted);

-- Force schema cache refresh
SELECT pg_notify('pgrst', 'reload schema');