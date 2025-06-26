/*
  # Fix Productions RLS Recursion

  1. Changes
    - Drop existing policies that cause recursion
    - Create new non-recursive policies for productions
    - Simplify access control logic
    - Add proper indexes for performance

  2. Security
    - Maintain data isolation between users
    - Keep proper access control
    - Fix infinite recursion by avoiding circular dependencies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "productions_read_policy_v4" ON productions;
DROP POLICY IF EXISTS "productions_write_policy_v4" ON productions;
DROP POLICY IF EXISTS "productions_update_policy_v4" ON productions;
DROP POLICY IF EXISTS "productions_delete_policy_v4" ON productions;

-- Create new simplified policies
CREATE POLICY "productions_read_policy_v5"
ON productions
FOR SELECT
TO authenticated
USING (
  -- User can read productions if they:
  -- 1. Own the production
  -- 2. Have production role (can see all productions)
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'production'
  )
);

CREATE POLICY "productions_write_policy_v5"
ON productions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "productions_update_policy_v5"
ON productions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "productions_delete_policy_v5"
ON productions
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Create optimized indexes if they don't exist
DO $$ 
BEGIN
  -- Create new indexes only if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_productions_id_user_id_v2'
  ) THEN
    CREATE INDEX idx_productions_id_user_id_v2 ON productions(id, user_id);
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE productions ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON productions TO authenticated;