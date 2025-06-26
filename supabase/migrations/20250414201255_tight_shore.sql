/*
  # Create Project Currencies Table

  1. New Table
    - `project_currencies`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `selected_currency` (text)
      - `currencies` (jsonb)
      - `last_update` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on project_currencies table
    - Add policies for authenticated users
    - Maintain data isolation between users
*/

-- Create project_currencies table
CREATE TABLE project_currencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    selected_currency TEXT DEFAULT 'EUR',
    currencies JSONB DEFAULT '[{"code": "EUR", "symbol": "€", "name": "Euro", "rate": 1}, {"code": "USD", "symbol": "$", "name": "Dollar US", "rate": 1.09}, {"code": "GBP", "symbol": "£", "name": "Livre Sterling", "rate": 0.86}, {"code": "CHF", "symbol": "CHF", "name": "Franc Suisse", "rate": 0.96}, {"code": "CAD", "symbol": "C$", "name": "Dollar Canadien", "rate": 1.48}]'::jsonb,
    last_update TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE project_currencies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "project_currencies_read_policy"
ON project_currencies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND (
      projects.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_shares
        WHERE project_shares.project_id = projects.id
        AND project_shares.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "project_currencies_write_policy"
ON project_currencies
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
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
);

CREATE POLICY "project_currencies_update_policy"
ON project_currencies
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
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
);

CREATE POLICY "project_currencies_delete_policy"
ON project_currencies
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
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
);

-- Create index for better performance
CREATE INDEX idx_project_currencies_project_id ON project_currencies(project_id);

-- Create updated_at trigger
CREATE TRIGGER update_project_currencies_updated_at
  BEFORE UPDATE ON project_currencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON project_currencies TO authenticated;