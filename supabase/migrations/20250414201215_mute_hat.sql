/*
  # Create Quote Numberings Table

  1. New Table
    - `quote_numberings`
      - `id` (uuid, primary key)
      - `quote_id` (uuid, foreign key)
      - `category` (text)
      - `sub_category` (text)
      - `post` (text)
      - `sub_post` (text)
      - `separator` (text)
      - `continuous_numbering` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on quote_numberings table
    - Add policies for authenticated users
    - Maintain data isolation between users
*/

-- Create quote_numberings table
CREATE TABLE quote_numberings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    category TEXT DEFAULT 'numeric',
    sub_category TEXT DEFAULT 'numeric',
    post TEXT DEFAULT 'numeric',
    sub_post TEXT DEFAULT 'numeric',
    separator TEXT DEFAULT '.',
    continuous_numbering BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE quote_numberings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "quote_numberings_read_policy"
ON quote_numberings
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

CREATE POLICY "quote_numberings_write_policy"
ON quote_numberings
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

CREATE POLICY "quote_numberings_update_policy"
ON quote_numberings
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

CREATE POLICY "quote_numberings_delete_policy"
ON quote_numberings
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
CREATE INDEX idx_quote_numberings_quote_id ON quote_numberings(quote_id);

-- Create updated_at trigger
CREATE TRIGGER update_quote_numberings_updated_at
  BEFORE UPDATE ON quote_numberings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON quote_numberings TO authenticated;