/*
  # Synchronisation des utilisateurs

  1. Ajout
    - Ajoute une table temporaire pour stocker les utilisateurs à migrer
    - Ajoute une fonction pour synchroniser les utilisateurs

  2. Sécurité
    - Ajoute des politiques RLS spécifiques pour la synchronisation
*/

-- Créer une table temporaire pour les utilisateurs à migrer
CREATE TABLE IF NOT EXISTS temp_users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT,
  role TEXT NOT NULL CHECK (role IN ('production', 'user')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fonction pour synchroniser un utilisateur
CREATE OR REPLACE FUNCTION sync_user(
  p_id UUID,
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_phone_number TEXT,
  p_role TEXT
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Vérifier si l'utilisateur existe déjà
  SELECT id INTO v_user_id FROM users WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    -- Créer un nouvel utilisateur
    INSERT INTO users (
      id,
      email,
      first_name,
      last_name,
      phone_number,
      role
    ) VALUES (
      p_id,
      p_email,
      p_first_name,
      p_last_name,
      p_phone_number,
      p_role
    ) RETURNING id INTO v_user_id;
  ELSE
    -- Mettre à jour l'utilisateur existant
    UPDATE users SET
      first_name = p_first_name,
      last_name = p_last_name,
      phone_number = p_phone_number,
      role = p_role,
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajouter une politique RLS pour la fonction de synchronisation
CREATE POLICY "Allow sync_user function" ON users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ajouter une politique RLS pour la table temporaire
CREATE POLICY "Allow temp_users access" ON temp_users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);