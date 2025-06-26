/*
  # Fix Duplicate Constraints in Project Tables

  1. Changes
    - Delete duplicate rows in project_informations table
    - Add unique constraints safely after cleaning up data
    - Add proper indexes for performance

  2. Security
    - Maintain existing RLS policies
    - Keep data integrity
*/

-- First, identify and remove duplicate rows in project_informations
DO $$ 
DECLARE
  project_record RECORD;
  duplicate_count INTEGER;
  keep_id UUID;
BEGIN
  -- Find projects with multiple project_informations records
  FOR project_record IN 
    SELECT project_id, COUNT(*) as count
    FROM project_informations
    GROUP BY project_id
    HAVING COUNT(*) > 1
  LOOP
    -- Get the ID of the record to keep (the most recently updated one)
    SELECT id INTO keep_id
    FROM project_informations
    WHERE project_id = project_record.project_id
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- Delete all other records for this project
    DELETE FROM project_informations
    WHERE project_id = project_record.project_id
    AND id != keep_id;
    
    RAISE NOTICE 'Cleaned up % duplicate records for project %', project_record.count - 1, project_record.project_id;
  END LOOP;
END $$;

-- Do the same for project_producers
DO $$ 
DECLARE
  project_record RECORD;
  duplicate_count INTEGER;
  keep_id UUID;
BEGIN
  -- Find projects with multiple project_producers records
  FOR project_record IN 
    SELECT project_id, COUNT(*) as count
    FROM project_producers
    GROUP BY project_id
    HAVING COUNT(*) > 1
  LOOP
    -- Get the ID of the record to keep (the most recently updated one)
    SELECT id INTO keep_id
    FROM project_producers
    WHERE project_id = project_record.project_id
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- Delete all other records for this project
    DELETE FROM project_producers
    WHERE project_id = project_record.project_id
    AND id != keep_id;
    
    RAISE NOTICE 'Cleaned up % duplicate records for project %', project_record.count - 1, project_record.project_id;
  END LOOP;
END $$;

-- Do the same for project_rates
DO $$ 
DECLARE
  project_record RECORD;
  duplicate_count INTEGER;
  keep_id UUID;
BEGIN
  -- Find projects with multiple project_rates records
  FOR project_record IN 
    SELECT project_id, COUNT(*) as count
    FROM project_rates
    GROUP BY project_id
    HAVING COUNT(*) > 1
  LOOP
    -- Get the ID of the record to keep (the most recently updated one)
    SELECT id INTO keep_id
    FROM project_rates
    WHERE project_id = project_record.project_id
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- Delete all other records for this project
    DELETE FROM project_rates
    WHERE project_id = project_record.project_id
    AND id != keep_id;
    
    RAISE NOTICE 'Cleaned up % duplicate records for project %', project_record.count - 1, project_record.project_id;
  END LOOP;
END $$;

-- Do the same for project_social_charges
DO $$ 
DECLARE
  project_record RECORD;
  duplicate_count INTEGER;
  keep_id UUID;
BEGIN
  -- Find projects with multiple project_social_charges records
  FOR project_record IN 
    SELECT project_id, COUNT(*) as count
    FROM project_social_charges
    GROUP BY project_id
    HAVING COUNT(*) > 1
  LOOP
    -- Get the ID of the record to keep (the most recently updated one)
    SELECT id INTO keep_id
    FROM project_social_charges
    WHERE project_id = project_record.project_id
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- Delete all other records for this project
    DELETE FROM project_social_charges
    WHERE project_id = project_record.project_id
    AND id != keep_id;
    
    RAISE NOTICE 'Cleaned up % duplicate records for project %', project_record.count - 1, project_record.project_id;
  END LOOP;
END $$;

-- Do the same for project_currencies
DO $$ 
DECLARE
  project_record RECORD;
  duplicate_count INTEGER;
  keep_id UUID;
BEGIN
  -- Find projects with multiple project_currencies records
  FOR project_record IN 
    SELECT project_id, COUNT(*) as count
    FROM project_currencies
    GROUP BY project_id
    HAVING COUNT(*) > 1
  LOOP
    -- Get the ID of the record to keep (the most recently updated one)
    SELECT id INTO keep_id
    FROM project_currencies
    WHERE project_id = project_record.project_id
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- Delete all other records for this project
    DELETE FROM project_currencies
    WHERE project_id = project_record.project_id
    AND id != keep_id;
    
    RAISE NOTICE 'Cleaned up % duplicate records for project %', project_record.count - 1, project_record.project_id;
  END LOOP;
END $$;

-- Now add unique constraints safely
-- Add unique constraint to project_informations table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'project_informations_project_id_key'
  ) THEN
    BEGIN
      ALTER TABLE project_informations
      ADD CONSTRAINT project_informations_project_id_key UNIQUE (project_id);
      EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'Could not add unique constraint to project_informations - duplicate data still exists';
    END;
  END IF;
END $$;

-- Add unique constraint to project_producers table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'project_producers_project_id_key'
  ) THEN
    BEGIN
      ALTER TABLE project_producers
      ADD CONSTRAINT project_producers_project_id_key UNIQUE (project_id);
      EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'Could not add unique constraint to project_producers - duplicate data still exists';
    END;
  END IF;
END $$;

-- Add unique constraint to project_rates table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'project_rates_project_id_key'
  ) THEN
    BEGIN
      ALTER TABLE project_rates
      ADD CONSTRAINT project_rates_project_id_key UNIQUE (project_id);
      EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'Could not add unique constraint to project_rates - duplicate data still exists';
    END;
  END IF;
END $$;

-- Add unique constraint to project_social_charges table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'project_social_charges_project_id_key'
  ) THEN
    BEGIN
      ALTER TABLE project_social_charges
      ADD CONSTRAINT project_social_charges_project_id_key UNIQUE (project_id);
      EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'Could not add unique constraint to project_social_charges - duplicate data still exists';
    END;
  END IF;
END $$;

-- Add unique constraint to project_currencies table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'project_currencies_project_id_key'
  ) THEN
    BEGIN
      ALTER TABLE project_currencies
      ADD CONSTRAINT project_currencies_project_id_key UNIQUE (project_id);
      EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'Could not add unique constraint to project_currencies - duplicate data still exists';
    END;
  END IF;
END $$;

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_project_informations_project_id_v2 
ON project_informations(project_id);

CREATE INDEX IF NOT EXISTS idx_project_producers_project_id_v2 
ON project_producers(project_id);

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';