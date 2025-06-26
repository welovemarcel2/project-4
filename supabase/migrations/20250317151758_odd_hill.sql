/*
  # Fix User Authentication Policies

  1. Changes
    - Drop existing user policies
    - Create new simplified auth policies
    - Fix email case sensitivity issues
    - Add proper indexes for performance

  2. Security
    - Allow proper user authentication
    - Maintain data isolation
    - Enable proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users v5 read access" ON users;
DROP POLICY IF EXISTS "Users v5 insert access" ON users;
DROP POLICY IF EXISTS "Users v5 update access" ON users;

-- Create new simplified policies
CREATE POLICY "users_read_policy_v6"
ON users
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR role = 'production'
  OR EXISTS (
    SELECT 1 FROM projects
    WHERE projects.owner_id = auth.uid()
    AND projects.production_id IN (
      SELECT id FROM productions
      WHERE user_id = users.id
    )
  )
);

CREATE POLICY "users_write_policy_v6"
ON users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "users_update_policy_v6"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Drop existing indexes
DROP INDEX IF EXISTS users_auth_id_key;
DROP INDEX IF EXISTS users_email_idx;

-- Create new indexes
CREATE UNIQUE INDEX users_id_key_v2 ON users(id);
CREATE INDEX users_email_lower_idx_v2 ON users(LOWER(email));
CREATE INDEX users_role_idx_v2 ON users(role);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;

-- Create helper function for case-insensitive email lookup
CREATE OR REPLACE FUNCTION get_user_by_email(p_email TEXT)
RETURNS users
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM users 
  WHERE LOWER(email) = LOWER(p_email)
  LIMIT 1;
$$;