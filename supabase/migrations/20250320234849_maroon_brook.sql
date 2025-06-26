/*
  # Fix Quote History Migration

  1. Changes
    - Drop existing policies before recreating
    - Add proper indexes
    - Add RLS policies with unique names

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Maintain data isolation
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "quote_history_read_policy" ON quote_history;
DROP POLICY IF EXISTS "quote_history_write_policy" ON quote_history;

-- Create quote_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS quote_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  budget_data JSONB NOT NULL,
  description TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes first for better performance
CREATE INDEX IF NOT EXISTS idx_quote_history_quote_id ON quote_history(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_history_created_by ON quote_history(created_by);
CREATE INDEX IF NOT EXISTS idx_quote_history_version ON quote_history(quote_id, version_number);

-- Enable RLS
ALTER TABLE quote_history ENABLE ROW LEVEL SECURITY;

-- Create new policies with unique names
CREATE POLICY "quote_history_read_policy_v2"
ON quote_history
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

CREATE POLICY "quote_history_write_policy_v2"
ON quote_history
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

-- Grant necessary permissions
GRANT ALL ON quote_history TO authenticated;