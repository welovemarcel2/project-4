-- Drop existing policies
DROP POLICY IF EXISTS "Distribution categories access" ON distribution_categories;

-- Create a simpler, more permissive policy for testing
CREATE POLICY "Distribution categories access"
ON distribution_categories
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = quote_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = quote_id
  )
);

-- Ensure RLS is enabled
ALTER TABLE distribution_categories ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT ALL ON distribution_categories TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_distribution_categories_quote_id 
ON distribution_categories(quote_id);