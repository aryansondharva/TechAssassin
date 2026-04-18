-- Migration: Create update_user_total_xp() function and trigger
-- This function automatically updates profiles.total_xp when xp_transactions are inserted
-- Requirements: 1.3

-- Create function to update user's total XP
CREATE OR REPLACE FUNCTION update_user_total_xp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's total_xp by adding the new transaction amount
  UPDATE profiles
  SET total_xp = total_xp + NEW.amount
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update total_xp on XP transaction insert
CREATE TRIGGER trigger_update_total_xp
AFTER INSERT ON xp_transactions
FOR EACH ROW
EXECUTE FUNCTION update_user_total_xp();
