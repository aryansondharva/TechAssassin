-- Migration: Create activity_cooldowns table
-- Description: Tracks cooldown periods for duplicate activity XP awards
-- Requirements: 20.4

CREATE TABLE IF NOT EXISTS activity_cooldowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  reference_id VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT unique_user_activity_reference UNIQUE (user_id, activity_type, reference_id)
);

-- Create indexes for performance optimization
CREATE INDEX idx_activity_cooldowns_user_id ON activity_cooldowns(user_id);
CREATE INDEX idx_activity_cooldowns_expires_at ON activity_cooldowns(expires_at);

-- Add comments for documentation
COMMENT ON TABLE activity_cooldowns IS 'Tracks cooldown periods to prevent duplicate XP awards for the same activity';
COMMENT ON COLUMN activity_cooldowns.activity_type IS 'Type of activity (e.g., "event_registration", "code_contribution")';
COMMENT ON COLUMN activity_cooldowns.reference_id IS 'Unique identifier for the specific activity instance (e.g., event_id, contribution_id)';
COMMENT ON COLUMN activity_cooldowns.expires_at IS 'Timestamp when the cooldown expires and XP can be awarded again';
