/**
 * Enhanced Trade Error Handler with Circuit Breaker Pattern
 * Manages trade execution errors, implements circuit breaker for API failures,
 * and tracks error patterns for intelligent recovery
 */

export enum CircuitBreakerState {
  CLOSED = "CLOSED", // Normal operation
  OPEN = "OPEN", // Stop making requests
  HALF_OPEN = "HALF_OPEN", // Test if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number // Number of failures before opening circuit
  successThreshold: number // Number of successes in HALF_OPEN to close circuit
  timeout: number // Time in ms to wait before transitioning from OPEN to HALF_OPEN
  monitoringWindow: number // Time window to track failures
}

export interface TradeErrorEvent {
  timestamp: number
  error: Error | string
  context: {
    strategy?: string
    market?: string
    contractType?: string
    stake?: number
    tradeId?: string
  }
  severity: "low" | "medium" | "high" | "critical"
  isRecoverable: boolean
}

export interface ErrorRecoveryAction {
  action: string
  delayMs: number
  retryCount: number
  maxRetries: number
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED
  private failureCount: number = 0
  private successCount: number = 0
  private lastFailureTime: number = 0
  private lastStateChangeTime: number = 0
  private config: CircuitBreakerConfig

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      successThreshold: config.successThreshold ?? 2,
      timeout: config.timeout ?? 60000, // 60s
      monitoringWindow: config.monitoringWindow ?? 300000, // 5 min
    }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastStateChangeTime > this.config.timeout) {
        console.log("[v0] CircuitBreaker transitioning from OPEN to HALF_OPEN")
        this.state = CircuitBreakerState.HALF_OPEN
        this.successCount = 0
      } else {
        throw new Error("Circuit breaker is OPEN - service temporarily unavailable")
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failureCount = 0

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++
      if (this.successCount >= this.config.successThreshold) {
        console.log("[v0] CircuitBreaker transitioning from HALF_OPEN to CLOSED")
        this.state = CircuitBreakerState.CLOSED
        this.successCount = 0
      }
    }
  }

  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      console.log("[v0] CircuitBreaker re-opening after failure in HALF_OPEN state")
      this.state = CircuitBreakerState.OPEN
      this.lastStateChangeTime = Date.now()
    } else if (this.failureCount >= this.config.failureThreshold) {
      console.log(`[v0] CircuitBreaker opening after ${this.failureCount} failures`)
      this.state = CircuitBreakerState.OPEN
      this.lastStateChangeTime = Date.now()
    }
  }

  getState(): CircuitBreakerState {
    return this.state
  }

  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    }
  }

  reset(): void {
    this.state = CircuitBreakerState.CLOSED
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = 0
  }
}

export class EnhancedTradeErrorHandler {
  private circuitBreaker: CircuitBreaker
  private errorHistory: TradeErrorEvent[] = []
  private maxHistorySize = 1000
  private errorPatterns: Map<string, number> = new Map()
  private consecutiveErrors = 0
  private maxConsecutiveErrors = 10
  private isEmergencyStopped = false

  constructor(circuitBreakerConfig?: Partial<CircuitBreakerConfig>) {
    this.circuitBreaker = new CircuitBreaker(circuitBreakerConfig)
  }

  /**
   * Handle trade execution with circuit breaker protection
   */
  async executeWithProtection<T>(
    tradeExecutor: () => Promise<T>,
    context: TradeErrorEvent["context"]
  ): Promise<T> {
    if (this.isEmergencyStopped) {
      throw new Error("Trading is in emergency stop mode")
    }

    try {
      const result = await this.circuitBreaker.execute(tradeExecutor)
      this.consecutiveErrors = 0
      return result
    } catch (error) {
      this.handleError(error, context)
      throw error
    }
  }

  /**
   * Categorize and log trade errors
   */
  private handleError(error: any, context: TradeErrorEvent["context"]): void {
    const errorStr = error?.message || String(error)
    const severity = this.determineSeverity(errorStr)
    const isRecoverable = this.isRecoverableError(errorStr)

    const event: TradeErrorEvent = {
      timestamp: Date.now(),
      error: errorStr,
      context,
      severity,
      isRecoverable,
    }

    this.errorHistory.push(event)
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift()
    }

    // Track error patterns
    const patternKey = `${severity}:${errorStr.substring(0, 50)}`
    this.errorPatterns.set(patternKey, (this.errorPatterns.get(patternKey) || 0) + 1)

