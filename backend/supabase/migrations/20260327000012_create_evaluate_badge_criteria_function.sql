-- Migration: Create evaluate_badge_criteria() function
-- This function evaluates badge unlock_criteria JSON against user stats
-- Requirements: 4.1, 4.2, 4.5

-- Create function to evaluate if a user meets badge unlock criteria
CREATE OR REPLACE FUNCTION evaluate_badge_criteria(
  p_user_id UUID,
  p_badge_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  badge_criteria JSONB;
  criteria_type TEXT;
  conditions JSONB;
  condition JSONB;
  field TEXT;
  operator TEXT;
  required_value NUMERIC;
  current_value NUMERIC;
  all_met BOOLEAN := true;
BEGIN
  -- Get badge unlock criteria
  SELECT unlock_criteria INTO badge_criteria
  FROM badges
  WHERE id = p_badge_id AND is_active = true;
  
  -- If badge doesn't exist or is inactive, return false
  IF badge_criteria IS NULL THEN
    RETURN false;
  END IF;
  
  criteria_type := badge_criteria->>'type';
  conditions := badge_criteria->'conditions';
  
  -- Evaluate each condition in the criteria
  FOR condition IN SELECT * FROM jsonb_array_elements(conditions)
  LOOP
    field := condition->>'field';
    operator := condition->>'operator';
    required_value := (condition->>'value')::NUMERIC;
    
    -- Get current value based on field
    CASE field
      WHEN 'total_xp' THEN
        SELECT total_xp INTO current_value FROM profiles WHERE id = p_user_id;
      WHEN 'event_count' THEN
        SELECT COUNT(*) INTO current_value FROM registrations WHERE user_id = p_user_id;
      WHEN 'current_streak' THEN
        SELECT current_streak INTO current_value FROM profiles WHERE id = p_user_id;
      WHEN 'longest_streak' THEN
        SELECT longest_streak INTO current_value FROM profiles WHERE id = p_user_id;
      WHEN 'badge_count' THEN
        SELECT COUNT(*) INTO current_value 
        FROM user_badges 
        WHERE user_id = p_user_id AND revoked_at IS NULL;
      WHEN 'profile_completion' THEN
        SELECT profile_completion_percentage INTO current_value 
        FROM profiles 
        WHERE id = p_user_id;
      ELSE
        -- Unknown field, default to 0
        current_value := 0;
    END CASE;
    
    -- Check condition based on operator
    CASE operator
      WHEN 'gte' THEN
        all_met := all_met AND (current_value >= required_value);
      WHEN 'lte' THEN
        all_met := all_met AND (current_value <= required_value);
      WHEN 'eq' THEN
        all_met := all_met AND (current_value = required_value);
      WHEN 'gt' THEN
        all_met := all_met AND (current_value > required_value);
      WHEN 'lt' THEN
        all_met := all_met AND (current_value < required_value);
      ELSE
        -- Unknown operator, fail the condition
        all_met := false;
    END CASE;
    
    -- Short circuit if any condition fails
    IF NOT all_met THEN
      RETURN false;
    END IF;
  END LOOP;
  
  -- All conditions met
  RETURN all_met;
END;
$$ LANGUAGE plpgsql;
