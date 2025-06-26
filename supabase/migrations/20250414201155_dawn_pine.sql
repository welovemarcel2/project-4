/*
  # Create Project Informations Table

  1. New Table
    - `project_informations`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `agency` (text)
      - `advertiser` (text)
      - `product` (text)
      - `title` (text)
      - `custom_fields` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on project_informations table
    - Add policies for authenticated users
    - Maintain data isolation between users
*/

-- Create project_informations table
CREATE TABLE project_informations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    agency TEXT,
    advertiser TEXT,
    product TEXT,
    title TEXT,
    custom_fields JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE project_informations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "project_informations_read_policy"
ON project_informations
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

CREATE POLICY "project_informations_write_policy"
ON project_informations
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

CREATE POLICY "project_informations_update_policy"
ON project_informations
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

CREATE POLICY "project_informations_delete_policy"
ON project_informations
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
CREATE INDEX idx_project_informations_project_id ON project_informations(project_id);

-- Create updated_at trigger
CREATE TRIGGER update_project_informations_updated_at
  BEFORE UPDATE ON project_informations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON project_informations TO authenticated;