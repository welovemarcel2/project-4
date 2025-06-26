/*
  # Add apply_social_charges_margins Column

  1. Changes
    - Check if column exists
    - Add column if missing
    - Set default value
    - Update existing rows

  2. Security
    - Use IF NOT EXISTS to prevent errors
    - Maintain existing permissions
*/

DO $$ 
BEGIN
  -- Check if column exists
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