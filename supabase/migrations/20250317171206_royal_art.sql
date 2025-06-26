-- Drop existing policies
DROP POLICY IF EXISTS "users_read_policy_v10" ON users;
DROP POLICY IF EXISTS "users_write_policy_v10" ON users;
DROP POLICY IF EXISTS "users_update_policy_v10" ON users;

-- Drop existing indexes (if they exist and aren't dependencies)
DROP INDEX IF EXISTS users_email_lower_idx_v7;
DROP INDEX IF EXISTS users_role_idx_v7;

-- Create new policies
CREATE POLICY "users_read_policy_v11"
ON users
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR role = 'production'
);

CREATE POLICY "users_write_policy_v11"
ON users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "users_update_policy_v11"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Create new indexes (if they don't exist)
CREATE INDEX IF NOT EXISTS users_email_lower_idx_v8 ON users(lower(email));
CREATE INDEX IF NOT EXISTS users_role_idx_v8 ON users(role);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure email is lowercase
  NEW.email = lower(NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new users
DROP TRIGGER IF EXISTS handle_new_user_trigger ON users;
CREATE TRIGGER handle_new_user_trigger
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Grant permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;

-- Create function to check auth status
CREATE OR REPLACE FUNCTION check_auth_status(p_email TEXT)
RETURNS TABLE (
  user_exists BOOLEAN,
  is_valid BOOLEAN,
  user_role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS (SELECT 1 FROM users WHERE lower(email) = lower(p_email)) as user_exists,
    EXISTS (SELECT 1 FROM users WHERE lower(email) = lower(p_email) AND id = auth.uid()) as is_valid,
    (SELECT role FROM users WHERE lower(email) = lower(p_email)) as user_role;
END;
$$;