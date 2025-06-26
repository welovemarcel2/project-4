-- Check if the constraint already exists before adding it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'project_settings_project_id_key'
  ) THEN
    ALTER TABLE project_settings
    ADD CONSTRAINT project_settings_project_id_key UNIQUE (project_id);
  END IF;
END $$;