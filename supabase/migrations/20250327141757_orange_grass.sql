/*
  # Fix Quote Deletion Column Name

  1. Changes
    - Rename isDeleted column to is_deleted for consistency
    - Update existing data
    - Add proper index

  2. Security
    - Maintain existing RLS policies
    - Keep data integrity
*/

-- Rename column if it exists
DO $$ 
BEGIN
  -- If isDeleted exists, rename it to is_deleted
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'quotes' 
    AND column_name = 'isdeleted'
  ) THEN
    ALTER TABLE quotes RENAME COLUMN isdeleted TO is_deleted;
  END IF;

  -- If neither column exists, add is_deleted
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'quotes' 
    AND column_name IN ('isdeleted', 'is_deleted')
  ) THEN
    ALTER TABLE quotes ADD COLUMN is_deleted BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Update any null values to false
UPDATE quotes SET is_deleted = false WHERE is_deleted IS NULL;

-- Create index for better performance
DROP INDEX IF EXISTS idx_quotes_is_deleted;
CREATE INDEX idx_quotes_is_deleted ON quotes(is_deleted);

-- Force schema cache refresh
SELECT pg_notify('pgrst', 'reload schema');