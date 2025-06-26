/*
  # Fix User Authentication and Access Control

  1. Changes
    - Drop existing user policies
    - Create new simplified policies for user access
    - Add case-insensitive email handling
    - Fix user creation and authentication flow

  2. Security
    - Allow proper user creation and authentication
    - Maintain data isolation between users
    - Enable proper access for production users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users v5 read access" ON users;
DROP POLICY IF EXISTS "Users v5 insert access" ON users;
DROP POLICY IF EXISTS "Users v5 update access" ON users;

-- Drop existing indexes
DROP INDEX IF EXISTS users_auth_id_key;
DROP INDEX IF EXISTS users_email_idx;

-- Create new policies
CREATE POLICY "users_read_policy_v3"
ON users
FOR SELECT
TO authenticated
USING (
  -- Users can:
  -- 1. Read their own data
  -- 2. Read production users' data
  -- 3. Read data if they have a production role
  auth.uid() = id
  OR role = 'production'
  OR EXISTS (
    SELECT 1 FROM users u2
    WHERE u2.id = auth.uid()
    AND u2.role = 'production'
  )
);

CREATE POLICY "users_write_policy_v3"
ON users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "users_update_policy_v3"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create new indexes
CREATE UNIQUE INDEX users_auth_id_key ON users(id);
CREATE INDEX users_email_case_insensitive_idx ON users(LOWER(email));

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;