import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateApiRequest, hasScopePermission, apiErrorResponse, apiSuccessResponse } from '@/middleware/api-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/users
 * List all users with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const auth = await authenticateApiRequest(request)
    if (!auth.success) {
      return apiErrorResponse(auth.error || 'Unauthorized', 'UNAUTHORIZED', auth.status || 401)
    }

    // Check permission
    if (!hasScopePermission(auth.context!, 'users:read')) {
      return apiErrorResponse('Insufficient permissions', 'FORBIDDEN', 403)
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')
    const typeFilter = searchParams.get('type') // 'Real' or 'Demo'
    const statusFilter = searchParams.get('status') // 'online' or 'offline'

    // Build query
    let query = supabaseAdmin
      .from('users')
      .select('loginId, name, balance, type, status, lastSeen', { count: 'exact' })

    // Apply filters
    if (typeFilter && ['Real', 'Demo'].includes(typeFilter)) {
      query = query.eq('type', typeFilter)
    }
    if (statusFilter && ['online', 'offline'].includes(statusFilter)) {
      query = query.eq('status', statusFilter)
    }

    // Apply pagination and sorting
    const { data: users, error, count } = await query
      .order('lastSeen', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return apiSuccessResponse(
      {
        users: users || [],
        pagination: {
          limit,
          offset,
          total: count || 0,
          hasMore: (offset + limit) < (count || 0)
        }
      },
      auth.context
    )
  } catch (error) {
    console.error('[API v1/users] Error:', error)
    return apiErrorResponse('Internal server error', 'INTERNAL_ERROR', 500)
  }
}
