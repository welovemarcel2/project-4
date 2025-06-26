-- Add foreign key constraints to projects table
DO $$ 
BEGIN
  -- Check if constraints exist before adding them
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_producers_id_fkey'
  ) THEN
    ALTER TABLE projects
    ADD CONSTRAINT projects_producers_id_fkey
    FOREIGN KEY (producers_id) REFERENCES project_producers(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_informations_id_fkey'
  ) THEN
    ALTER TABLE projects
    ADD CONSTRAINT projects_informations_id_fkey
    FOREIGN KEY (informations_id) REFERENCES project_informations(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_rates_id_fkey'
  ) THEN
    ALTER TABLE projects
    ADD CONSTRAINT projects_rates_id_fkey
    FOREIGN KEY (rates_id) REFERENCES project_rates(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_social_charges_id_fkey'
  ) THEN
    ALTER TABLE projects
    ADD CONSTRAINT projects_social_charges_id_fkey
    FOREIGN KEY (social_charges_id) REFERENCES project_social_charges(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_currencies_id_fkey'
  ) THEN
    ALTER TABLE projects
    ADD CONSTRAINT projects_currencies_id_fkey
    FOREIGN KEY (currencies_id) REFERENCES project_currencies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add foreign key constraints to quotes table
DO $$ 
BEGIN
  -- Check if constraints exist before adding them
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quotes_displays_id_fkey'
  ) THEN
    ALTER TABLE quotes
    ADD CONSTRAINT quotes_displays_id_fkey
    FOREIGN KEY (displays_id) REFERENCES quote_displays(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quotes_numberings_id_fkey'
  ) THEN
    ALTER TABLE quotes
    ADD CONSTRAINT quotes_numberings_id_fkey
    FOREIGN KEY (numberings_id) REFERENCES quote_numberings(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quotes_units_id_fkey'
  ) THEN
    ALTER TABLE quotes
    ADD CONSTRAINT quotes_units_id_fkey
    FOREIGN KEY (units_id) REFERENCES quote_units(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update RLS policies to reflect new schema
DROP POLICY IF EXISTS "Project settings read access" ON project_settings;
DROP POLICY IF EXISTS "Project settings write access" ON project_settings;

CREATE POLICY "Project settings read access" ON project_settings FOR SELECT TO authenticated USING (EXISTS (SELECT 1
   FROM projects
  WHERE ((projects.id = project_settings.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()))))))));

CREATE POLICY "Project settings write access" ON project_settings FOR ALL TO authenticated USING (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_settings.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
WITH CHECK (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_settings.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))));

DROP POLICY IF EXISTS "quote_displays_read_policy" ON quote_displays;
DROP POLICY IF EXISTS "quote_displays_write_policy" ON quote_displays;

CREATE POLICY "quote_displays_read_policy" ON quote_displays FOR SELECT TO authenticated USING (EXISTS ( SELECT 1
   FROM quotes
  WHERE ((quotes.id = quote_displays.quote_id) AND (EXISTS ( SELECT 1
           FROM projects
          WHERE ((projects.id = quotes.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
                   FROM project_shares
                  WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid())))))))))))
;
CREATE POLICY "quote_displays_write_policy" ON quote_displays FOR ALL TO authenticated USING (EXISTS ( SELECT 1
   FROM quotes
  WHERE ((quotes.id = quote_displays.quote_id) AND (EXISTS ( SELECT 1
           FROM projects
          WHERE ((projects.id = quotes.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
                   FROM project_shares
                  WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true)))))))))))
WITH CHECK (EXISTS ( SELECT 1
   FROM quotes
  WHERE ((quotes.id = quote_displays.quote_id) AND (EXISTS ( SELECT 1
           FROM projects
          WHERE ((projects.id = quotes.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
                   FROM project_shares
                  WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true)))))))))))
;

