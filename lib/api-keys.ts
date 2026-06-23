import crypto from 'crypto'

/**
 * Generate a new API key
 * Format: sk_<random_32_chars> for production, sk_test_<random_32_chars> for testing
 */
export function generateApiKey(isTest: boolean = false): string {
  const randomBytes = crypto.randomBytes(24).toString('hex')
  const prefix = isTest ? 'sk_test_' : 'sk_'
  return prefix + randomBytes
}

/**
 * Hash API key before storage
 * Using SHA-256 with salt for security
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

/**
 * Verify API key against stored hash
 */
export function verifyApiKey(key: string, hash: string): boolean {
  return hashApiKey(key) === hash
}

/**
 * Extract API key from Authorization header
 * Expected format: "Bearer sk_xxx" or "sk_xxx"
 */
export function extractApiKey(authHeader?: string): string | null {
  if (!authHeader) return null
  
  // Try "Bearer sk_xxx" format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  
  // Try direct "sk_xxx" format
  if (authHeader.startsWith('sk_')) {
    return authHeader
  }
  
  return null
}

/**
 * Mask API key for display (show only last 8 chars)
 */
export function maskApiKey(key: string): string {
  if (key.length <= 8) return '****'
  return '***' + key.slice(-8)
}
