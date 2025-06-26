/*
  # Mise à jour des politiques RLS

  1. Changements
    - Correction de la syntaxe des politiques RLS
    - Séparation des politiques pour chaque type d'opération
    - Maintien des mêmes règles d'accès

  2. Sécurité
    - Maintien des contrôles d'accès existants
    - Protection des données entre utilisateurs
*/

-- Nettoyer les politiques existantes
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Allow initial user creation" ON users;
DROP POLICY IF EXISTS "Productions can be read by owners" ON productions;
DROP POLICY IF EXISTS "Projects access control" ON projects;
DROP POLICY IF EXISTS "Project settings access control" ON project_settings;
DROP POLICY IF EXISTS "Project shares management" ON project_shares;
DROP POLICY IF EXISTS "Quotes access control" ON quotes;
DROP POLICY IF EXISTS "Quote settings access control" ON quote_settings;
DROP POLICY IF EXISTS "Distribution categories access" ON distribution_categories;
DROP POLICY IF EXISTS "Distributions access" ON distributions;
DROP POLICY IF EXISTS "Budget templates management" ON budget_templates;

-- Politiques pour la table users
CREATE POLICY "Allow initial user creation"
ON users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Politiques pour la table productions
CREATE POLICY "Productions read access"
ON productions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'production'
  )
);

CREATE POLICY "Productions write access"
ON productions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Productions update access"
ON productions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Productions delete access"
ON productions
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Politiques pour la table projects
CREATE POLICY "Projects read access"
ON projects
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM project_shares
    WHERE project_shares.project_id = id
    AND project_shares.user_id = auth.uid()
  )
);

CREATE POLICY "Projects insert access"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Projects update access"
ON projects
FOR UPDATE
TO authenticated
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM project_shares
    WHERE project_shares.project_id = id
    AND project_shares.user_id = auth.uid()
    AND project_shares.can_edit = true
  )
)
WITH CHECK (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM project_shares
    WHERE project_shares.project_id = id
    AND project_shares.user_id = auth.uid()
    AND project_shares.can_edit = true
  )
);

CREATE POLICY "Projects delete access"
ON projects
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Politiques pour la table project_settings
CREATE POLICY "Project settings read access"
ON project_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND (
      projects.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_shares
        WHERE project_shares.project_id = projects.id
        AND project_shares.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Project settings write access"
ON project_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
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
);

CREATE POLICY "Project settings update access"
ON project_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
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
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
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
);

CREATE POLICY "Project settings delete access"
ON project_settings
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
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
);

-- Politiques pour la table project_shares
CREATE POLICY "Project shares read access"
ON project_shares
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND (
      projects.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_shares ps
        WHERE ps.project_id = projects.id
        AND ps.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Project shares write access"
ON project_shares
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND (
      projects.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_shares ps
        WHERE ps.project_id = projects.id
        AND ps.user_id = auth.uid()
        AND ps.can_share = true
      )
    )
  )
);

CREATE POLICY "Project shares update access"
ON project_shares
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND (
      projects.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_shares ps
        WHERE ps.project_id = projects.id
        AND ps.user_id = auth.uid()
        AND ps.can_share = true
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND (
      projects.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_shares ps
        WHERE ps.project_id = projects.id
        AND ps.user_id = auth.uid()
        AND ps.can_share = true
      )
    )
  )
);

CREATE POLICY "Project shares delete access"
ON project_shares
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND (
      projects.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_shares ps
        WHERE ps.project_id = projects.id
        AND ps.user_id = auth.uid()
        AND ps.can_share = true
      )
    )
  )
);

-- Politiques pour la table quotes
CREATE POLICY "Quotes read access"
ON quotes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND (
      projects.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_shares
        WHERE project_shares.project_id = projects.id
        AND project_shares.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Quotes write access"
ON quotes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
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
);

CREATE POLICY "Quotes update access"
ON quotes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
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
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
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
);

CREATE POLICY "Quotes delete access"
ON quotes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
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
);

-- Politiques pour la table budget_templates
CREATE POLICY "Budget templates read access"
ON budget_templates
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Budget templates write access"
ON budget_templates
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Budget templates update access"
ON budget_templates
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Budget templates delete access"
ON budget_templates
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Vérifier que RLS est activé pour toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_templates ENABLE ROW LEVEL SECURITY;