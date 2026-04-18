-- Migration: Create RLS policies for notifications table
-- Requirements: 9.5 (security)

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can insert notifications (for backend services)
CREATE POLICY "Service role can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- Policy: Admins can manage all notifications
CREATE POLICY "Admins can manage all notifications"
ON notifications FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Add comment
COMMENT ON POLICY "Users can view own notifications" ON notifications IS 'Users can only view their own notifications';
COMMENT ON POLICY "Users can update own notifications" ON notifications IS 'Users can mark their own notifications as read';
COMMENT ON POLICY "Service role can insert notifications" ON notifications IS 'Backend services can create notifications';
COMMENT ON POLICY "Admins can manage all notifications" ON notifications IS 'Admins have full access to all notifications';
