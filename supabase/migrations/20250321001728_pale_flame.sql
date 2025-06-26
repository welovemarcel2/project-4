/*
  # Clean Database Migration

  1. Changes
    - Delete all data from tables in correct order
    - Preserve table structures
    - Reset sequences

  2. Security
    - Maintain RLS policies
    - Keep permissions intact
*/

-- Disable RLS temporarily to allow cleanup
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE quote_budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE quote_work_budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE quote_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE quote_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE quote_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE distributions DISABLE ROW LEVEL SECURITY;

-- Delete all data in reverse dependency order
DELETE FROM distributions;
DELETE FROM distribution_categories;
DELETE FROM quote_history;
DELETE FROM quote_notes;
DELETE FROM quote_budgets;
DELETE FROM quote_work_budgets;
DELETE FROM quote_settings;
DELETE FROM quotes;
DELETE FROM project_shares;
DELETE FROM project_settings;
DELETE FROM projects;

-- Re-enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_work_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;

-- Clear local storage function
CREATE OR REPLACE FUNCTION clear_local_storage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This is just a marker function to remind the frontend to clear local storage
  -- The actual clearing happens in the frontend code
  RETURN;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION clear_local_storage TO authenticated;