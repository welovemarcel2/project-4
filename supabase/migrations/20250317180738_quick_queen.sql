/*
  # Add Default Agency Percent Column

  1. Changes
    - Add defaultAgencyPercent column to project_settings table
    - Add defaultMarginPercent column to project_settings table
    - Set default values for both columns
    - Create index for performance

  2. Security
    - Maintain existing RLS policies
    - Keep data consistency
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
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_settings_default_percents 
ON project_settings(default_agency_percent, default_margin_percent);

-- Flush schema cache
NOTIFY pgrst, 'reload schema';