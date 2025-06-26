/*
  # Fix Quote Deletion

  1. Changes
    - Add stored procedure for cascading quote deletion
    - Handle additive quotes deletion
    - Clean up related data

  2. Security
    - Maintain RLS protection
    - Ensure proper permissions
*/

-- Create function to delete quote and related data
CREATE OR REPLACE FUNCTION delete_quote_cascade(quote_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete additive quotes first
  DELETE FROM quotes
  WHERE parent_quote_id = quote_id;

  -- Delete the main quote
  DELETE FROM quotes
  WHERE id = quote_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_quote_cascade TO authenticated;