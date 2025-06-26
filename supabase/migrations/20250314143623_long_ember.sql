/*
  # Fix Distribution Categories RLS Policies

  1. Changes
    - Simplifies RLS policy to allow basic operations
    - Adds proper permissions for authenticated users
    - Ensures RLS is enabled
    - Adds performance indexes

  2. Security
    - Enables RLS on distribution_categories table
    - Adds policy for authenticated users
    - Grants necessary permissions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Distribution categories access" ON distribution_categories;

-- Create a simpler policy that allows basic operations
CREATE POLICY "Distribution categories basic access"
ON distribution_categories
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE distribution_categories ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT ALL ON distribution_categories TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_distribution_categories_quote_id 
ON distribution_categories(quote_id);