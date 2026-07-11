"use client"

export type ErrorType = 
  | "network"
  | "validation"
  | "insufficient_balance"
  | "market_closed"
  | "contract_limit"
  | "rate_limit"
  | "authentication"
  | "timeout"
  | "unknown"

export interface ErrorDetail {
  type: ErrorType
  message: string
  recoverable: boolean
  action?: "retry" | "manual_intervention" | "abort" | "reauth"
  retryAfter?: number // milliseconds
  details?: any
}

export class TradeErrorHandler {
  private static readonly ERROR_PATTERNS: Record<string, { type: ErrorType; action: string }> = {
    "insufficient balance": { type: "insufficient_balance", action: "manual_intervention" },
    "Contract limit": { type: "contract_limit", action: "manual_intervention" },
    "Market is closed": { type: "market_closed", action: "abort" },
    "Timeout": { type: "timeout", action: "retry" },
    "429": { type: "rate_limit", action: "retry" },
    "401": { type: "authentication", action: "reauth" },
    "403": { type: "authentication", action: "reauth" },
    "Connection": { type: "network", action: "retry" },
    "WebSocket": { type: "network", action: "retry" },
  }

  /**
   * Classify and handle an error
   */
  static handle(error: any): ErrorDetail {
    console.error("[v0] Handling error:", error)

    const errorString = error?.message || JSON.stringify(error)
    const errorCode = error?.code || error?.statusCode || 0

    // Match against known patterns
    for (const [pattern, { type, action }] of Object.entries(this.ERROR_PATTERNS)) {
      if (errorString.includes(pattern) || errorCode.toString().includes(pattern)) {
        return this.createErrorDetail(
          type,
          errorString,
          action !== "abort",
          action as any,
        )
      }
    }

    // Default: unknown, not recoverable
    return this.createErrorDetail("unknown", errorString, false, "manual_intervention")
  }

  /**
   * Create detailed error object
   */
  private static createErrorDetail(
    type: ErrorType,
    message: string,
    recoverable: boolean,
    action: "retry" | "manual_intervention" | "abort" | "reauth",
  ): ErrorDetail {
    const detail: ErrorDetail = {
      type,
      message: this.getUserFriendlyMessage(type, message),
      recoverable,
      action,
    }

    // Add retry-after for rate limits
    if (type === "rate_limit") {
      detail.retryAfter = 5000 // 5 seconds default
    }

    // Add retry-after for timeouts
    if (type === "timeout") {
      detail.retryAfter = 2000 // 2 seconds
    }

    return detail
  }

  /**
   * Convert error to user-friendly message
   */
  private static getUserFriendlyMessage(type: ErrorType, originalMessage: string): string {
    const messages: Record<ErrorType, string> = {
      network: "Network connection failed. Please check your internet connection.",
      validation: "Invalid trade parameters. Please check your inputs.",
      insufficient_balance: "Insufficient balance. Please deposit more funds.",
      market_closed: "Market is currently closed. Trading will resume when market opens.",
      contract_limit: "You've reached the maximum number of contracts. Close some positions first.",
      rate_limit: "Too many requests. Please wait before trying again.",
      authentication: "Authentication failed. Please log in again.",
      timeout: "Request timed out. Please try again.",
      unknown: `An error occurred: ${originalMessage}`,
    }

    return messages[type]
  }

  /**
   * Determine if error is retryable
   */
  static isRetryable(error: any): boolean {
    const detail = this.handle(error)
    return detail.recoverable && detail.action === "retry"
  }

  /**
   * Get retry delay in milliseconds
   */
  static getRetryDelay(error: any, attemptNumber = 1): number {
    const detail = this.handle(error)

    if (detail.retryAfter) {
      return detail.retryAfter
    }

    // Exponential backoff: 1s, 2s, 4s, 8s max
    const delays = [1000, 2000, 4000, 8000]
    return delays[Math.min(attemptNumber - 1, delays.length - 1)]
  }

