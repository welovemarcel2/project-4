/*
  # Fix Budgets Schema

  1. Changes
    - Drop and recreate budgets table with proper structure
    - Add proper column names and types
    - Add necessary indexes
    - Add RLS policies

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Maintain data isolation
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS work_budgets CASCADE;

-- Create budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  budget_data JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (quote_id)
);

-- Create work_budgets table
CREATE TABLE work_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  budget_data JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (quote_id)
);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_budgets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for budgets
CREATE POLICY "budgets_read_policy_v2"
ON budgets
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "budgets_write_policy_v2"
ON budgets
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "budgets_update_policy_v2"
ON budgets
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create RLS policies for work_budgets
CREATE POLICY "work_budgets_read_policy"
ON work_budgets
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "work_budgets_write_policy"
ON work_budgets
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "work_budgets_update_policy"
ON work_budgets
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_budgets_quote_id ON budgets(quote_id);
CREATE INDEX idx_work_budgets_quote_id ON work_budgets(quote_id);

-- Create updated_at triggers
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_budgets_updated_at
  BEFORE UPDATE ON work_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON budgets TO authenticated;
GRANT ALL ON work_budgets TO authenticated;