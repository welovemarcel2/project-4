-- Check if column exists and add it if missing
DO $$ 
BEGIN
  -- Check if column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'project_settings' 
    AND column_name = 'available_units'
  ) THEN
    -- Add the column
    ALTER TABLE project_settings 
    ADD COLUMN available_units JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_project_settings_available_units 
ON project_settings USING gin(available_units);

-- Flush schema cache
NOTIFY pgrst, 'reload schema';