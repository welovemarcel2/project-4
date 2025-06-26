/*
  # Fix Project Settings Columns

  1. New Columns
    - `default_agency_percent` (numeric, default 10)
    - `default_margin_percent` (numeric, default 15)
    - `available_units` (jsonb, default empty array)
    - `apply_social_charges_margins` (boolean, default false)

  2. Changes
    - Add missing columns with proper defaults
    - Create indexes for performance
    - Flush schema cache to ensure changes are recognized
*/

-- Check if columns exist and add them if missing
DO $$ 
BEGIN
  -- Check and add defaultAgencyPercent
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'project_settings' 
    AND column_name = 'default_agency_percent'
  ) THEN
    ALTER TABLE project_settings 
    ADD COLUMN default_agency_percent NUMERIC DEFAULT 10;
  END IF;

  -- Check and add defaultMarginPercent
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'project_settings' 
    AND column_name = 'default_margin_percent'
  ) THEN
    ALTER TABLE project_settings 
    ADD COLUMN default_margin_percent NUMERIC DEFAULT 15;
  END IF;

  -- Check and add availableUnits
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'project_settings' 
    AND column_name = 'available_units'
  ) THEN
    ALTER TABLE project_settings 
    ADD COLUMN available_units JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;

  -- Check and add applySocialChargesMargins
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_settings_default_percents 
ON project_settings(default_agency_percent, default_margin_percent);

CREATE INDEX IF NOT EXISTS idx_project_settings_available_units 
ON project_settings USING gin(available_units);

CREATE INDEX IF NOT EXISTS idx_project_settings_apply_social_charges 
ON project_settings(apply_social_charges_margins);

-- Flush schema cache to ensure changes are recognized
NOTIFY pgrst, 'reload schema';