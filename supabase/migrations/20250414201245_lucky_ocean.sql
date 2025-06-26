/*
  # Create Project Social Charges Table

  1. New Table
    - `project_social_charges`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `social_charge_rates` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on project_social_charges table
    - Add policies for authenticated users
    - Maintain data isolation between users
*/

-- Create project_social_charges table
CREATE TABLE project_social_charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    social_charge_rates JSONB DEFAULT '[{"id": "65", "label": "Techniciens", "rate": 0.65}, {"id": "55", "label": "Artistes", "rate": 0.55}, {"id": "3", "label": "Auteur", "rate": 0.03}]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE project_social_charges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "project_social_charges_read_policy"
ON project_social_charges
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

CREATE POLICY "project_social_charges_write_policy"
ON project_social_charges
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

CREATE POLICY "project_social_charges_update_policy"
ON project_social_charges
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

CREATE POLICY "project_social_charges_delete_policy"
ON project_social_charges
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
CREATE INDEX idx_project_social_charges_project_id ON project_social_charges(project_id);

-- Create updated_at trigger
CREATE TRIGGER update_project_social_charges_updated_at
  BEFORE UPDATE ON project_social_charges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON project_social_charges TO authenticated;