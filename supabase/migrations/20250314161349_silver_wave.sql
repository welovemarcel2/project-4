/*
  # Nettoyage des tables de répartition

  1. Suppression
    - Supprime la table expense_categories qui fait doublon
    - Supprime les anciennes politiques RLS

  2. Mise à jour
    - Renomme certains champs pour plus de clarté
    - Ajoute des contraintes manquantes
*/

-- Supprimer l'ancienne table et ses dépendances
DROP TABLE IF EXISTS expense_categories CASCADE;

-- Nettoyer les tables existantes
ALTER TABLE distribution_categories
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Ajouter des contraintes de validation
ALTER TABLE distribution_categories
  ADD CONSTRAINT valid_color CHECK (color ~* '^#[0-9A-F]{6}$');

-- Mettre à jour les index pour de meilleures performances
DROP INDEX IF EXISTS idx_distribution_categories_quote_id;
CREATE INDEX idx_distribution_categories_quote_id_name ON distribution_categories(quote_id, name);

-- Mettre à jour les politiques RLS
DROP POLICY IF EXISTS "Distribution categories access" ON distribution_categories;
DROP POLICY IF EXISTS "Distributions access" ON distributions;

-- Nouvelle politique pour les catégories
CREATE POLICY "Distribution categories access"
ON distribution_categories
FOR ALL
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

-- Nouvelle politique pour les distributions
CREATE POLICY "Distributions access"
ON distributions
FOR ALL
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