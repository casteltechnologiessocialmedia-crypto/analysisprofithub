import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateApiRequest, hasScopePermission, apiErrorResponse, apiSuccessResponse } from '@/middleware/api-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/trades/[tradeId]
 * Get specific trade details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tradeId: string } }
) {
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

    const { tradeId } = params

    // Fetch trade
    const { data: trade, error } = await supabaseAdmin
      .from('trades')
      .select('*')
      .eq('id', tradeId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return apiErrorResponse('Trade not found', 'NOT_FOUND', 404)
      }
      throw error
    }

    return apiSuccessResponse({ trade }, auth.context)
  } catch (error) {
    console.error(`[API v1/trades/${params.tradeId}] Error:`, error)
    return apiErrorResponse('Internal server error', 'INTERNAL_ERROR', 500)
  }
}
