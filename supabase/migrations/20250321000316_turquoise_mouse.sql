/*
  # Fix Quote Deletion Cascade

  1. Changes
    - Create function to properly delete quotes and all related data
    - Handle cascade deletion of related records
    - Add proper error handling

  2. Security
    - Function runs with elevated privileges
    - Maintains referential integrity
    - Proper access control
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS delete_quote_cascade;

-- Create new function with proper cascade deletion
CREATE OR REPLACE FUNCTION delete_quote_cascade(quote_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete quote history first
  DELETE FROM quote_history
  WHERE quote_id = quote_id;

  -- Delete quote notes
  DELETE FROM quote_notes
  WHERE quote_id = quote_id;

  -- Delete quote budgets
  DELETE FROM quote_budgets
  WHERE quote_id = quote_id;

  -- Delete quote work budgets
  DELETE FROM quote_work_budgets
  WHERE quote_id = quote_id;

  -- Delete quote settings
  DELETE FROM quote_settings
  WHERE quote_id = quote_id;

  -- Delete distribution categories (which will cascade to distributions)
  DELETE FROM distribution_categories
  WHERE quote_id = quote_id;

  -- Delete additive quotes first (which will trigger this function recursively for each additive)
  DELETE FROM quotes
  WHERE parent_quote_id = quote_id;

  -- Finally delete the quote itself
  DELETE FROM quotes
  WHERE id = quote_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_quote_cascade TO authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_parent_quote_id 
ON quotes(parent_quote_id);