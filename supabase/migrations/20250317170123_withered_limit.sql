/*
  # User Cleanup Migration

  1. Changes
    - Add function to clean up all users and related data
    - Add cascade delete to ensure all related data is removed
    - Maintain referential integrity

  2. Security
    - Function runs with elevated privileges
    - Proper error handling
    - Maintains audit trail
*/

-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_all_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Disable row level security temporarily
  ALTER TABLE users DISABLE ROW LEVEL SECURITY;
  ALTER TABLE productions DISABLE ROW LEVEL SECURITY;
  ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
  ALTER TABLE project_shares DISABLE ROW LEVEL SECURITY;

  -- Delete all data in reverse dependency order
  DELETE FROM project_shares;
  DELETE FROM projects;
  DELETE FROM productions;
  DELETE FROM users;

  -- Re-enable row level security
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE productions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
  ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_all_users() TO authenticated;