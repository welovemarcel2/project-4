/*
  # Fix User Policies Migration

  1. Changes
    - Use auth.uid() instead of uid()
    - Drop existing policies
    - Create new policies for user management
    - Fix email uniqueness handling

  2. Security
    - Enable RLS on users table
    - Add policies for user management
    - Ensure proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users v3 read access" ON users;
DROP POLICY IF EXISTS "Users v3 insert access" ON users;
DROP POLICY IF EXISTS "Users v3 update access" ON users;

-- Create new policies for users table
CREATE POLICY "Users v3 read access"
ON users
FOR SELECT
TO authenticated
USING ((auth.uid() = id) OR (role = 'production'::text));

CREATE POLICY "Users v3 insert access"
ON users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Users v3 update access"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Drop and recreate email uniqueness constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key CASCADE;
DROP INDEX IF EXISTS users_email_key;
CREATE UNIQUE INDEX users_email_key ON users USING btree (lower(email));

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;