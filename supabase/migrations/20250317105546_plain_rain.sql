/*
  # Fix User Authentication and Data Retrieval

  1. Changes
    - Drop existing user policies
    - Create new simplified policies for user access
    - Fix user data retrieval with proper joins
    - Add proper indexes for performance

  2. Security
    - Enable RLS on users table
    - Add policies for user management
    - Ensure proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "users_read_policy_v3" ON users;
DROP POLICY IF EXISTS "users_write_policy_v3" ON users;
DROP POLICY IF EXISTS "users_update_policy_v3" ON users;

-- Drop existing indexes
DROP INDEX IF EXISTS users_auth_id_key;
DROP INDEX IF EXISTS users_email_case_insensitive_idx;

-- Create new policies
CREATE POLICY "users_read_policy_v4"
ON users
FOR SELECT
TO authenticated
USING (
  -- Users can read:
  -- 1. Their own data
  -- 2. Production users' data if they need to interact with them
  id = auth.uid()
  OR role = 'production'
  OR EXISTS (
    SELECT 1 FROM projects
    WHERE projects.owner_id = auth.uid()
    AND projects.production_id IN (
      SELECT p.id FROM productions p
      WHERE p.user_id = users.id
    )
  )
);

CREATE POLICY "users_write_policy_v4"
ON users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "users_update_policy_v4"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Create new indexes
CREATE UNIQUE INDEX users_id_key ON users(id);
CREATE INDEX users_email_lower_idx ON users(LOWER(email));
CREATE INDEX users_role_idx ON users(role);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;

-- Create helper function to get user with production data
CREATE OR REPLACE FUNCTION get_user_with_production(user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  role TEXT,
  production_name TEXT,
  production_address TEXT,
  production_logo TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.phone_number,
    u.role,
    p.name as production_name,
    p.address as production_address,
    p.logo_url as production_logo,
    u.created_at,
    u.updated_at
  FROM users u
  LEFT JOIN productions p ON p.user_id = u.id
  WHERE u.id = user_id;
END;
$$;