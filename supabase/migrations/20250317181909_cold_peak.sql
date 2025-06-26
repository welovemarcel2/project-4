/*
  # Fix Project Settings Column Names

  1. Changes
    - Rename camelCase columns to snake_case
    - Add missing columns if they don't exist
    - Create proper indexes for performance

  2. Security
    - Maintain data integrity during column renames
    - Keep existing data
*/

-- Rename columns from camelCase to snake_case if they exist
DO $$ 
BEGIN
  -- Rename defaultAgencyPercent to default_agency_percent if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'project_settings' 
    AND column_name = 'defaultagencypercent'
  ) THEN
    ALTER TABLE project_settings 
    RENAME COLUMN defaultagencypercent TO default_agency_percent;
  END IF;

  -- Rename defaultMarginPercent to default_margin_percent if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'project_settings' 
    AND column_name = 'defaultmarginpercent'
  ) THEN
    ALTER TABLE project_settings 
    RENAME COLUMN defaultmarginpercent TO default_margin_percent;
  END IF;
END $$;

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add default_agency_percent if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'project_settings' 
    AND column_name = 'default_agency_percent'
  ) THEN
    ALTER TABLE project_settings 
    ADD COLUMN default_agency_percent NUMERIC DEFAULT 10;
  END IF;

  -- Add default_margin_percent if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'project_settings' 
    AND column_name = 'default_margin_percent'
  ) THEN
    ALTER TABLE project_settings 
    ADD COLUMN default_margin_percent NUMERIC DEFAULT 15;
  END IF;

  -- Add available_units if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'project_settings' 
    AND column_name = 'available_units'
  ) THEN
    ALTER TABLE project_settings 
    ADD COLUMN available_units JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;

  -- Add apply_social_charges_margins if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'project_settings' 
    AND column_name = 'apply_social_charges_margins'
  ) THEN
    ALTER TABLE project_settings 
    ADD COLUMN apply_social_charges_margins BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create or replace indexes for better performance
DROP INDEX IF EXISTS idx_project_settings_default_percents;
DROP INDEX IF EXISTS idx_project_settings_available_units;
DROP INDEX IF EXISTS idx_project_settings_apply_social_charges;

CREATE INDEX idx_project_settings_default_percents 
ON project_settings(default_agency_percent, default_margin_percent);

CREATE INDEX idx_project_settings_available_units 
ON project_settings USING gin(available_units);

CREATE INDEX idx_project_settings_apply_social_charges 
ON project_settings(apply_social_charges_margins);

-- Flush schema cache to ensure changes are recognized
NOTIFY pgrst, 'reload schema';