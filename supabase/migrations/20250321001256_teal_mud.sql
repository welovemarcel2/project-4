/*
  # Fix Quote Deletion Migration

  1. Changes
    - Drop existing trigger and functions
    - Create new quote deletion function with permission check
    - Add proper cascade deletion for all related data
    - Add necessary indexes for performance

  2. Security
    - Enable proper permission checks
    - Maintain data integrity during deletion
    - Ensure proper cascade deletion order
*/

-- Drop existing trigger and functions
DROP TRIGGER IF EXISTS quote_deletion_trigger ON quotes;
DROP FUNCTION IF EXISTS handle_quote_deletion();
DROP FUNCTION IF EXISTS delete_quote_cascade(UUID);

-- Create function to handle quote deletion
CREATE OR REPLACE FUNCTION delete_quote_cascade(p_quote_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id UUID;
  v_additive RECORD;
BEGIN
  -- Get project_id for permission check
  SELECT project_id INTO v_project_id
  FROM quotes
  WHERE id = p_quote_id;

  -- Check permissions
  IF NOT EXISTS (
    SELECT 1 FROM projects
    WHERE id = v_project_id
    AND (
      owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_shares
        WHERE project_shares.project_id = projects.id
        AND project_shares.user_id = auth.uid()
        AND project_shares.can_edit = true
      )
    )
  ) THEN
    RAISE EXCEPTION 'Not authorized to delete this quote';
  END IF;

  -- Delete all related data in correct order
  DELETE FROM quote_history
  WHERE quote_id = p_quote_id;

  DELETE FROM quote_notes
  WHERE quote_id = p_quote_id;

  DELETE FROM quote_budgets
  WHERE quote_id = p_quote_id;

  DELETE FROM quote_work_budgets
  WHERE quote_id = p_quote_id;

  DELETE FROM quote_settings
  WHERE quote_id = p_quote_id;

  -- Delete distribution categories (cascades to distributions)
  DELETE FROM distribution_categories
  WHERE quote_id = p_quote_id;

  -- Delete additive quotes recursively
  FOR v_additive IN SELECT id FROM quotes WHERE parent_quote_id = p_quote_id
  LOOP
    PERFORM delete_quote_cascade(v_additive.id);
  END LOOP;

  -- Finally delete the quote itself
  DELETE FROM quotes
  WHERE id = p_quote_id;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_project_id ON quotes(project_id);
CREATE INDEX IF NOT EXISTS idx_quotes_parent_quote_id ON quotes(parent_quote_id);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION delete_quote_cascade TO authenticated;