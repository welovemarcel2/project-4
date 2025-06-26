/*
  # Add Production Account Migration Support

  1. Changes
    - Add function to handle production account conversion
    - Add trigger to update user role on production creation
    - Add necessary indexes for performance

  2. Security
    - Maintain RLS protection
    - Ensure proper role transitions
*/

-- Create function to handle production account conversion
CREATE OR REPLACE FUNCTION handle_production_conversion()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user role to production
  UPDATE users
  SET role = 'production'
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update user role
CREATE TRIGGER production_conversion_trigger
  AFTER INSERT ON productions
  FOR EACH ROW
  EXECUTE FUNCTION handle_production_conversion();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_productions_user_id_v3 
ON productions(user_id);

-- Ensure RLS is enabled
ALTER TABLE productions ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON productions TO authenticated;