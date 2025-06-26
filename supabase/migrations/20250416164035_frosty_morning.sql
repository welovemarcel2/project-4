-- Check if the constraint already exists before adding it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'quote_notes_quote_id_key'
  ) THEN
    ALTER TABLE quote_notes
    ADD CONSTRAINT quote_notes_quote_id_key UNIQUE (quote_id);
  END IF;
END $$;