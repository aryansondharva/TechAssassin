import { createHash, randomBytes } from 'crypto';

/**
 * Hash a password using SHA-256 with salt
 */
export async function hash_password(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(password + salt).digest('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 */
export async function verify_password(password: string, hash: string): Promise<boolean> {
  try {
    const [salt, originalHash] = hash.split(':');
    const hashToCompare = createHash('sha256').update(password + salt).digest('hex');
    return hashToCompare === originalHash;
  } catch (error) {
    return false;
  }
}

/**
 * Generate a random session token
 */
export function generate_session_token(): string {
  return randomBytes(32).toString('hex');
}
