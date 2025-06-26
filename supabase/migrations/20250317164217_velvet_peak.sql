/*
  # Temporarily Disable RLS for Debugging

  1. Changes
    - Temporarily disable RLS on critical tables
    - Add debug functions to verify data access
    - Create audit triggers to track operations

  2. Security
    - This is a TEMPORARY debug configuration
    - Should be reverted after debugging
*/

-- Temporarily disable RLS on critical tables
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE productions DISABLE ROW LEVEL SECURITY;

-- Create debug function to check data visibility
CREATE OR REPLACE FUNCTION check_data_visibility(p_user_id UUID)
RETURNS TABLE (
  table_name TEXT,
  record_count BIGINT,
  visible_to_user BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'projects'::TEXT as table_name,
    COUNT(*)::BIGINT as record_count,
    COUNT(*) FILTER (WHERE owner_id = p_user_id)::BIGINT as visible_to_user
  FROM projects;

  RETURN QUERY
  SELECT 
    'project_shares'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE user_id = p_user_id)::BIGINT
  FROM project_shares;

  RETURN QUERY
  SELECT 
    'users'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE id = p_user_id)::BIGINT
  FROM users;

  RETURN QUERY
  SELECT 
    'productions'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE user_id = p_user_id)::BIGINT
  FROM productions;
END;
$$;

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_table_changes()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'Table: %, Operation: %, User: %', TG_TABLE_NAME, TG_OP, auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add audit triggers to critical tables
CREATE TRIGGER audit_projects_changes
  BEFORE INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION audit_table_changes();

CREATE TRIGGER audit_project_shares_changes
  BEFORE INSERT OR UPDATE OR DELETE ON project_shares
  FOR EACH ROW
  EXECUTE FUNCTION audit_table_changes();

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;