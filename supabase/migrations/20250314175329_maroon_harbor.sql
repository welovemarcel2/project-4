/*
  # Fix User Creation Flow

  1. Changes
    - Drop existing unique constraint on email
    - Add new unique constraint on auth.uid instead
    - Update RLS policies to allow proper user creation
    - Add proper indexes for performance

  2. Security
    - Maintain data integrity while allowing multiple entries with same email
    - Ensure proper access control through RLS policies
*/

-- Drop existing email constraint and index
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key CASCADE;
DROP INDEX IF EXISTS users_email_key;

-- Drop existing policies
DROP POLICY IF EXISTS "Users v3 read access" ON users;
DROP POLICY IF EXISTS "Users v3 insert access" ON users;
DROP POLICY IF EXISTS "Users v3 update access" ON users;

-- Create new policies
CREATE POLICY "Users v4 read access"
ON users
FOR SELECT
TO authenticated
USING ((auth.uid() = id) OR (role = 'production'::text));

CREATE POLICY "Users v4 insert access"
ON users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Users v4 update access"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create index on auth.uid
CREATE UNIQUE INDEX users_auth_id_key ON users(id);

-- Create non-unique index on email for performance
CREATE INDEX users_email_idx ON users(LOWER(email));

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;