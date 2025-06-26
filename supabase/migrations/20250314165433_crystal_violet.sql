/*
  # Fix User Policies Migration

  1. Changes
    - Drop existing policies
    - Create new policies for user management
    - Fix unique constraint handling
    - Enable RLS and grant permissions

  2. Security
    - Enable RLS on users table
    - Add policies for user management
    - Ensure proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for own user data" ON users;
DROP POLICY IF EXISTS "Enable insert access for all users" ON users;
DROP POLICY IF EXISTS "Enable update access for own user data" ON users;
DROP POLICY IF EXISTS "Enable temp users access" ON temp_users;

-- Drop the unique constraint first (which will also drop the index)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Create new policies for users table
CREATE POLICY "Users read access"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR role = 'production'  -- Allow reading production users
);

CREATE POLICY "Users insert access"
ON users
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Allow insert only if email doesn't exist
  NOT EXISTS (
    SELECT 1 FROM users u2
    WHERE LOWER(u2.email) = LOWER(email)
  )
);

CREATE POLICY "Users update access"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create policies for temp_users table
CREATE POLICY "Temp users access"
ON temp_users
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Create new case-insensitive unique index for email
CREATE UNIQUE INDEX users_email_key ON users (LOWER(email));

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE temp_users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON temp_users TO authenticated;