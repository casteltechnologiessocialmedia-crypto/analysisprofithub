import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/keys/[keyId]
 * Get specific API key details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    // In production, verify admin auth here
    const { data: key, error } = await supabaseAdmin
      .from('api_keys')
      .select('*')
      .eq('id', params.keyId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'API key not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ key })
  } catch (error) {
    console.error(`[Admin API] Error fetching API key ${params.keyId}:`, error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/keys/[keyId]
 * Update API key (toggle active, update scope, rate limit)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    // In production, verify admin auth here
    const body = await request.json()
    const { isActive, scope, rateLimit } = body

    const updates: Record<string, any> = {}

    if (typeof isActive === 'boolean') {
      updates.is_active = isActive
    }
    if (Array.isArray(scope)) {
      updates.scope = scope
    }
    if (typeof rateLimit === 'number') {
      updates.rate_limit = rateLimit
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const { data: updatedKey, error } = await supabaseAdmin
      .from('api_keys')
      .update(updates)
      .eq('id', params.keyId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'API key not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({
      message: 'API key updated successfully',
      key: updatedKey
    })
  } catch (error) {
    console.error(`[Admin API] Error updating API key ${params.keyId}:`, error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/keys/[keyId]
 * Revoke/delete API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    // In production, verify admin auth here
    const { error } = await supabaseAdmin
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', params.keyId)

    if (error) throw error

    return NextResponse.json({
      message: 'API key revoked successfully'
    })
  } catch (error) {
    console.error(`[Admin API] Error revoking API key ${params.keyId}:`, error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
