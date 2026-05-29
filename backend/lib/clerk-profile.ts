const USERNAME_MAX_LENGTH = 30
const GENERATED_USERNAME_PATTERN = /^user_[a-z0-9_]{4,}$/i

const getField = (source: any, ...keys: string[]) => {
  for (const key of keys) {
    const value = source?.[key]
    if (value !== undefined && value !== null && value !== '') {
      return value
    }
  }
  return null
}

export const isGeneratedUsername = (username?: string | null) => {
  return GENERATED_USERNAME_PATTERN.test(username || '')
}

export const getClerkPrimaryEmail = (userData: any): string | null => {
  const emailAddresses = userData?.email_addresses || userData?.emailAddresses || []
  const primaryEmailId = userData?.primary_email_address_id || userData?.primaryEmailAddressId
  const primaryEmail = emailAddresses.find((email: any) => email.id === primaryEmailId)
  return primaryEmail?.email_address || primaryEmail?.emailAddress || emailAddresses[0]?.email_address || emailAddresses[0]?.emailAddress || null
}

const normalizeUsername = (value?: string | null) => {
  const normalized = (value || '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, USERNAME_MAX_LENGTH)

  return normalized.length >= 3 ? normalized : ''
}

export const getClerkUsernameBase = (userData: any) => {
  const email = getClerkPrimaryEmail(userData)
  const emailHandle = email?.split('@')[0]
  const fullName = [
    getField(userData, 'first_name', 'firstName'),
    getField(userData, 'last_name', 'lastName'),
  ].filter(Boolean).join(' ')
  const clerkId = String(getField(userData, 'id') || '')

  return (
    normalizeUsername(getField(userData, 'username')) ||
    normalizeUsername(emailHandle) ||
    normalizeUsername(fullName) ||
    normalizeUsername(`user_${clerkId.slice(-8)}`) ||
    'builder'
  )
}

export async function getAvailableClerkUsername(client: any, userData: any, userId: string) {
  const baseUsername = getClerkUsernameBase(userData)

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const suffix = attempt === 0 ? '' : `_${attempt + 1}`
    const username = `${baseUsername.slice(0, USERNAME_MAX_LENGTH - suffix.length)}${suffix}`
    const { rows } = await client.query(
      'SELECT id FROM public.profiles WHERE LOWER(username) = LOWER($1) AND id != $2 LIMIT 1',
      [username, userId]
    )

    if (rows.length === 0) {
      return username
    }
  }

  return `user_${String(userId).slice(-8).replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()}`
}
