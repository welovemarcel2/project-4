/*
  # Distribution Categories and Distributions Schema

  1. New Tables
    - `distribution_categories`
      - `id` (uuid, primary key)
      - `quote_id` (uuid, references quotes)
      - `name` (text)
      - `color` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `distributions`
      - `id` (uuid, primary key) 
      - `item_id` (uuid)
      - `category_id` (uuid, references distribution_categories)
      - `amount` (numeric)
      - `type` (text, check: percentage or fixed)
      - `include_social_charges` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
    - Maintain proper access control based on project ownership and sharing
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS distributions CASCADE;
DROP TABLE IF EXISTS distribution_categories CASCADE;

-- Create distribution_categories table
CREATE TABLE distribution_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL CHECK (color ~* '^#[0-9A-F]{6}$'),
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

-- Create RLS policies for distribution_categories
CREATE POLICY "dc_read_policy"
ON distribution_categories
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

CREATE POLICY "dc_insert_policy"
ON distribution_categories
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

CREATE POLICY "dc_update_policy"
ON distribution_categories
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

CREATE POLICY "dc_delete_policy"
ON distribution_categories
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

-- Create RLS policies for distributions
CREATE POLICY "dist_read_policy"
ON distributions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM distribution_categories
    WHERE distribution_categories.id = category_id
    AND EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = distribution_categories.quote_id
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
  )
);

CREATE POLICY "dist_insert_policy"
ON distributions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM distribution_categories
    WHERE distribution_categories.id = category_id
    AND EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = distribution_categories.quote_id
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
  )
);

CREATE POLICY "dist_update_policy"
ON distributions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM distribution_categories
    WHERE distribution_categories.id = category_id
    AND EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = distribution_categories.quote_id
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
  )
);

CREATE POLICY "dist_delete_policy"
ON distributions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM distribution_categories
    WHERE distribution_categories.id = category_id
    AND EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = distribution_categories.quote_id
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
  )
);

-- Create indexes
CREATE INDEX idx_distribution_categories_quote_id ON distribution_categories(quote_id);
CREATE INDEX idx_distributions_item_id ON distributions(item_id);
CREATE INDEX idx_distributions_category_id ON distributions(category_id);

-- Create updated_at triggers
CREATE TRIGGER update_distribution_categories_updated_at
  BEFORE UPDATE ON distribution_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_distributions_updated_at
  BEFORE UPDATE ON distributions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON distribution_categories TO authenticated;
GRANT ALL ON distributions TO authenticated;