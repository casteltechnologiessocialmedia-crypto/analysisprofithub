import { NextRequest } from 'next/server'
import { authenticateApiRequest, hasScopePermission, apiErrorResponse, apiSuccessResponse } from '@/middleware/api-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/market/symbols
 * List available trading symbols
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const auth = await authenticateApiRequest(request)
    if (!auth.success) {
      return apiErrorResponse(auth.error || 'Unauthorized', 'UNAUTHORIZED', auth.status || 401)
    }

    // Check permission
    if (!hasScopePermission(auth.context!, 'market:read')) {
      return apiErrorResponse('Insufficient permissions', 'FORBIDDEN', 403)
    }

    // Common Deriv trading symbols
    const symbols = [
      { symbol: 'R_50', name: 'Volatility 50 Index', category: 'Indices', active: true },
      { symbol: 'R_100', name: 'Volatility 100 Index', category: 'Indices', active: true },
      { symbol: 'EURUSD', name: 'EUR/USD', category: 'Forex', active: true },
      { symbol: 'GBPUSD', name: 'GBP/USD', category: 'Forex', active: true },
      { symbol: 'USDJPY', name: 'USD/JPY', category: 'Forex', active: true },
      { symbol: 'AUDUSD', name: 'AUD/USD', category: 'Forex', active: true },
      { symbol: 'USDCHF', name: 'USD/CHF', category: 'Forex', active: true },
      { symbol: 'BTCUSD', name: 'Bitcoin', category: 'Crypto', active: true },
      { symbol: 'ETHUSD', name: 'Ethereum', category: 'Crypto', active: true },
      { symbol: 'XAUUSD', name: 'Gold', category: 'Commodities', active: true },
      { symbol: 'XAGUSD', name: 'Silver', category: 'Commodities', active: true },
      { symbol: 'OIL', name: 'Crude Oil', category: 'Commodities', active: true }
    ]

    return apiSuccessResponse(
      {
        symbols,
        total: symbols.length,
        timestamp: new Date().toISOString()
      },
      auth.context
    )
  } catch (error) {
    console.error('[API v1/market/symbols] Error:', error)
    return apiErrorResponse('Internal server error', 'INTERNAL_ERROR', 500)
  }
}