DROP POLICY IF EXISTS "quote_numberings_read_policy" ON quote_numberings;
DROP POLICY IF EXISTS "quote_numberings_write_policy" ON quote_numberings;

CREATE POLICY "quote_numberings_read_policy" ON quote_numberings FOR SELECT TO authenticated USING (EXISTS ( SELECT 1
   FROM quotes
  WHERE ((quotes.id = quote_numberings.quote_id) AND (EXISTS ( SELECT 1
           FROM projects
          WHERE ((projects.id = quotes.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
                   FROM project_shares
                  WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid())))))))))))
;
CREATE POLICY "quote_numberings_write_policy" ON quote_numberings FOR ALL TO authenticated USING (EXISTS ( SELECT 1
   FROM quotes
  WHERE ((quotes.id = quote_numberings.quote_id) AND (EXISTS ( SELECT 1
           FROM projects
          WHERE ((projects.id = quotes.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
                   FROM project_shares
                  WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true)))))))))))
WITH CHECK (EXISTS ( SELECT 1
   FROM quotes
  WHERE ((quotes.id = quote_numberings.quote_id) AND (EXISTS ( SELECT 1
           FROM projects
          WHERE ((projects.id = quotes.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
                   FROM project_shares
                  WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true)))))))))))
;

DROP POLICY IF EXISTS "quote_units_read_policy" ON quote_units;
DROP POLICY IF EXISTS "quote_units_write_policy" ON quote_units;

CREATE POLICY "quote_units_read_policy" ON quote_units FOR SELECT TO authenticated USING (EXISTS ( SELECT 1
   FROM quotes
  WHERE ((quotes.id = quote_units.quote_id) AND (EXISTS ( SELECT 1
           FROM projects
          WHERE ((projects.id = quotes.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
                   FROM project_shares
                  WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid())))))))))))
;
CREATE POLICY "quote_units_write_policy" ON quote_units FOR ALL TO authenticated USING (EXISTS ( SELECT 1
   FROM quotes
  WHERE ((quotes.id = quote_units.quote_id) AND (EXISTS ( SELECT 1
           FROM projects
          WHERE ((projects.id = quotes.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
                   FROM project_shares
                  WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true)))))))))))
WITH CHECK (EXISTS ( SELECT 1
   FROM quotes
  WHERE ((quotes.id = quote_units.quote_id) AND (EXISTS ( SELECT 1
           FROM projects
          WHERE ((projects.id = quotes.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
                   FROM project_shares
                  WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true)))))))))))
;

DROP POLICY IF EXISTS "project_producers_read_policy" ON project_producers;
DROP POLICY IF EXISTS "project_producers_write_policy" ON project_producers;
DROP POLICY IF EXISTS "project_producers_update_policy" ON project_producers;
DROP POLICY IF EXISTS "project_producers_delete_policy" ON project_producers;

