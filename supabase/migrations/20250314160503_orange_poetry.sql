/*
  # Fix Distribution Categories Implementation

  1. Changes
    - Drops and recreates distribution_categories table with proper structure
    - Adds proper RLS policies for secure access control
    - Adds necessary indexes for performance

  2. Security
    - Enables RLS on distribution_categories table
    - Adds policies for authenticated users to manage their categories
    - Ensures proper access control through project ownership and shares
*/

-- Drop existing table and policies
DROP TABLE IF EXISTS distribution_categories CASCADE;

-- Create distribution_categories table
CREATE TABLE distribution_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE distribution_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for all operations
CREATE POLICY "Distribution categories management"
ON distribution_categories
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = quote_id
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = quotes.project_id
      AND (
        projects.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_shares
          WHERE project_shares.project_id = projects.id
          AND project_shares.user_id = auth.uid()
          AND project_shares.can_edit = true
        )
      )
    )
  )
);

-- Create indexes
CREATE INDEX idx_distribution_categories_quote_id ON distribution_categories(quote_id);

-- Create updated_at trigger
CREATE TRIGGER update_distribution_categories_updated_at
  BEFORE UPDATE ON distribution_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON distribution_categories TO authenticated;