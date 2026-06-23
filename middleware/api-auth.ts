import { type NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { extractApiKey, verifyApiKey } from '@/lib/api-keys'
import { checkRateLimit } from '@/lib/rate-limiter'

export interface ApiContext {
  keyId: string
  keyName: string
  scope: string[]
  rateLimit: number
}

export interface AuthResult {
  success: boolean
  context?: ApiContext
  error?: string
  status?: number
}

/**
 * Authenticate API request using API key
 */
export async function authenticateApiRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // Extract API key from Authorization header
    const authHeader = request.headers.get('Authorization')
    const apiKey = extractApiKey(authHeader)

    if (!apiKey) {
      return {
        success: false,
        error: 'Missing API key. Use Authorization: Bearer sk_xxx header',
        status: 401
      }
    }

    // Fetch API key from database
    const { data: keyRecord, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('id, key_hash, app_name, scope, rate_limit, expires_at, is_active')
      .eq('key_hash', hashForComparison(apiKey))
      .single()

    if (keyError || !keyRecord) {
      return {
        success: false,
        error: 'Invalid API key',
        status: 401
      }
    }

    // Check if key is active
    if (!keyRecord.is_active) {
      return {
        success: false,
        error: 'API key is inactive',
        status: 403
      }
    }

    // Check if key has expired
    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      return {
        success: false,
        error: 'API key has expired',
        status: 401
      }
    }

    // Check rate limit
    const rateLimitStatus = await checkRateLimit(
      keyRecord.id,
      keyRecord.rate_limit || 100
    )

    if (!rateLimitStatus.allowed) {
      return {
        success: false,
        error: `Rate limit exceeded. Retry after ${rateLimitStatus.retryAfter} seconds`,
        status: 429
      }
    }

    // Log API key usage
    await supabaseAdmin
      .from('api_key_logs')
      .insert({
        key_id: keyRecord.id,
        endpoint: request.nextUrl.pathname,
        method: request.method,
        timestamp: new Date().toISOString(),
        status: 200
      })
      .then(() => {
        // Silently log, don't break if logging fails
      })
      .catch(() => {
        // Ignore logging errors
      })

    return {
      success: true,
      context: {
        keyId: keyRecord.id,
        keyName: keyRecord.app_name,
        scope: keyRecord.scope || [],
        rateLimit: keyRecord.rate_limit || 100
      }
    }
  } catch (error) {
    console.error('[API Auth] Authentication error:', error)
    return {
      success: false,
      error: 'Authentication failed',
      status: 500
    }
  }
}

/**
 * Simple hash for key comparison (using SHA-256 in actual implementation)
 */
function hashForComparison(key: string): string {
  // In production, use crypto.createHash('sha256').update(key).digest('hex')
  // For now, using a simple implementation
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(key).digest('hex')
}

/**
 * Check if user has scope permission
 */
export function hasScopePermission(context: ApiContext, requiredScope: string): boolean {
  return context.scope.includes('*') || context.scope.includes(requiredScope)
}

/**
 * Error response format for API
 */
export function apiErrorResponse(
  message: string,
  code: string,
  status: number = 400
): NextResponse {
  return NextResponse.json(
    {
      error: {
        message,
        code,
        timestamp: new Date().toISOString()
      }
    },
    { status }
  )
}

/**
 * Success response with rate limit headers
 */
export function apiSuccessResponse(
  data: any,
  context?: ApiContext,
  status: number = 200
): NextResponse {
  const response = NextResponse.json(data, { status })

  if (context) {
    response.headers.set('X-RateLimit-Limit', context.rateLimit.toString())
    response.headers.set('X-RateLimit-Remaining', (context.rateLimit - 1).toString())
  }

  return response
}
