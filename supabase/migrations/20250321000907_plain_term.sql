/*
  # Fix Quote Deletion Migration

  1. Changes
    - Fix loop variable syntax in delete_quote_cascade function
    - Add proper permission checks
    - Add proper cascade deletion
    - Add indexes for performance

  2. Security
    - Enable proper access control
    - Maintain data integrity
    - Ensure proper cleanup
*/

-- Drop existing function
DROP FUNCTION IF EXISTS delete_quote_cascade;

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
  FOR v_additive IN (
    SELECT id FROM quotes 
    WHERE parent_quote_id = p_quote_id
  ) LOOP
    PERFORM delete_quote_cascade(v_additive.id);
  END LOOP;

  -- Finally delete the quote itself
  DELETE FROM quotes
  WHERE id = p_quote_id;
END;
$$;

-- Create trigger function to handle quote deletion
CREATE OR REPLACE FUNCTION handle_quote_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clean up all related data
  DELETE FROM quote_history WHERE quote_id = OLD.id;
  DELETE FROM quote_notes WHERE quote_id = OLD.id;
  DELETE FROM quote_budgets WHERE quote_id = OLD.id;
  DELETE FROM quote_work_budgets WHERE quote_id = OLD.id;
  DELETE FROM quote_settings WHERE quote_id = OLD.id;
  DELETE FROM distribution_categories WHERE quote_id = OLD.id;
  
  RETURN OLD;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS quote_deletion_trigger ON quotes;
CREATE TRIGGER quote_deletion_trigger
  BEFORE DELETE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION handle_quote_deletion();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_project_id_v2 ON quotes(project_id);
CREATE INDEX IF NOT EXISTS idx_quotes_parent_quote_id_v2 ON quotes(parent_quote_id);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION delete_quote_cascade TO authenticated;
GRANT EXECUTE ON FUNCTION handle_quote_deletion TO authenticated;