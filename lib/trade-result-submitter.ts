/**
 * Trade Result Submitter
 * Handles posting trade results to the API for persistence and tracking
 */

export interface TradeResult {
  loginId: string
  strategy: string
  market: string
  profit: number
  stake: number
}

export interface SubmitTradeResultOptions {
  onSuccess?: (response: any) => void
  onError?: (error: Error) => void
  retries?: number
}

const DEFAULT_RETRIES = 3
const RETRY_DELAY = 1000 // ms

/**
 * Submit a single trade result to the API
 */
export async function submitTradeResult(
  tradeResult: TradeResult,
  options: SubmitTradeResultOptions = {}
): Promise<boolean> {
  const { onSuccess, onError, retries = DEFAULT_RETRIES } = options

  try {
    const response = await fetch('/api/trade/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tradeResult),
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()
    console.log('[v0] Trade result submitted successfully:', data)
    onSuccess?.(data)
    return true
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error'
    console.error('[v0] Failed to submit trade result:', errorMessage)

    if (retries > 0) {
      console.log(`[v0] Retrying trade submission (${retries} retries left)...`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return submitTradeResult(tradeResult, { ...options, retries: retries - 1 })
    }

    onError?.(error)
    return false
  }
}

/**
 * Submit multiple trade results (batch)
 */
export async function submitTradeResults(
  tradeResults: TradeResult[],
  options: SubmitTradeResultOptions = {}
): Promise<number> {
  let successCount = 0

  for (const tradeResult of tradeResults) {
    const success = await submitTradeResult(tradeResult, options)
    if (success) successCount++
  }

  console.log(`[v0] Batch submission complete: ${successCount}/${tradeResults.length} successful`)
  return successCount
}

/**
 * Helper to format trade data before submission
 */
export function formatTradeForSubmission(
  loginId: string,
  strategy: string,
  market: string,
  profit: number,
  stake: number
): TradeResult {
  return {
    loginId,
    strategy,
    market,
    profit: Number(profit),
    stake: Number(stake),
  }
}
