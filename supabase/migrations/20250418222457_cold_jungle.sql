/*
  # Add Agency and Margin Percent to Social Charge Rates

  1. Changes
    - Add agencyPercent and marginPercent fields to socialChargeRates in project_social_charges
    - Update existing rows to include default values
    - Add proper validation for the new fields

  2. Security
    - Maintain existing RLS policies
    - Keep data integrity
*/

-- Update existing rows in project_social_charges to add agencyPercent and marginPercent to each rate
UPDATE project_social_charges
SET social_charge_rates = (
  SELECT jsonb_agg(
    CASE
      WHEN rate->>'agencyPercent' IS NULL THEN 
        jsonb_set(rate, '{agencyPercent}', '10')
      ELSE rate
    END
  )
  FROM jsonb_array_elements(social_charge_rates) AS rate
)
WHERE social_charge_rates IS NOT NULL;

UPDATE project_social_charges
SET social_charge_rates = (
  SELECT jsonb_agg(
    CASE
      WHEN rate->>'marginPercent' IS NULL THEN 
        jsonb_set(rate, '{marginPercent}', '15')
      ELSE rate
    END
  )
  FROM jsonb_array_elements(social_charge_rates) AS rate
)
WHERE social_charge_rates IS NOT NULL;

-- Update default value for social_charge_rates in project_social_charges
ALTER TABLE project_social_charges 
ALTER COLUMN social_charge_rates SET DEFAULT '[{"id": "65", "label": "Techniciens", "rate": 0.65, "agencyPercent": 10, "marginPercent": 15}, {"id": "55", "label": "Artistes", "rate": 0.55, "agencyPercent": 10, "marginPercent": 15}, {"id": "3", "label": "Auteur", "rate": 0.03, "agencyPercent": 10, "marginPercent": 15}]'::jsonb;