  /**
   * Retry a function with exponential backoff
   */
  static async retry<T>(
    fn: () => Promise<T>,
    maxAttempts = 3,
    onRetry?: (attemptNumber: number, error: any) => void,
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        const isLastAttempt = attempt === maxAttempts
        const isRetryable = this.isRetryable(error)

        if (isLastAttempt || !isRetryable) {
          throw error
        }

        const delayMs = this.getRetryDelay(error, attempt)

        console.log(
          `[v0] Retrying (attempt ${attempt}/${maxAttempts}) after ${delayMs}ms...`,
        )

        if (onRetry) {
          onRetry(attempt, error)
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    throw new Error("Max retries exceeded")
  }

  /**
   * Log error with context
   */
  static logError(
    error: any,
    context: string,
    metadata?: Record<string, any>,
  ): void {
    const detail = this.handle(error)

    const logData = {
      timestamp: new Date().toISOString(),
      context,
      errorType: detail.type,
      message: detail.message,
      recoverable: detail.recoverable,
      action: detail.action,
      metadata,
    }

    console.error("[v0] ERROR LOG:", logData)

    // Could send to error tracking service here
    // sendToErrorTracking(logData)
  }

  /**
   * Classify multiple errors for batch operations
   */
  static classifyErrors(errors: any[]): Map<ErrorType, any[]> {
    const classified = new Map<ErrorType, any[]>()

    errors.forEach((error) => {
      const detail = this.handle(error)
      if (!classified.has(detail.type)) {
        classified.set(detail.type, [])
      }
      classified.get(detail.type)!.push(error)
    })

    return classified
  }
}

/**
 * Circuit breaker for automated trading
 */
export class CircuitBreaker {
  private failureCount = 0
  private successCount = 0
  private consecutiveLosses = 0
  private state: "closed" | "open" | "half-open" = "closed"
  private lastStateChange = Date.now()

  private readonly failureThreshold = 5
  private readonly successThreshold = 2
  private readonly timeout = 60000 // 1 minute
  private readonly maxConsecutiveLosses = 5
  private readonly maxDrawdownPercent = 20

  /**
   * Record a failed trade
   */
  recordFailure(): void {
    this.failureCount++
    this.successCount = 0

    if (this.failureCount >= this.failureThreshold) {
      this.state = "open"
      this.lastStateChange = Date.now()
      console.warn("[v0] Circuit breaker OPENED: too many failures")
    }
  }

  /**
   * Record a successful trade
   */
  recordSuccess(isWin: boolean): void {
    if (isWin) {
      this.successCount++
      this.failureCount = 0
      this.consecutiveLosses = 0

      if (this.state === "half-open" && this.successCount >= this.successThreshold) {
        this.state = "closed"
        console.log("[v0] Circuit breaker CLOSED: recovered")
      }
    } else {
      this.consecutiveLosses++
      this.failureCount++

      if (this.consecutiveLosses >= this.maxConsecutiveLosses) {
        this.state = "open"
        this.lastStateChange = Date.now()
        console.warn(
          `[v0] Circuit breaker OPENED: ${this.consecutiveLosses} consecutive losses`,
        )
      }
    }
  }

  /**
   * Check if trading is allowed
   */
  isOpen(): boolean {
    if (this.state === "open") {
      const timeSinceOpen = Date.now() - this.lastStateChange

      if (timeSinceOpen > this.timeout) {
        this.state = "half-open"
        this.failureCount = 0
        this.successCount = 0
        console.log("[v0] Circuit breaker HALF-OPEN: attempting recovery")
        return false
      }

      return true
    }

    return false
  }

  /**
   * Check portfolio health
   */
  checkPortfolioHealth(
    totalProfit: number,
    totalCapital: number,
    winRate: number,
  ): { healthy: boolean; reason?: string } {
    // Check maximum drawdown
    const drawdownPercent = (Math.abs(Math.min(0, totalProfit)) / totalCapital) * 100

    if (drawdownPercent > this.maxDrawdownPercent) {
      return {
        healthy: false,
        reason: `Maximum drawdown exceeded: ${drawdownPercent.toFixed(2)}%`,
      }
    }

    // Check win rate (should be > 40% for profitability)
    if (winRate < 40 && totalCapital > 0) {
      return {
        healthy: false,
        reason: `Win rate too low: ${winRate.toFixed(2)}%`,
      }
    }

    return { healthy: true }
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.failureCount = 0
    this.successCount = 0
    this.consecutiveLosses = 0
    this.state = "closed"
    console.log("[v0] Circuit breaker RESET")
  }

  /**
   * Get current state
   */
  getState(): string {
    return this.state
  }

  /**
   * Get statistics
   */
  getStats(): {
    state: string
    failures: number
    successes: number
    consecutiveLosses: number
  } {
    return {
      state: this.state,
      failures: this.failureCount,
      successes: this.successCount,
      consecutiveLosses: this.consecutiveLosses,
    }
  }
}
