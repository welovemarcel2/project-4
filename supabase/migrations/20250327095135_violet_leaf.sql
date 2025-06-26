-- Drop existing function and trigger
DROP TRIGGER IF EXISTS quote_deletion_trigger ON quotes;
DROP FUNCTION IF EXISTS handle_quote_deletion();
DROP FUNCTION IF EXISTS delete_quote_cascade(UUID);

-- Create new function with proper cascade deletion
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
  -- Use GET DIAGNOSTICS to track affected rows
  DELETE FROM quote_history WHERE quote_id = p_quote_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % quote history records', v_count;

  DELETE FROM quote_notes WHERE quote_id = p_quote_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % quote notes', v_count;

  DELETE FROM quote_budgets WHERE quote_id = p_quote_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % quote budgets', v_count;

  DELETE FROM quote_work_budgets WHERE quote_id = p_quote_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % quote work budgets', v_count;

  DELETE FROM quote_settings WHERE quote_id = p_quote_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % quote settings', v_count;

  -- Delete distributions first, then categories
  DELETE FROM distributions
  WHERE category_id IN (
    SELECT id FROM distribution_categories
    WHERE quote_id = p_quote_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % distributions', v_count;

  DELETE FROM distribution_categories WHERE quote_id = p_quote_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % distribution categories', v_count;

  -- Delete additive quotes recursively
  FOR v_additive IN SELECT id FROM quotes WHERE parent_quote_id = p_quote_id
  LOOP
    BEGIN
      PERFORM delete_quote_cascade(v_additive.id);
      RAISE NOTICE 'Deleted additive quote %', v_additive.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to delete additive quote %: %', v_additive.id, SQLERRM;
    END;
  END LOOP;

  -- Finally delete the quote itself
  DELETE FROM quotes WHERE id = p_quote_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  IF v_count = 0 THEN
    RAISE NOTICE 'Quote % was already deleted', p_quote_id;
    RETURN;
  END IF;

  RAISE NOTICE 'Deleted quote %', p_quote_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION delete_quote_cascade TO authenticated;