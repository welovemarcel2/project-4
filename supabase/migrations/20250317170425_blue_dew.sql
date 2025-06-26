-- Drop existing function if it exists
DROP FUNCTION IF EXISTS cleanup_all_users();

-- Create new cleanup function with WHERE clauses
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

  -- Delete all data in reverse dependency order with WHERE clauses
  DELETE FROM project_shares 
  WHERE id != '00000000-0000-0000-0000-000000000000';
  
  DELETE FROM projects 
  WHERE id != '00000000-0000-0000-0000-000000000000';
  
  DELETE FROM productions 
  WHERE id != '00000000-0000-0000-0000-000000000000';
  
  DELETE FROM users 
  WHERE id != '00000000-0000-0000-0000-000000000000';

  -- Re-enable row level security
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE productions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
  ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_all_users() TO authenticated;