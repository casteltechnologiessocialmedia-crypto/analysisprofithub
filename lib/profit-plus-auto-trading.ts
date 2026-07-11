import type { TradingSignal } from "./profit-plus-engine"

export interface AutoTradingConfig {
  isEnabled: boolean
  targetProfit: number // TPS - Target Profit Stop
  maxStakePercentage: number // Max 20% of balance
  refreshRate: number // milliseconds (60000 = 60 seconds)
  skipTickPatterns: number[][] // Patterns to skip
  martingaleEnabled: boolean
  consecutiveLossThreshold: number
}

export interface TradeExecution {
  id: string
  signal: TradingSignal
  stake: number
  tradeType: string
  executedAt: number
  status: "PENDING" | "WIN" | "LOSS"
  profit: number
  multiplier: number
}

export interface AccountBalance {
  balance: number
  totalStake: number
  totalProfit: number
  winRate: number
  consecutiveLosses: number
}

export class ProfitPlusAutoTrading {
  private config: AutoTradingConfig
  private executionHistory: TradeExecution[] = []
  private lastRefreshTime: number = 0
  private consecutiveLosses: number = 0
  private skipTickCounter: number = 0

  constructor(config: Partial<AutoTradingConfig> = {}) {
    this.config = {
      isEnabled: config.isEnabled || false,
      targetProfit: config.targetProfit || 50,
      maxStakePercentage: Math.min(config.maxStakePercentage || 20, 20),
      refreshRate: config.refreshRate || 60000,
      skipTickPatterns: config.skipTickPatterns || [],
      martingaleEnabled: config.martingaleEnabled || true,
      consecutiveLossThreshold: config.consecutiveLossThreshold || 3,
    }
  }

  /**
   * Calculate stake based on account balance (max 20%)
   */
  calculateStake(balance: number, multiplier: number = 1): number {
    const maxStake = (balance * this.config.maxStakePercentage) / 100
    const adjustedStake = maxStake * multiplier

    // Ensure stake doesn't exceed max
    return Math.min(adjustedStake, maxStake)
  }

  /**
   * Check if should skip this tick based on pattern matching
   */
  shouldSkipTick(recentDigits: number[]): boolean {
    if (this.config.skipTickPatterns.length === 0) return false

    // Check if recent pattern matches any skip pattern
    for (const pattern of this.config.skipTickPatterns) {
      if (this.matchesPattern(recentDigits, pattern)) {
        return true
      }
    }

    return false
  }

  /**
   * Match recent digits against a pattern
   */
  private matchesPattern(recentDigits: number[], pattern: number[]): boolean {
    if (pattern.length > recentDigits.length) return false

    const recent = recentDigits.slice(-pattern.length)
    return recent.every((digit, index) => {
      return pattern[index] === -1 || digit === pattern[index]
    })
  }

  /**
   * Check if enough time has passed for refresh
   */
  shouldRefresh(): boolean {
    const now = Date.now()
    if (now - this.lastRefreshTime >= this.config.refreshRate) {
      this.lastRefreshTime = now
      return true
    }
    return false
  }

  /**
   * Check if auto-trading should pause (target profit reached or max losses)
   */
  shouldPause(currentProfit: number): boolean {
    if (currentProfit >= this.config.targetProfit) {
      return true // Target profit reached
    }

    if (this.consecutiveLosses >= this.config.consecutiveLossThreshold) {
      return true // Max consecutive losses reached
    }

    return false
  }

  /**
   * Execute trade based on signal
   */
  executeAutoTrade(signal: TradingSignal, balance: number, multiplier: number = 1): TradeExecution {
    const stake = this.calculateStake(balance, multiplier)

    const execution: TradeExecution = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      signal,
      stake,
      tradeType: signal.type,
      executedAt: Date.now(),
      status: "PENDING",
      profit: 0,
      multiplier,
    }

    this.executionHistory.push(execution)
    return execution
  }

  /**
   * Record trade result
   */
  recordTradeResult(tradeId: string, isWin: boolean, profit: number): void {
    const trade = this.executionHistory.find((t) => t.id === tradeId)
    if (!trade) return

    trade.status = isWin ? "WIN" : "LOSS"
    trade.profit = profit

    if (isWin) {
      this.consecutiveLosses = 0
    } else {
      this.consecutiveLosses++
    }
  }

  /**
   * Get current account state
   */
  getAccountState(balance: number, initialBalance: number): AccountBalance {
    const totalStake = this.executionHistory.reduce((sum, t) => sum + t.stake, 0)
    const totalProfit = this.executionHistory.reduce(
      (sum, t) => sum + (t.status === "WIN" ? t.profit : -t.stake),
      0
    )
    const wins = this.executionHistory.filter((t) => t.status === "WIN").length
    const winRate = this.executionHistory.length > 0 ? (wins / this.executionHistory.length) * 100 : 0

    return {
      balance,
      totalStake,
      totalProfit,
      winRate,
      consecutiveLosses: this.consecutiveLosses,
    }
  }

  /**
   * Get trade history
   */
  getTradeHistory(): TradeExecution[] {
    return [...this.executionHistory]
  }

  /**
   * Clear trade history
   */
  clearHistory(): void {
    this.executionHistory = []
    this.consecutiveLosses = 0
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<AutoTradingConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      maxStakePercentage: Math.min(config.maxStakePercentage || this.config.maxStakePercentage, 20),
    }
  }

  /**
   * Get current config
   */
  getConfig(): AutoTradingConfig {
    return { ...this.config }
  }

  /**
   * Toggle auto trading
   */
  toggleAutoTrading(enabled: boolean): void {
    this.config.isEnabled = enabled
  }

  /**
   * Pause auto trading (for manual intervention)
   */
  pauseAutoTrading(): void {
    this.config.isEnabled = false
  }

  /**
   * Resume auto trading
   */
  resumeAutoTrading(): void {
    this.config.isEnabled = true
  }
}
