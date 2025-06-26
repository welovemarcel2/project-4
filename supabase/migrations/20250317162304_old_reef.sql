/*
  # Fix Users RLS Recursion V2

  1. Changes
    - Drop existing user policies
    - Create new policies with unique names
    - Fix infinite recursion by simplifying policy conditions
    - Update indexes for better performance

  2. Security
    - Maintain data isolation between users
    - Keep proper access control
    - Fix infinite recursion by avoiding circular dependencies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "users_read_policy_v5" ON users;
DROP POLICY IF EXISTS "users_write_policy_v5" ON users;
DROP POLICY IF EXISTS "users_update_policy_v5" ON users;
DROP POLICY IF EXISTS "users_read_policy_v6" ON users;
DROP POLICY IF EXISTS "users_write_policy_v6" ON users;
DROP POLICY IF EXISTS "users_update_policy_v6" ON users;
DROP POLICY IF EXISTS "Users v5 read access" ON users;
DROP POLICY IF EXISTS "Users v5 insert access" ON users;
DROP POLICY IF EXISTS "Users v5 update access" ON users;

-- Create new simplified policies with unique names
CREATE POLICY "users_read_policy_v7"
ON users
FOR SELECT
TO authenticated
USING (
  -- Users can read:
  -- 1. Their own data
  -- 2. Production users' data
  id = auth.uid()
  OR role = 'production'
);

CREATE POLICY "users_write_policy_v7"
ON users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "users_update_policy_v7"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Drop existing indexes
DROP INDEX IF EXISTS users_email_lower_idx;
DROP INDEX IF EXISTS users_email_lower_idx_v2;
DROP INDEX IF EXISTS users_email_lower_idx_v3;
DROP INDEX IF EXISTS users_role_idx;
DROP INDEX IF EXISTS users_role_idx_v2;
DROP INDEX IF EXISTS users_role_idx_v3;

-- Create new indexes with unique names
CREATE INDEX IF NOT EXISTS users_email_lower_idx_v4 ON users(lower(email));
CREATE INDEX IF NOT EXISTS users_role_idx_v4 ON users(role);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;