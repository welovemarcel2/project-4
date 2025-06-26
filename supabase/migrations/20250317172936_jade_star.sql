/*
  # Add Social Charges Margins Column

  1. Changes
    - Add apply_social_charges_margins column to project_settings table
    - Set default value to false
    - Update existing rows
    - Add index for performance

  2. Security
    - Maintain existing RLS policies
    - Keep data consistency
*/

-- Add column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'project_settings' 
    AND column_name = 'apply_social_charges_margins'
  ) THEN
    -- Add the column
    ALTER TABLE project_settings 
    ADD COLUMN apply_social_charges_margins BOOLEAN DEFAULT false;

    -- Update existing rows
    UPDATE project_settings 
    SET apply_social_charges_margins = false 
    WHERE apply_social_charges_margins IS NULL;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_project_settings_apply_social_charges 
ON project_settings(apply_social_charges_margins);