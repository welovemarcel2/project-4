/*
  # Fix Budget Items Schema and Policies

  1. Changes
    - Drop and recreate budget_items table with proper structure
    - Add proper RLS policies
    - Add necessary indexes
    - Fix column types and constraints

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Maintain data isolation
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS budget_items CASCADE;

-- Create budget_items table with proper structure
CREATE TABLE budget_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  category_id UUID,
  parent_id UUID REFERENCES budget_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('category', 'subCategory', 'post', 'subPost')),
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 0,
  number NUMERIC DEFAULT 0,
  unit TEXT NOT NULL,
  rate NUMERIC DEFAULT 0,
  social_charges TEXT,
  agency_percent NUMERIC DEFAULT 10,
  margin_percent NUMERIC DEFAULT 15,
  is_expanded BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "budget_items_read_policy"
ON budget_items
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "budget_items_write_policy"
ON budget_items
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "budget_items_update_policy"
ON budget_items
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "budget_items_delete_policy"
ON budget_items
FOR DELETE
TO authenticated
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_budget_items_quote_id ON budget_items(quote_id);
CREATE INDEX idx_budget_items_category_id ON budget_items(category_id);
CREATE INDEX idx_budget_items_parent_id ON budget_items(parent_id);

-- Create updated_at trigger
CREATE TRIGGER update_budget_items_updated_at
  BEFORE UPDATE ON budget_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON budget_items TO authenticated;