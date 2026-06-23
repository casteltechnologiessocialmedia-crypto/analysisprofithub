import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateApiKey, hashApiKey, maskApiKey } from '@/lib/api-keys'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/keys
 * List all API keys (admin only)
 */
export async function GET() {
  try {
    // In production, verify admin auth here
    const { data: keys, error } = await supabaseAdmin
      .from('api_keys')
      .select('id, app_name, scope, rate_limit, created_at, expires_at, is_active, last_used_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Mask sensitive data
    const maskedKeys = (keys || []).map(key => ({
      ...key,
      key_preview: '***' // Don't expose key preview
    }))

    return NextResponse.json({ keys: maskedKeys })
  } catch (error) {
    console.error('[Admin API] Error fetching API keys:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/keys
 * Create new API key
 */
export async function POST(request: NextRequest) {
  try {
    // In production, verify admin auth here
    const body = await request.json()
    const { appName, scope = ['users:read', 'trades:read', 'market:read', 'analytics:read'], rateLimit = 100, expiresInDays = 365, isTest = false } = body

    if (!appName || appName.trim().length === 0) {
      return NextResponse.json({ error: 'appName is required' }, { status: 400 })
    }

    // Generate API key
    const apiKey = generateApiKey(isTest)
    const keyHash = hashApiKey(apiKey)

    // Calculate expiration
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (expiresInDays || 365))

    // Store in database
    const { data: newKey, error } = await supabaseAdmin
      .from('api_keys')
      .insert({
        key_hash: keyHash,
        app_name: appName.trim(),
        scope: scope,
        rate_limit: rateLimit,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
        is_test: isTest
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(
      {
        message: 'API key created successfully',
        key: apiKey, // Return the plaintext key only on creation
        keyPreview: maskApiKey(apiKey),
        keyId: newKey.id,
        appName: newKey.app_name,
        scope: newKey.scope,
        rateLimit: newKey.rate_limit,
        expiresAt: newKey.expires_at,
        isTest: newKey.is_test,
        warning: 'Save your API key now. You won\'t be able to see it again.'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Admin API] Error creating API key:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
