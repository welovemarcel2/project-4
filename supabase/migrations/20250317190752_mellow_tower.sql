/*
  # Fix Budget Items Policies

  1. Changes
    - Drop existing policies with IF EXISTS
    - Add settings column if missing
    - Create new policies with unique names
    - Update indexes with unique names

  2. Security
    - Enable RLS
    - Add proper access control
*/

-- Drop existing policies with IF EXISTS
DROP POLICY IF EXISTS "budget_items_read_policy" ON budget_items;
DROP POLICY IF EXISTS "budget_items_write_policy" ON budget_items;
DROP POLICY IF EXISTS "budget_items_update_policy" ON budget_items;
DROP POLICY IF EXISTS "budget_items_delete_policy" ON budget_items;
DROP POLICY IF EXISTS "budget_items_read_policy_v2" ON budget_items;
DROP POLICY IF EXISTS "budget_items_write_policy_v2" ON budget_items;
DROP POLICY IF EXISTS "budget_items_update_policy_v2" ON budget_items;
DROP POLICY IF EXISTS "budget_items_delete_policy_v2" ON budget_items;

-- Add settings column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'budget_items' 
    AND column_name = 'settings'
  ) THEN
    ALTER TABLE budget_items ADD COLUMN settings JSONB;
  END IF;
END $$;

-- Create new policies with unique names
CREATE POLICY "budget_items_read_policy_v3"
ON budget_items
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "budget_items_write_policy_v3"
ON budget_items
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "budget_items_update_policy_v3"
ON budget_items
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "budget_items_delete_policy_v3"
ON budget_items
FOR DELETE
TO authenticated
USING (true);

-- Drop existing indexes
DROP INDEX IF EXISTS idx_budget_items_quote_id;
DROP INDEX IF EXISTS idx_budget_items_category_id;
DROP INDEX IF EXISTS idx_budget_items_parent_id;
DROP INDEX IF EXISTS idx_budget_items_quote_id_v2;
DROP INDEX IF EXISTS idx_budget_items_category_id_v2;
DROP INDEX IF EXISTS idx_budget_items_parent_id_v2;

-- Create new indexes with unique names
CREATE INDEX idx_budget_items_quote_id_v3 ON budget_items(quote_id);
CREATE INDEX idx_budget_items_category_id_v3 ON budget_items(category_id);
CREATE INDEX idx_budget_items_parent_id_v3 ON budget_items(parent_id);

-- Ensure RLS is enabled
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON budget_items TO authenticated;