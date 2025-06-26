-- Drop existing email constraint and index
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key CASCADE;
DROP INDEX IF EXISTS users_email_key;
DROP INDEX IF EXISTS users_email_idx;
DROP INDEX IF EXISTS users_auth_id_key;

-- Drop existing policies
DROP POLICY IF EXISTS "Users v4 read access" ON users;
DROP POLICY IF EXISTS "Users v4 insert access" ON users;
DROP POLICY IF EXISTS "Users v4 update access" ON users;

-- Create new policies
CREATE POLICY "Users v5 read access"
ON users
FOR SELECT
TO authenticated
USING ((auth.uid() = id) OR (role = 'production'::text));

CREATE POLICY "Users v5 insert access"
ON users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Users v5 update access"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create new indexes
CREATE UNIQUE INDEX users_auth_id_key ON users(id);
CREATE INDEX users_email_idx ON users(LOWER(email));

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;