    this.consecutiveErrors++
    console.error(`[v0] Trade error (${severity}): ${errorStr}`, {
      context,
      isRecoverable,
      consecutiveErrors: this.consecutiveErrors,
    })

    // Trigger emergency stop if critical threshold reached
    if (this.consecutiveErrors >= this.maxConsecutiveErrors && severity === "critical") {
      this.triggerEmergencyStop("Too many critical errors")
    }
  }

  /**
   * Determine error severity
   */
  private determineSeverity(errorMsg: string): TradeErrorEvent["severity"] {
    const lowerMsg = errorMsg.toLowerCase()

    // Critical errors
    if (
      lowerMsg.includes("unauthorized") ||
      lowerMsg.includes("forbidden") ||
      lowerMsg.includes("authentication")
    ) {
      return "critical"
    }

    // High severity
    if (
      lowerMsg.includes("insufficient") ||
      lowerMsg.includes("balance") ||
      lowerMsg.includes("margin")
    ) {
      return "high"
    }

    // Medium severity
    if (
      lowerMsg.includes("timeout") ||
      lowerMsg.includes("connection") ||
      lowerMsg.includes("network")
    ) {
      return "medium"
    }

    // Low severity (default)
    return "low"
  }

  /**
   * Determine if error is potentially recoverable
   */
  private isRecoverableError(errorMsg: string): boolean {
    const lowerMsg = errorMsg.toLowerCase()

    // Non-recoverable errors
    if (
      lowerMsg.includes("unauthorized") ||
      lowerMsg.includes("forbidden") ||
      lowerMsg.includes("not found")
    ) {
      return false
    }

    // Recoverable errors
    return (
      lowerMsg.includes("timeout") ||
      lowerMsg.includes("connection") ||
      lowerMsg.includes("temporarily") ||
      lowerMsg.includes("unavailable")
    )
  }

  /**
   * Get recovery action for an error
   */
  getRecoveryAction(error: any): ErrorRecoveryAction {
    const errorMsg = error?.message || String(error)
    const isRecoverable = this.isRecoverableError(errorMsg)
    const circuitState = this.circuitBreaker.getState()

    // If circuit is open, suggest waiting
    if (circuitState === CircuitBreakerState.OPEN) {
      return {
        action: "WAIT",
        delayMs: 5000,
        retryCount: 0,
        maxRetries: 0,
      }
    }

    // If not recoverable, suggest stopping
    if (!isRecoverable) {
      return {
        action: "STOP",
        delayMs: 0,
        retryCount: 0,
        maxRetries: 0,
      }
    }

    // Calculate exponential backoff
    const delayMs = Math.min(1000 * Math.pow(2, this.consecutiveErrors), 30000)

    return {
      action: "RETRY",
      delayMs,
      retryCount: this.consecutiveErrors,
      maxRetries: 3,
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const recentErrors = this.errorHistory.filter(
      (e) => Date.now() - e.timestamp < 300000 // Last 5 minutes
    )

    const bySeverity = {
      low: recentErrors.filter((e) => e.severity === "low").length,
      medium: recentErrors.filter((e) => e.severity === "medium").length,
      high: recentErrors.filter((e) => e.severity === "high").length,
      critical: recentErrors.filter((e) => e.severity === "critical").length,
    }

    const topPatterns = Array.from(this.errorPatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern, count]) => ({ pattern, count }))

    return {
      totalErrors: this.errorHistory.length,
      recentErrors: recentErrors.length,
      consecutiveErrors: this.consecutiveErrors,
      bySeverity,
      topPatterns,
      circuitBreakerState: this.circuitBreaker.getState(),
      isEmergencyStopped: this.isEmergencyStopped,
    }
  }

  /**
   * Trigger emergency stop
   */
  triggerEmergencyStop(reason: string): void {
    this.isEmergencyStopped = true
    console.error(`[v0] EMERGENCY STOP TRIGGERED: ${reason}`)
  }

  /**
   * Reset emergency stop
   */
  resetEmergencyStop(): void {
    this.isEmergencyStopped = false
    this.consecutiveErrors = 0
    this.circuitBreaker.reset()
    console.log("[v0] Emergency stop cleared and circuit breaker reset")
  }

  /**
   * Get error history
   */
  getErrorHistory(limit: number = 50): TradeErrorEvent[] {
    return this.errorHistory.slice(-limit).reverse()
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = []
    this.errorPatterns.clear()
    this.consecutiveErrors = 0
  }
}

// Export singleton instance
export const globalErrorHandler = new EnhancedTradeErrorHandler({
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,
})
