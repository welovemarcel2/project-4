-- Drop existing policies
DROP POLICY IF EXISTS "Distribution categories read access" ON distribution_categories;
DROP POLICY IF EXISTS "Distribution categories write access" ON distribution_categories;

-- Create a single policy that handles all operations
CREATE POLICY "Distribution categories access"
ON distribution_categories
FOR ALL
TO authenticated
USING (
  quote_id IS NOT NULL
  AND EXISTS (
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
)
WITH CHECK (
  quote_id IS NOT NULL
  AND EXISTS (
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

-- Create index to improve performance of RLS policy
CREATE INDEX IF NOT EXISTS idx_distribution_categories_quote_id ON distribution_categories(quote_id);