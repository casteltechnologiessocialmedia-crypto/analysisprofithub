import { supabaseAdmin } from './supabase'

// In-memory cache for rate limits (key -> { count, resetTime })
const rateLimitCache = new Map<string, { count: number; resetTime: number }>()

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitCache.entries()) {
    if (value.resetTime < now) {
      rateLimitCache.delete(key)
    }
  }
}, CLEANUP_INTERVAL)

/**
 * Check if API key has exceeded rate limit
 * Returns { allowed: boolean, remaining: number, resetAt: number }
 */
export async function checkRateLimit(
  keyId: string,
  limitPerMinute: number = 100
): Promise<{
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfter?: number
}> {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute window

  // Check in-memory cache first
  let limiter = rateLimitCache.get(keyId)

  if (!limiter || limiter.resetTime < now) {
    // Start new window
    limiter = {
      count: 1,
      resetTime: now + windowMs
    }
  } else {
    // Within existing window
    limiter.count++
  }

  rateLimitCache.set(keyId, limiter)

  const allowed = limiter.count <= limitPerMinute
  const remaining = Math.max(0, limitPerMinute - limiter.count)
  const retryAfter = allowed ? undefined : Math.ceil((limiter.resetTime - now) / 1000)

  return {
    allowed,
    remaining,
    resetAt: limiter.resetTime,
    retryAfter
  }
}

/**
 * Reset rate limit for a key (admin only)
 */
export function resetRateLimit(keyId: string): void {
  rateLimitCache.delete(keyId)
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(keyId: string): {
  count: number
  remaining: number
  resetAt: number
} | null {
  const limiter = rateLimitCache.get(keyId)
  if (!limiter) return null

  const now = Date.now()
  if (limiter.resetTime < now) return null

  return {
    count: limiter.count,
    remaining: Math.max(0, 100 - limiter.count), // Default limit of 100
    resetAt: limiter.resetTime
  }
}
