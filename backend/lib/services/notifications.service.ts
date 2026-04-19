import { createServiceRoleClient } from '@/lib/supabase/server'

// Notification types based on the schema
type NotificationType = 
  | 'EVENT_REMINDER'
  | 'EVENT_CHAT'
  | 'XP_EARNED'
  | 'MENTOR_MATCH'
  | 'MATCH_ACCEPTED'
  | 'MATCH_DECLINED'
  | 'MISSION_COMPLETED'
  | 'SYSTEM'
  | 'EVENT_INVITE';

interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  body?: string
  payload?: Record<string, unknown>
}

export async function createNotification(input: CreateNotificationInput) {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      content: input.body ?? null, // using 'content' instead of 'body' to match our schema
      metadata: input.payload ?? {}, // using 'metadata' to match our schema
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
  return data
}

export async function markAllRead(userId: string) {
  const supabase = createServiceRoleClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true }) // using 'is_read' instead of 'read' to match our schema
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error("Failed to mark notifications read:", error);
    throw error;
  }
}
