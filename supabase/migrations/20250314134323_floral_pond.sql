-- Create distribution_categories table
CREATE TABLE distribution_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create distributions table
CREATE TABLE distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL,
  category_id UUID REFERENCES distribution_categories(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  include_social_charges BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE distribution_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Distribution categories access control" ON distribution_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE id = quote_id AND
      EXISTS (
        SELECT 1 FROM projects
        WHERE id = quotes.project_id AND (
          owner_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM project_shares
            WHERE project_id = projects.id AND user_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "Distributions access control" ON distributions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM distribution_categories
      WHERE id = category_id AND
      EXISTS (
        SELECT 1 FROM quotes
        WHERE id = distribution_categories.quote_id AND
        EXISTS (
          SELECT 1 FROM projects
          WHERE id = quotes.project_id AND (
            owner_id = auth.uid() OR
            EXISTS (
              SELECT 1 FROM project_shares
              WHERE project_id = projects.id AND user_id = auth.uid()
            )
          )
        )
      )
    )
  );

-- Add updated_at triggers
CREATE TRIGGER update_distribution_categories_updated_at
  BEFORE UPDATE ON distribution_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_distributions_updated_at
  BEFORE UPDATE ON distributions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();