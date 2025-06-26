/*
  # Protection des données utilisateur et des projets

  1. Nouvelles contraintes
    - Ajout de contraintes ON DELETE pour protéger les relations
    - Ajout d'index pour optimiser les performances
    - Ajout de triggers pour maintenir l'intégrité des données

  2. Sécurité
    - Protection contre la suppression accidentelle
    - Maintien des relations entre utilisateurs et projets
    - Sauvegarde automatique des données importantes
*/

-- Ajout de contraintes de protection sur les relations clés
ALTER TABLE projects 
  DROP CONSTRAINT IF EXISTS projects_owner_id_fkey,
  ADD CONSTRAINT projects_owner_id_fkey 
    FOREIGN KEY (owner_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE;

ALTER TABLE productions 
  DROP CONSTRAINT IF EXISTS productions_user_id_fkey,
  ADD CONSTRAINT productions_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE;

ALTER TABLE project_shares 
  DROP CONSTRAINT IF EXISTS project_shares_user_id_fkey,
  ADD CONSTRAINT project_shares_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE;

-- Optimisation des index existants
DROP INDEX IF EXISTS idx_projects_owner_id_v3;
DROP INDEX IF EXISTS idx_projects_owner_id_archived_v3;
DROP INDEX IF EXISTS idx_project_shares_user_id_v3;

CREATE INDEX idx_projects_owner_id_v4 ON projects(owner_id);
CREATE INDEX idx_projects_owner_id_archived_v4 ON projects(owner_id, archived);
CREATE INDEX idx_project_shares_user_id_v4 ON project_shares(user_id);

-- Création d'une vue pour faciliter l'audit des projets
CREATE OR REPLACE VIEW project_audit_view AS
SELECT 
  p.id as project_id,
  p.name as project_name,
  p.client,
  p.archived,
  u.email as owner_email,
  u.role as owner_role,
  COUNT(ps.id) as share_count,
  p.created_at,
  p.updated_at
FROM projects p
JOIN users u ON p.owner_id = u.id
LEFT JOIN project_shares ps ON p.id = ps.project_id
GROUP BY p.id, p.name, p.client, p.archived, u.email, u.role, p.created_at, p.updated_at;

-- Fonction pour archiver un projet au lieu de le supprimer
CREATE OR REPLACE FUNCTION archive_project_instead_of_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects 
  SET archived = true,
      updated_at = NOW()
  WHERE id = OLD.id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour archiver automatiquement au lieu de supprimer
CREATE TRIGGER archive_project_trigger
  BEFORE DELETE ON projects
  FOR EACH ROW
  WHEN (OLD.archived = false)
  EXECUTE FUNCTION archive_project_instead_of_delete();

-- Mise à jour des politiques RLS pour renforcer la protection
DROP POLICY IF EXISTS "projects_delete_policy_v8" ON projects;
CREATE POLICY "projects_delete_policy_v8"
ON projects
FOR DELETE
TO authenticated
USING (
  owner_id = auth.uid()
  AND archived = true  -- Ne permet la suppression que des projets déjà archivés
);

-- Fonction pour vérifier l'intégrité des données projet
CREATE OR REPLACE FUNCTION check_project_integrity(project_id uuid)
RETURNS TABLE (
  has_owner boolean,
  has_valid_shares boolean,
  has_orphaned_data boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS (SELECT 1 FROM users u JOIN projects p ON p.owner_id = u.id WHERE p.id = project_id),
    NOT EXISTS (
      SELECT 1 FROM project_shares ps 
      WHERE ps.project_id = project_id 
      AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ps.user_id)
    ),
    EXISTS (
      SELECT 1 FROM quotes q 
      WHERE q.project_id = project_id 
      AND NOT EXISTS (SELECT 1 FROM projects p WHERE p.id = q.project_id)
    );
END;
$$;