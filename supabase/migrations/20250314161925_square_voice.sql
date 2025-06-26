/*
  # Fix users RLS policies

  1. Changes
    - Drop existing restrictive policies
    - Add new policies that allow initial user creation
    - Maintain security while allowing necessary operations

  2. Security
    - Allow unauthenticated users to create initial accounts
    - Maintain data isolation between users
    - Preserve ability for users to manage their own data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage own data" ON users;
DROP POLICY IF EXISTS "Allow initial user creation" ON users;

-- Create new policies for user management
CREATE POLICY "Allow initial user creation"
ON users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;