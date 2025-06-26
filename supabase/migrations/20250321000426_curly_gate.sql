/*
  # Fix Quote ID Ambiguity in Delete Function

  1. Changes
    - Rename function parameter to avoid column name conflict
    - Use explicit parameter reference in WHERE clauses
    - Keep same functionality but fix ambiguity error

  2. Security
    - Maintain security definer attribute
    - Keep same permissions
*/

-- Drop existing function
DROP FUNCTION IF EXISTS delete_quote_cascade;

-- Create new function with renamed parameter
CREATE OR REPLACE FUNCTION delete_quote_cascade(p_quote_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete quote history first
  DELETE FROM quote_history
  WHERE quote_id = p_quote_id;

  -- Delete quote notes
  DELETE FROM quote_notes
  WHERE quote_id = p_quote_id;

  -- Delete quote budgets
  DELETE FROM quote_budgets
  WHERE quote_id = p_quote_id;

  -- Delete quote work budgets
  DELETE FROM quote_work_budgets
  WHERE quote_id = p_quote_id;

  -- Delete quote settings
  DELETE FROM quote_settings
  WHERE quote_id = p_quote_id;

  -- Delete distribution categories (which will cascade to distributions)
  DELETE FROM distribution_categories
  WHERE quote_id = p_quote_id;

  -- Delete additive quotes first (which will trigger this function recursively for each additive)
  DELETE FROM quotes
  WHERE parent_quote_id = p_quote_id;

  -- Finally delete the quote itself
  DELETE FROM quotes
  WHERE id = p_quote_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_quote_cascade TO authenticated;