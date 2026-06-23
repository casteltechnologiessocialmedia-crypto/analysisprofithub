import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateApiRequest, hasScopePermission, apiErrorResponse, apiSuccessResponse } from '@/middleware/api-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/users/[loginId]
 * Get specific user profile
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { loginId: string } }
) {
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

    const { loginId } = params

    // Fetch user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('loginId', loginId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return apiErrorResponse('User not found', 'NOT_FOUND', 404)
      }
      throw error
    }

    return apiSuccessResponse({ user }, auth.context)
  } catch (error) {
    console.error(`[API v1/users/${params.loginId}] Error:`, error)
    return apiErrorResponse('Internal server error', 'INTERNAL_ERROR', 500)
  }
}
