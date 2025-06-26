-- Drop existing policies
DROP POLICY IF EXISTS "production_terms_read_policy" ON production_terms;
DROP POLICY IF EXISTS "production_terms_write_policy" ON production_terms;
DROP POLICY IF EXISTS "production_terms_update_policy" ON production_terms;
DROP POLICY IF EXISTS "production_terms_delete_policy" ON production_terms;
DROP POLICY IF EXISTS "Temp users access v2" ON production_terms;

-- Create a single policy for all operations
CREATE POLICY "Temp users access v2" ON production_terms
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE production_terms ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON production_terms TO authenticated;
GRANT ALL ON production_terms TO anon;