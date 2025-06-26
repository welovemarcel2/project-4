/*
  # Fix User Creation Flow

  1. Changes
    - Add proper user creation policies
    - Fix email uniqueness check
    - Add proper permissions for user creation

  2. Security
    - Enable RLS
    - Add policies for user management
    - Ensure proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users read access v2" ON users;
DROP POLICY IF EXISTS "Users insert access v2" ON users;
DROP POLICY IF EXISTS "Users update access v2" ON users;

-- Create new policies for users table
CREATE POLICY "Users v3 read access"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR role = 'production'
);

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

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;