/*
  # Fix Project Settings Schema

  1. Changes
    - Drop and recreate project_settings table with correct column names
    - Add proper default values
    - Create necessary indexes
    - Add RLS policies

  2. Security
    - Enable RLS
    - Add proper access control
*/

-- Drop existing table and its dependencies
DROP TABLE IF EXISTS project_settings CASCADE;

-- Create project_settings table with proper structure
CREATE TABLE project_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  social_charge_rates JSONB NOT NULL DEFAULT '[]'::jsonb,
  available_units JSONB NOT NULL DEFAULT '["Jour", "Forfait", "Semaine", "Heure", "%", "-"]'::jsonb,
  default_agency_percent NUMERIC DEFAULT 10,
  default_margin_percent NUMERIC DEFAULT 15,
  show_empty_items BOOLEAN DEFAULT true,
  social_charges_display TEXT DEFAULT 'detailed',
  apply_social_charges_margins BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id)
);

-- Create indexes for better performance
CREATE INDEX idx_project_settings_project_id ON project_settings(project_id);
CREATE INDEX idx_project_settings_default_percents ON project_settings(default_agency_percent, default_margin_percent);
CREATE INDEX idx_project_settings_available_units ON project_settings USING gin(available_units);
CREATE INDEX idx_project_settings_apply_social_charges ON project_settings(apply_social_charges_margins);

-- Enable RLS
ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Project settings read access"
ON project_settings
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

CREATE POLICY "Project settings write access"
ON project_settings
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

CREATE POLICY "Project settings update access"
ON project_settings
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

-- Create updated_at trigger
CREATE TRIGGER update_project_settings_updated_at
  BEFORE UPDATE ON project_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON project_settings TO authenticated;

-- Flush schema cache to ensure changes are recognized
NOTIFY pgrst, 'reload schema';