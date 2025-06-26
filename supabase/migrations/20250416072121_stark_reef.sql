/*
  # Update Functions for New Schema

  1. Changes
    - Update delete_quote_cascade function to handle new tables
    - Update handle_quote_deletion function to handle new tables
    - Add new functions for project deletion

  2. Security
    - Maintain proper access control
    - Keep data integrity during deletion
*/

-- Drop existing trigger first, then the function
DROP TRIGGER IF EXISTS quote_deletion_trigger ON quotes;
DROP FUNCTION IF EXISTS handle_quote_deletion();
DROP FUNCTION IF EXISTS delete_quote_cascade(UUID);

-- Create new function for quote deletion
CREATE OR REPLACE FUNCTION delete_quote_cascade(p_quote_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id UUID;
  v_additive RECORD;
  v_count INTEGER;
BEGIN
  -- Get project_id for permission check
  SELECT project_id INTO v_project_id
  FROM quotes
  WHERE id = p_quote_id;

  IF NOT FOUND THEN
    RETURN; -- Quote already deleted
  END IF;

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
  DELETE FROM quote_history WHERE quote_id = p_quote_id;
  DELETE FROM quote_notes WHERE quote_id = p_quote_id;
  DELETE FROM quote_budgets WHERE quote_id = p_quote_id;
  DELETE FROM quote_work_budgets WHERE quote_id = p_quote_id;
  DELETE FROM quote_settings WHERE quote_id = p_quote_id;
  
  -- Delete new tables
  DELETE FROM quote_displays WHERE quote_id = p_quote_id;
  DELETE FROM quote_numberings WHERE quote_id = p_quote_id;
  DELETE FROM quote_units WHERE quote_id = p_quote_id;

  -- Delete distributions first, then categories
  DELETE FROM distributions
  WHERE category_id IN (
    SELECT id FROM distribution_categories
    WHERE quote_id = p_quote_id
  );

  DELETE FROM distribution_categories WHERE quote_id = p_quote_id;

  -- Delete additive quotes recursively
  FOR v_additive IN SELECT id FROM quotes WHERE parent_quote_id = p_quote_id
  LOOP
    BEGIN
      PERFORM delete_quote_cascade(v_additive.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to delete additive quote %: %', v_additive.id, SQLERRM;
    END;
  END LOOP;

  -- Finally delete the quote itself
  DELETE FROM quotes WHERE id = p_quote_id;
END;
$$;

-- Create new handle_quote_deletion function
CREATE OR REPLACE FUNCTION handle_quote_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all related data
  DELETE FROM quote_history WHERE quote_id = OLD.id;
  DELETE FROM quote_notes WHERE quote_id = OLD.id;
  DELETE FROM quote_budgets WHERE quote_id = OLD.id;
  DELETE FROM quote_work_budgets WHERE quote_id = OLD.id;
  DELETE FROM quote_settings WHERE quote_id = OLD.id;
  
  -- Delete new tables
  DELETE FROM quote_displays WHERE quote_id = OLD.id;
  DELETE FROM quote_numberings WHERE quote_id = OLD.id;
  DELETE FROM quote_units WHERE quote_id = OLD.id;
  
  -- Delete distributions first, then categories
  DELETE FROM distributions
  WHERE category_id IN (
    SELECT id FROM distribution_categories
    WHERE quote_id = OLD.id
  );
  DELETE FROM distribution_categories WHERE quote_id = OLD.id;
  
  RETURN OLD;
END;
$$;

-- Create trigger
CREATE TRIGGER quote_deletion_trigger
  BEFORE DELETE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION handle_quote_deletion();

-- Create new function for project deletion
CREATE OR REPLACE FUNCTION delete_project_cascade(p_project_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quote RECORD;
BEGIN
  -- Check permissions
  IF NOT EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id
    AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to delete this project';
  END IF;

  -- Delete all quotes first
  FOR v_quote IN SELECT id FROM quotes WHERE project_id = p_project_id
  LOOP
    BEGIN
      PERFORM delete_quote_cascade(v_quote.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to delete quote %: %', v_quote.id, SQLERRM;
    END;
  END LOOP;

  -- Delete project settings
  DELETE FROM project_settings WHERE project_id = p_project_id;
  
  -- Delete new tables
  DELETE FROM project_producers WHERE project_id = p_project_id;
  DELETE FROM project_informations WHERE project_id = p_project_id;
  DELETE FROM project_rates WHERE project_id = p_project_id;
  DELETE FROM project_social_charges WHERE project_id = p_project_id;
  DELETE FROM project_currencies WHERE project_id = p_project_id;

  -- Delete project shares
  DELETE FROM project_shares WHERE project_id = p_project_id;

  -- Finally delete the project itself
  DELETE FROM projects WHERE id = p_project_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION delete_quote_cascade TO authenticated;
GRANT EXECUTE ON FUNCTION handle_quote_deletion TO authenticated;
GRANT EXECUTE ON FUNCTION delete_project_cascade TO authenticated;