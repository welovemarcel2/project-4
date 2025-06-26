/*
  # Add "Unités" to default available units

  1. Changes
    - Add "Unités" to the default available units in project_settings
    - Add "Unités" to the default available units in quote_units

  2. Security
    - Maintain existing RLS policies
    - Keep data integrity
*/

-- Update default value for available_units in project_settings
ALTER TABLE project_settings 
ALTER COLUMN available_units SET DEFAULT '["Jour", "Forfait", "Semaine", "Heure", "Unités", "%", "-"]'::jsonb;

-- Update default value for available_units in quote_units
ALTER TABLE quote_units 
ALTER COLUMN available_units SET DEFAULT '["Jour", "Forfait", "Semaine", "Heure", "Unités", "%", "-"]'::jsonb;

-- Update existing rows in project_settings
UPDATE project_settings 
SET available_units = available_units || '["Unités"]'::jsonb
WHERE NOT available_units @> '["Unités"]'::jsonb;

-- Update existing rows in quote_units
UPDATE quote_units 
SET available_units = available_units || '["Unités"]'::jsonb
WHERE NOT available_units @> '["Unités"]'::jsonb;