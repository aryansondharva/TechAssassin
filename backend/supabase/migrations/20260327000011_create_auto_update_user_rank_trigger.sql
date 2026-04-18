-- Migration: Create auto_update_user_rank() function and trigger
-- This function automatically recalculates user rank when total_xp changes
-- Requirements: 6.2, 6.3, 6.4, 6.6

-- Create function to automatically update user rank based on XP
CREATE OR REPLACE FUNCTION auto_update_user_rank()
RETURNS TRIGGER AS $$
DECLARE
  new_rank_id UUID;
  old_rank_id UUID;
BEGIN
  old_rank_id := NEW.current_rank_id;
  
  -- Find the highest rank the user qualifies for based on their total_xp
  -- Ranks are ordered by minimum_xp_threshold descending to get the highest qualifying rank
  SELECT id INTO new_rank_id
  FROM rank_tiers
  WHERE minimum_xp_threshold <= NEW.total_xp
  ORDER BY minimum_xp_threshold DESC
  LIMIT 1;
  
  -- Only update if the rank has actually changed
  IF new_rank_id IS DISTINCT FROM old_rank_id THEN
    -- Update the NEW record directly (more efficient than separate UPDATE)
    NEW.current_rank_id := new_rank_id;
    
    -- Record the rank change in history (only if new rank is not null)
    IF new_rank_id IS NOT NULL THEN
      INSERT INTO user_ranks_history (user_id, rank_id)
      VALUES (NEW.id, new_rank_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update rank when total_xp changes
DROP TRIGGER IF EXISTS trigger_auto_update_rank ON profiles;
CREATE TRIGGER trigger_auto_update_rank
BEFORE UPDATE OF total_xp ON profiles
FOR EACH ROW
WHEN (OLD.total_xp IS DISTINCT FROM NEW.total_xp)
EXECUTE FUNCTION auto_update_user_rank();
