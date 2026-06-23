import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateApiRequest, hasScopePermission, apiErrorResponse, apiSuccessResponse } from '@/middleware/api-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/trades
 * List trades with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const auth = await authenticateApiRequest(request)
    if (!auth.success) {
      return apiErrorResponse(auth.error || 'Unauthorized', 'UNAUTHORIZED', auth.status || 401)
    }

    // Check permission
    if (!hasScopePermission(auth.context!, 'trades:read')) {
      return apiErrorResponse('Insufficient permissions', 'FORBIDDEN', 403)
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')
    const statusFilter = searchParams.get('status') // 'open', 'closed', 'won', 'lost'
    const loginIdFilter = searchParams.get('loginId')

    // Build query
    let query = supabaseAdmin
      .from('trades')
      .select(
        'id, loginId, stake, profitLoss, status, createdAt, market, entryPrice, exitPrice, volume, leverage',
        { count: 'exact' }
      )

    // Apply filters
    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }
    if (loginIdFilter) {
      query = query.eq('loginId', loginIdFilter)
    }

    // Apply pagination and sorting
    const { data: trades, error, count } = await query
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return apiSuccessResponse(
      {
        trades: trades || [],
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
    console.error('[API v1/trades] Error:', error)
    return apiErrorResponse('Internal server error', 'INTERNAL_ERROR', 500)
  }
}
