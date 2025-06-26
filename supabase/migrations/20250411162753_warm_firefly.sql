/*
  # Budget Templates Migration

  1. New Tables
    - `budget_templates` for storing user budget templates
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text)
      - `description` (text)
      - `budget_data` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on budget_templates table
    - Add policies for proper access control
    - Maintain data isolation between users
*/

-- Create budget_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS budget_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  budget_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE budget_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Budget templates read access" ON budget_templates;
DROP POLICY IF EXISTS "Budget templates write access" ON budget_templates;
DROP POLICY IF EXISTS "Budget templates update access" ON budget_templates;
DROP POLICY IF EXISTS "Budget templates delete access" ON budget_templates;

-- Create RLS policies
CREATE POLICY "Budget templates read access"
ON budget_templates
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Budget templates write access"
ON budget_templates
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Budget templates update access"
ON budget_templates
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Budget templates delete access"
ON budget_templates
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Create updated_at trigger if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_budget_templates_updated_at'
  ) THEN
    CREATE TRIGGER update_budget_templates_updated_at
      BEFORE UPDATE ON budget_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON budget_templates TO authenticated;