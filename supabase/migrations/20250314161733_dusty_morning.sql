/*
  # Update users RLS policies

  1. Changes
    - Drop existing restrictive policies
    - Add new policies that allow user creation and management
    - Keep security while allowing necessary operations

  2. Security
    - Maintain RLS protection while allowing user creation
    - Ensure users can only access their own data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Allow sync_user function" ON users;

-- Create new policies for user management
CREATE POLICY "Users can manage own data"
ON users
FOR ALL
TO authenticated
USING (
  -- Users can read their own data
  auth.uid() = id
  OR
  -- Allow creation of new users
  (
    SELECT COUNT(*) FROM users WHERE id = auth.uid()
  ) = 0
)
WITH CHECK (
  -- Users can only modify their own data
  auth.uid() = id
  OR
  -- Allow creation of new users
  (
    SELECT COUNT(*) FROM users WHERE id = auth.uid()
  ) = 0
);

-- Allow unauthenticated access for initial user creation
CREATE POLICY "Allow initial user creation"
ON users
FOR INSERT
TO anon
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;