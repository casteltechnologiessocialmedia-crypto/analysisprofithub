/**
 * Supported market timeframes for Deriv API
 * Unsupported removed: 1s, 31s, 151s, 901s
 */

export const SUPPORTED_TIMEFRAMES = ['5s', '10s', '30s', '1m', '5m', '15m', '30m', '1h']

export const UNSUPPORTED_TIMEFRAMES = ['1s', '31s', '151s', '901s']

/**
 * Filter out unsupported timeframes from a list
 */
export function filterSupportedTimeframes(timeframes: string[]): string[] {
  return timeframes.filter(tf => !UNSUPPORTED_TIMEFRAMES.includes(tf))
}

/**
 * Check if a timeframe is supported
 */
export function isTimeframeSupported(timeframe: string): boolean {
  return SUPPORTED_TIMEFRAMES.includes(timeframe)
}

/**
 * Get default supported timeframe
 */
export function getDefaultTimeframe(): string {
  return '5s'
}
