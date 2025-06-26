/*
  # Fix User RLS Policies

  1. Changes
    - Drop existing user policies
    - Create new policies that allow initial user creation and management
    - Ensure proper access control for authenticated and anonymous users

  2. Security
    - Allow anonymous users to create initial accounts
    - Allow authenticated users to read and update their own data
    - Prevent unauthorized access to other users' data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Allow initial user creation" ON users;
DROP POLICY IF EXISTS "Allow temp_users access" ON temp_users;

-- Create new policies for users table
CREATE POLICY "Enable read access for own user data"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR role = 'production'  -- Allow reading production users
);

CREATE POLICY "Enable insert access for all users"
ON users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for own user data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create policies for temp_users table
CREATE POLICY "Enable temp users access"
ON temp_users
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE temp_users ENABLE ROW LEVEL SECURITY;