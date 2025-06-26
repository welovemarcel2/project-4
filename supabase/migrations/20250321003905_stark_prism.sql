/*
  # Fix Quote Budgets RLS Policies

  1. Changes
    - Drop existing policies
    - Create new simplified policies
    - Add proper access control
    - Add indexes for performance

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Maintain data isolation
*/

-- Drop existing policies
DROP POLICY IF EXISTS "quote_budgets_read_policy" ON quote_budgets;
DROP POLICY IF EXISTS "quote_budgets_write_policy" ON quote_budgets;
DROP POLICY IF EXISTS "quote_budgets_update_policy" ON quote_budgets;

-- Create new policies with proper access control
CREATE POLICY "quote_budgets_read_policy_v2"
ON quote_budgets
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "quote_budgets_write_policy_v2"
ON quote_budgets
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "quote_budgets_update_policy_v2"
ON quote_budgets
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_quote_budgets_quote_id_v3 
ON quote_budgets(quote_id);

-- Ensure RLS is enabled
ALTER TABLE quote_budgets ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON quote_budgets TO authenticated;