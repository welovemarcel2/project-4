-- Add foreign key columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS producers_id UUID REFERENCES project_producers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS informations_id UUID REFERENCES project_informations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS rates_id UUID REFERENCES project_rates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS social_charges_id UUID REFERENCES project_social_charges(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS currencies_id UUID REFERENCES project_currencies(id) ON DELETE SET NULL;

-- Add foreign key columns to quotes table
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS displays_id UUID REFERENCES quote_displays(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS numberings_id UUID REFERENCES quote_numberings(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS units_id UUID REFERENCES quote_units(id) ON DELETE SET NULL;

-- Update projects foreign keys
DO $$
DECLARE
  project_record RECORD;
  v_producers_id UUID;
  v_informations_id UUID;
  v_rates_id UUID;
  v_social_charges_id UUID;
  v_currencies_id UUID;
BEGIN
  FOR project_record IN SELECT id FROM projects
  LOOP
    -- Get producers_id
    SELECT id INTO v_producers_id FROM project_producers WHERE project_id = project_record.id LIMIT 1;
    
    -- Get informations_id
    SELECT id INTO v_informations_id FROM project_informations WHERE project_id = project_record.id LIMIT 1;
    
    -- Get rates_id
    SELECT id INTO v_rates_id FROM project_rates WHERE project_id = project_record.id LIMIT 1;
    
    -- Get social_charges_id
    SELECT id INTO v_social_charges_id FROM project_social_charges WHERE project_id = project_record.id LIMIT 1;
    
    -- Get currencies_id
    SELECT id INTO v_currencies_id FROM project_currencies WHERE project_id = project_record.id LIMIT 1;
    
    -- Update project
    UPDATE projects
    SET 
      producers_id = v_producers_id,
      informations_id = v_informations_id,
      rates_id = v_rates_id,
      social_charges_id = v_social_charges_id,
      currencies_id = v_currencies_id
    WHERE id = project_record.id;
  END LOOP;
END $$;

-- Update quotes foreign keys
DO $$
DECLARE
  quote_record RECORD;
  v_displays_id UUID;
  v_numberings_id UUID;
  v_units_id UUID;
BEGIN
  FOR quote_record IN SELECT id FROM quotes
  LOOP
    -- Get displays_id
    SELECT id INTO v_displays_id FROM quote_displays WHERE quote_id = quote_record.id LIMIT 1;
    
    -- Get numberings_id
    SELECT id INTO v_numberings_id FROM quote_numberings WHERE quote_id = quote_record.id LIMIT 1;
    
    -- Get units_id
    SELECT id INTO v_units_id FROM quote_units WHERE quote_id = quote_record.id LIMIT 1;
    
    -- Update quote
    UPDATE quotes
    SET 
      displays_id = v_displays_id,
      numberings_id = v_numberings_id,
      units_id = v_units_id
    WHERE id = quote_record.id;
  END LOOP;
END $$;