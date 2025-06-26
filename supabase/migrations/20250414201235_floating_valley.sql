/*
  # Create Project Rates Table

  1. New Table
    - `project_rates`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `default_agency_percent` (numeric)
      - `default_margin_percent` (numeric)
      - `rate_labels` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on project_rates table
    - Add policies for authenticated users
    - Maintain data isolation between users
*/

-- Create project_rates table
CREATE TABLE project_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    default_agency_percent NUMERIC DEFAULT 10,
    default_margin_percent NUMERIC DEFAULT 15,
    rate_labels JSONB DEFAULT '{"rate1Label": "TX 1", "rate2Label": "TX 2"}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE project_rates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "project_rates_read_policy"
ON project_rates
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

CREATE POLICY "project_rates_write_policy"
ON project_rates
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

CREATE POLICY "project_rates_update_policy"
ON project_rates
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

CREATE POLICY "project_rates_delete_policy"
ON project_rates
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
CREATE INDEX idx_project_rates_project_id ON project_rates(project_id);

-- Create updated_at trigger
CREATE TRIGGER update_project_rates_updated_at
  BEFORE UPDATE ON project_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON project_rates TO authenticated;