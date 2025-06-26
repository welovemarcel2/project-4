/*
  # Create Quote Units Table

  1. New Table
    - `quote_units`
      - `id` (uuid, primary key)
      - `quote_id` (uuid, foreign key)
      - `available_units` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on quote_units table
    - Add policies for authenticated users
    - Maintain data isolation between users
*/

-- Create quote_units table
CREATE TABLE quote_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    available_units JSONB DEFAULT '["Jour", "Forfait", "Semaine", "Heure", "%", "-"]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE quote_units ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "quote_units_read_policy"
ON quote_units
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = quote_id
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = quotes.project_id
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
);

CREATE POLICY "quote_units_write_policy"
ON quote_units
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = quote_id
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = quotes.project_id
      AND (
        projects.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_shares
          WHERE project_shares.project_id = projects.id
          AND project_shares.user_id = auth.uid()
          AND project_shares.can_edit = true
        )
      )
    )
  )
);

CREATE POLICY "quote_units_update_policy"
ON quote_units
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = quote_id
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = quotes.project_id
      AND (
        projects.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_shares
          WHERE project_shares.project_id = projects.id
          AND project_shares.user_id = auth.uid()
          AND project_shares.can_edit = true
        )
      )
    )
  )
);

CREATE POLICY "quote_units_delete_policy"
ON quote_units
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = quote_id
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = quotes.project_id
      AND (
        projects.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_shares
          WHERE project_shares.project_id = projects.id
          AND project_shares.user_id = auth.uid()
          AND project_shares.can_edit = true
        )
      )
    )
  )
);

-- Create index for better performance
CREATE INDEX idx_quote_units_quote_id ON quote_units(quote_id);

-- Create updated_at trigger
CREATE TRIGGER update_quote_units_updated_at
  BEFORE UPDATE ON quote_units
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON quote_units TO authenticated;