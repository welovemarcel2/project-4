/*
  # Fix Productions RLS Policies

  1. Changes
    - Drop existing policies
    - Create new non-recursive policies for productions
    - Create optimized indexes if they don't exist
    - Add proper access control

  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
    - Keep data isolation between users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "productions_read_policy" ON productions;
DROP POLICY IF EXISTS "productions_write_policy" ON productions;
DROP POLICY IF EXISTS "productions_update_policy" ON productions;
DROP POLICY IF EXISTS "productions_delete_policy" ON productions;
DROP POLICY IF EXISTS "productions_read_policy_v2" ON productions;
DROP POLICY IF EXISTS "productions_write_policy_v2" ON productions;
DROP POLICY IF EXISTS "productions_update_policy_v2" ON productions;
DROP POLICY IF EXISTS "productions_delete_policy_v2" ON productions;
DROP POLICY IF EXISTS "productions_read_policy_v3" ON productions;
DROP POLICY IF EXISTS "productions_write_policy_v3" ON productions;
DROP POLICY IF EXISTS "productions_update_policy_v3" ON productions;
DROP POLICY IF EXISTS "productions_delete_policy_v3" ON productions;

-- Create new non-recursive policies
CREATE POLICY "productions_read_policy_v4"
ON productions
FOR SELECT
TO authenticated
USING (
  -- User can read productions if they:
  -- 1. Own the production
  -- 2. Are a project owner that uses this production
  user_id = auth.uid()
  OR id IN (
    SELECT DISTINCT production_id 
    FROM projects 
    WHERE owner_id = auth.uid()
    AND production_id IS NOT NULL
  )
);

CREATE POLICY "productions_write_policy_v4"
ON productions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "productions_update_policy_v4"
ON productions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "productions_delete_policy_v4"
ON productions
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Create optimized indexes if they don't exist
DO $$ 
BEGIN
  -- Drop old indexes if they exist
  DROP INDEX IF EXISTS idx_productions_user_id;
  DROP INDEX IF EXISTS idx_productions_user_id_v2;
  
  -- Create new indexes only if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_productions_id_user_id'
  ) THEN
    CREATE INDEX idx_productions_id_user_id ON productions(id, user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_projects_production_id'
  ) THEN
    CREATE INDEX idx_projects_production_id ON projects(production_id) 
    WHERE production_id IS NOT NULL;
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE productions ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON productions TO authenticated;