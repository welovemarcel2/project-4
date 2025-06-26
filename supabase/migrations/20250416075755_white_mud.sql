-- Check if table exists before creating
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'production_terms') THEN
    -- Create production_terms table
    CREATE TABLE production_terms (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        production_id UUID REFERENCES productions(id) ON DELETE CASCADE,
        terms_and_conditions TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE production_terms ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    CREATE POLICY "production_terms_read_policy"
    ON production_terms
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM productions
        WHERE productions.id = production_id
        AND (
          productions.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM projects
            WHERE projects.production_id = productions.id
            AND (
              projects.owner_id = auth.uid()
              OR EXISTS (
                SELECT 1 FROM project_shares
                WHERE project_shares.project_id = projects.id
                AND project_shares.user_id = auth.uid()
              )
            )
          )
        )
      )
    );

    CREATE POLICY "production_terms_write_policy"
    ON production_terms
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM productions
        WHERE productions.id = production_id
        AND productions.user_id = auth.uid()
      )
    );

    CREATE POLICY "production_terms_update_policy"
    ON production_terms
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM productions
        WHERE productions.id = production_id
        AND productions.user_id = auth.uid()
      )
    );

    CREATE POLICY "production_terms_delete_policy"
    ON production_terms
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM productions
        WHERE productions.id = production_id
        AND productions.user_id = auth.uid()
      )
    );

    -- Create index for better performance
    CREATE INDEX idx_production_terms_production_id ON production_terms(production_id);

    -- Create updated_at trigger
    CREATE TRIGGER update_production_terms_updated_at
      BEFORE UPDATE ON production_terms
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    -- Grant necessary permissions
    GRANT ALL ON production_terms TO authenticated;
  END IF;
END $$;

-- Check if terms_and_conditions column exists in productions table
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'productions' 
    AND column_name = 'terms_and_conditions'
  ) THEN
    -- Migrate data from productions to production_terms
    INSERT INTO production_terms (production_id, terms_and_conditions)
    SELECT id, terms_and_conditions
    FROM productions
    WHERE terms_and_conditions IS NOT NULL
    ON CONFLICT (production_id) DO NOTHING;
  END IF;
END $$;

-- Add foreign key column to productions table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'productions' 
    AND column_name = 'terms_id'
  ) THEN
    ALTER TABLE productions
    ADD COLUMN terms_id UUID REFERENCES production_terms(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update productions foreign keys
DO $$
DECLARE
  production_record RECORD;
  v_terms_id UUID;
BEGIN
  FOR production_record IN SELECT id FROM productions
  LOOP
    -- Get terms_id
    SELECT id INTO v_terms_id FROM production_terms WHERE production_id = production_record.id LIMIT 1;
    
    -- Update production only if terms_id is not null
    IF v_terms_id IS NOT NULL THEN
      UPDATE productions
      SET terms_id = v_terms_id
      WHERE id = production_record.id;
    END IF;
  END LOOP;
END $$;

-- Remove terms_and_conditions column from productions if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'productions' 
    AND column_name = 'terms_and_conditions'
  ) THEN
    ALTER TABLE productions
    DROP COLUMN terms_and_conditions;
  END IF;
END $$;