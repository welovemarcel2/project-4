/*
  # Initial Schema Setup

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `first_name` (text)
      - `last_name` (text)
      - `phone_number` (text)
      - `role` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `productions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text)
      - `address` (text)
      - `logo_url` (text)
      - `terms_and_conditions` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `projects`
      - `id` (uuid, primary key)
      - `name` (text)
      - `client` (text)
      - `owner_id` (uuid, foreign key)
      - `production_id` (uuid, foreign key)
      - `archived` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `project_settings`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `social_charge_rates` (jsonb)
      - `available_units` (jsonb)
      - `default_agency_percent` (numeric)
      - `default_margin_percent` (numeric)
      - `show_empty_items` (boolean)
      - `social_charges_display` (text)
      - `apply_social_charges_margins` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `project_shares`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `shared_by_id` (uuid, foreign key)
      - `can_edit` (boolean)
      - `can_share` (boolean)
      - `created_at` (timestamp)

    - `quotes`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `name` (text)
      - `type` (text)
      - `parent_quote_id` (uuid, foreign key)
      - `status` (text)
      - `version` (integer)
      - `rejection_reason` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `validated_at` (timestamp)
      - `rejected_at` (timestamp)

    - `quote_settings`
      - `id` (uuid, primary key)
      - `quote_id` (uuid, foreign key)
      - `show_empty_items` (boolean)
      - `social_charges_display` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `expense_categories`
      - `id` (uuid, primary key)
      - `quote_id` (uuid, foreign key)
      - `name` (text)
      - `color` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `budget_templates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text)
      - `description` (text)
      - `budget_data` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Changes
    - Initial schema creation
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT,
  role TEXT NOT NULL CHECK (role IN ('production', 'user')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Productions table
CREATE TABLE productions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  logo_url TEXT,
  terms_and_conditions TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  client TEXT NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  production_id UUID REFERENCES productions(id) ON DELETE SET NULL,
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Project settings table
CREATE TABLE project_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  social_charge_rates JSONB NOT NULL DEFAULT '[]',
  available_units JSONB NOT NULL DEFAULT '[]',
  default_agency_percent NUMERIC DEFAULT 10,
  default_margin_percent NUMERIC DEFAULT 15,
  show_empty_items BOOLEAN DEFAULT true,
  social_charges_display TEXT DEFAULT 'detailed',
  apply_social_charges_margins BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id)
);

-- Project shares table
CREATE TABLE project_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shared_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  can_edit BOOLEAN DEFAULT false,
  can_share BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id, user_id)
);

-- Quotes table
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('main', 'additive')),
  parent_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'validated', 'rejected')),
  version INTEGER NOT NULL DEFAULT 1,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  validated_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ
);

-- Quote settings table
CREATE TABLE quote_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  show_empty_items BOOLEAN DEFAULT true,
  social_charges_display TEXT DEFAULT 'detailed',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (quote_id)
);

-- Expense categories table
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Budget templates table
CREATE TABLE budget_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  budget_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Productions can be read by their owners
CREATE POLICY "Productions can be read by owners" ON productions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Projects can be read by owners and shared users
CREATE POLICY "Projects access control" ON projects
  FOR ALL
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_shares
      WHERE project_id = id AND user_id = auth.uid()
    )
  );

-- Project settings follow project access
CREATE POLICY "Project settings access control" ON project_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_shares
          WHERE project_id = projects.id AND user_id = auth.uid()
        )
      )
    )
  );

-- Project shares can be managed by project owners
CREATE POLICY "Project shares management" ON project_shares
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- Quotes follow project access
CREATE POLICY "Quotes access control" ON quotes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_shares
          WHERE project_id = projects.id AND user_id = auth.uid()
        )
      )
    )
  );

-- Quote settings follow quote access
CREATE POLICY "Quote settings access control" ON quote_settings
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

-- Expense categories follow quote access
CREATE POLICY "Expense categories access control" ON expense_categories
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

-- Budget templates can be managed by their owners
CREATE POLICY "Budget templates management" ON budget_templates
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productions_updated_at
  BEFORE UPDATE ON productions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_settings_updated_at
  BEFORE UPDATE ON project_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_settings_updated_at
  BEFORE UPDATE ON quote_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_categories_updated_at
  BEFORE UPDATE ON expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_templates_updated_at
  BEFORE UPDATE ON budget_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();