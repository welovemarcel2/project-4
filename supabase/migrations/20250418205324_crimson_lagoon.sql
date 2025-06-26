/*
  # Add Comments Column to Work Budgets

  1. Changes
    - Add comments column to quote_work_budgets table if it doesn't exist
    - Create index for better performance
    - Update existing rows

  2. Security
    - Maintain existing RLS policies
    - Keep data integrity
*/

-- Add comments column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'quote_work_budgets' 
    AND column_name = 'comments'
  ) THEN
    -- Add the column
    ALTER TABLE quote_work_budgets 
    ADD COLUMN comments JSONB DEFAULT '{}'::jsonb;

    -- Update existing rows
    UPDATE quote_work_budgets 
    SET comments = '{}'::jsonb 
    WHERE comments IS NULL;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_quote_work_budgets_comments 
ON quote_work_budgets USING gin(comments);

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';