CREATE POLICY "project_producers_read_policy" ON project_producers FOR SELECT TO authenticated USING (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_producers.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()))))))))
;
CREATE POLICY "project_producers_write_policy" ON project_producers FOR ALL TO authenticated USING (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_producers.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
WITH CHECK (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_producers.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
;
CREATE POLICY "project_producers_update_policy" ON project_producers FOR UPDATE TO authenticated USING (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_producers.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
WITH CHECK (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_producers.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
;
CREATE POLICY "project_producers_delete_policy" ON project_producers FOR DELETE TO authenticated USING (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_producers.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
;

DROP POLICY IF EXISTS "project_informations_read_policy" ON project_informations;
DROP POLICY IF EXISTS "project_informations_write_policy" ON project_informations;
DROP POLICY IF EXISTS "project_informations_update_policy" ON project_informations;
DROP POLICY IF EXISTS "project_informations_delete_policy" ON project_informations;

CREATE POLICY "project_informations_read_policy" ON project_informations FOR SELECT TO authenticated USING (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_informations.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()))))))))
;
CREATE POLICY "project_informations_write_policy" ON project_informations FOR ALL TO authenticated USING (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_informations.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
WITH CHECK (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_informations.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
;
CREATE POLICY "project_informations_update_policy" ON project_informations FOR UPDATE TO authenticated USING (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_informations.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
WITH CHECK (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_informations.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
;
CREATE POLICY "project_informations_delete_policy" ON project_informations FOR DELETE TO authenticated USING (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_informations.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
;

DROP POLICY IF EXISTS "project_rates_read_policy" ON project_rates;
DROP POLICY IF EXISTS "project_rates_write_policy" ON project_rates;
DROP POLICY IF EXISTS "project_rates_update_policy" ON project_rates;
DROP POLICY IF EXISTS "project_rates_delete_policy" ON project_rates;

CREATE POLICY "project_rates_read_policy" ON project_rates FOR SELECT TO authenticated USING (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_rates.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()))))))))
;
CREATE POLICY "project_rates_write_policy" ON project_rates FOR ALL TO authenticated USING (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_rates.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
WITH CHECK (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_rates.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
;
CREATE POLICY "project_rates_update_policy" ON project_rates FOR UPDATE TO authenticated USING (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_rates.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
WITH CHECK (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_rates.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
;
CREATE POLICY "project_rates_delete_policy" ON project_rates FOR DELETE TO authenticated USING (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_rates.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
;

DROP POLICY IF EXISTS "project_social_charges_read_policy" ON project_social_charges;
DROP POLICY IF EXISTS "project_social_charges_write_policy" ON project_social_charges;
DROP POLICY IF EXISTS "project_social_charges_update_policy" ON project_social_charges;
DROP POLICY IF EXISTS "project_social_charges_delete_policy" ON project_social_charges;

CREATE POLICY "project_social_charges_read_policy" ON project_social_charges FOR SELECT TO authenticated USING (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_social_charges.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()))))))))
;
CREATE POLICY "project_social_charges_write_policy" ON project_social_charges FOR ALL TO authenticated USING (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_social_charges.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
WITH CHECK (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_social_charges.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
;
CREATE POLICY "project_social_charges_update_policy" ON project_social_charges FOR UPDATE TO authenticated USING (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_social_charges.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
WITH CHECK (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_social_charges.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
;
CREATE POLICY "project_social_charges_delete_policy" ON project_social_charges FOR DELETE TO authenticated USING (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_social_charges.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
;

DROP POLICY IF EXISTS "project_currencies_read_policy" ON project_currencies;
DROP POLICY IF EXISTS "project_currencies_write_policy" ON project_currencies;
DROP POLICY IF EXISTS "project_currencies_update_policy" ON project_currencies;
DROP POLICY IF EXISTS "project_currencies_delete_policy" ON project_currencies;

CREATE POLICY "project_currencies_read_policy" ON project_currencies FOR SELECT TO authenticated USING (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_currencies.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()))))))))
;
CREATE POLICY "project_currencies_write_policy" ON project_currencies FOR ALL TO authenticated USING (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_currencies.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
WITH CHECK (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_currencies.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
;
CREATE POLICY "project_currencies_update_policy" ON project_currencies FOR UPDATE TO authenticated USING (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_currencies.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
WITH CHECK (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_currencies.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
;
CREATE POLICY "project_currencies_delete_policy" ON project_currencies FOR DELETE TO authenticated USING (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_currencies.project_id) AND ((projects.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM project_shares
          WHERE ((project_shares.project_id = projects.id) AND (project_shares.user_id = auth.uid()) AND (project_shares.can_edit = true))))))))
;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_project_currencies_project_id 
ON project_currencies(project_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_project_producers_project_id 
ON project_producers(project_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_project_informations_project_id 
ON project_informations(project_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_project_rates_project_id 
ON project_rates(project_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_project_social_charges_project_id 
ON project_social_charges(project_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_project_currencies_project_id 
ON project_currencies(project_id);