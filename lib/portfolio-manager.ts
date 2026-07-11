"use client"

import { DerivAPIClient } from "./deriv-api"
import type { PortfolioContract, StatementTransaction, ProfitTableTransaction } from "./deriv-api"

export interface PortfolioStats {
  totalProfit: number
  totalWins: number
  totalLosses: number
  winRate: number
  openContracts: number
  closedContracts: number
  totalBalance: number
  todayProfit: number
  totalDrawdown: number
}

export interface PortfolioSnapshot {
  timestamp: number
  contracts: PortfolioContract[]
  stats: PortfolioStats
}

export class PortfolioManager {
  private apiClient: DerivAPIClient
  private portfolioSubscriptionId: string | null = null
  private currentContracts: Map<number, PortfolioContract> = new Map()
  private portfolioHistory: PortfolioSnapshot[] = []
  private statsListeners: Set<(stats: PortfolioStats) => void> = new Set()
  private contractListeners: Set<(contracts: PortfolioContract[]) => void> = new Set()
  private lastUpdate = 0
  private isInitialized = false

  constructor(apiClient: DerivAPIClient) {
    this.apiClient = apiClient
  }

  /**
   * Initialize portfolio subscription
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.log("[v0] Portfolio manager already initialized")
        return
      }

      console.log("[v0] Initializing portfolio manager...")

      // Subscribe to portfolio updates
      this.portfolioSubscriptionId = await this.apiClient.subscribePortfolio((portfolio) => {
        this.handlePortfolioUpdate(portfolio)
      })

      this.isInitialized = true
      console.log("[v0] ✅ Portfolio manager initialized")
    } catch (error) {
      console.error("[v0] ❌ Failed to initialize portfolio manager:", error)
      throw error
    }
  }

  /**
   * Handle incoming portfolio updates
   */
  private handlePortfolioUpdate(portfolio: any): void {
    try {
      if (!portfolio.contracts) return

      // Update contracts map
      this.currentContracts.clear()
      portfolio.contracts.forEach((contract: PortfolioContract) => {
        this.currentContracts.set(contract.contract_id, contract)
      })

      // Calculate stats
      const stats = this.calculateStats()

      // Store snapshot
      this.portfolioHistory.push({
        timestamp: Date.now(),
        contracts: Array.from(this.currentContracts.values()),
        stats,
      })

      // Keep only last 1000 snapshots
      if (this.portfolioHistory.length > 1000) {
        this.portfolioHistory.shift()
      }

      this.lastUpdate = Date.now()

      // Notify listeners
      this.notifyStatsListeners(stats)
      this.notifyContractListeners(Array.from(this.currentContracts.values()))

      console.log(`[v0] 📊 Portfolio updated: ${this.currentContracts.size} contracts`)
    } catch (error) {
      console.error("[v0] Error handling portfolio update:", error)
    }
  }

  /**
   * Calculate portfolio statistics
   */
  private calculateStats(): PortfolioStats {
    const contracts = Array.from(this.currentContracts.values())
    const openContracts = contracts.length
    const closedContracts = 0 // This would come from statement

    let totalProfit = 0
    let totalWins = 0
    let totalLosses = 0
    let highestBalance = 0
    let lowestBalance = Infinity

    contracts.forEach((contract) => {
      const profit = (contract.payout || 0) - (contract.buy_price || 0)
      totalProfit += profit

      if (profit > 0) {
        totalWins++
      } else if (profit < 0) {
        totalLosses++
      }
    })

    const winRate =
      openContracts + closedContracts > 0
        ? ((totalWins / (openContracts + closedContracts)) * 100)
        : 0

    return {
      totalProfit,
      totalWins,
      totalLosses,
      winRate,
      openContracts,
      closedContracts,
      totalBalance: 0, // Would get from account subscription
      todayProfit: totalProfit, // Simplified
      totalDrawdown: lowestBalance !== Infinity ? highestBalance - lowestBalance : 0,
    }
  }

  /**
   * Get current open contracts
   */
  getOpenContracts(): PortfolioContract[] {
    return Array.from(this.currentContracts.values())
  }

  /**
   * Get specific contract
   */
  getContract(contractId: number): PortfolioContract | undefined {
    return this.currentContracts.get(contractId)
  }

  /**
   * Get current portfolio statistics
   */
  getStats(): PortfolioStats {
    return this.calculateStats()
  }

  /**
   * Get P&L for specific contract
   */
  getContractPnL(contractId: number): { profit: number; profitPercent: number; status: string } | null {
    const contract = this.currentContracts.get(contractId)
    if (!contract) return null

    const profit = (contract.payout || 0) - (contract.buy_price || 0)
    const profitPercent = contract.buy_price ? (profit / contract.buy_price) * 100 : 0
    const status = profit > 0 ? "Win" : profit < 0 ? "Loss" : "Break Even"

    return {
      profit,
      profitPercent,
      status,
    }
  }

  /**
   * Subscribe to portfolio statistics changes
   */
  onStatsChange(callback: (stats: PortfolioStats) => void): () => void {
    this.statsListeners.add(callback)

    // Return unsubscribe function
    return () => {
      this.statsListeners.delete(callback)
    }
  }

  /**
   * Subscribe to contract changes
   */
  onContractsChange(callback: (contracts: PortfolioContract[]) => void): () => void {
    this.contractListeners.add(callback)

    // Return unsubscribe function
    return () => {
      this.contractListeners.delete(callback)
    }
  }

  /**
   * Notify stats listeners
   */
  private notifyStatsListeners(stats: PortfolioStats): void {
    this.statsListeners.forEach((callback) => {
      try {
        callback(stats)
      } catch (error) {
        console.error("[v0] Error in stats listener:", error)
      }
    })
  }

  /**
   * Notify contract listeners
   */
  private notifyContractListeners(contracts: PortfolioContract[]): void {
    this.contractListeners.forEach((callback) => {
      try {
        callback(contracts)
      } catch (error) {
        console.error("[v0] Error in contract listener:", error)
      }
    })
  }

  /**
   * Get portfolio history
   */
  getHistory(limit = 100): PortfolioSnapshot[] {
    return this.portfolioHistory.slice(-limit)
  }

  /**
   * Get daily P&L trend
   */
  getDailyPnL(): { timestamp: number; profit: number }[] {
    const dailyMap = new Map<number, number>()

    this.portfolioHistory.forEach((snapshot) => {
      const dayStart = new Date(snapshot.timestamp)
      dayStart.setHours(0, 0, 0, 0)
      const dayKey = dayStart.getTime()

      const currentProfit = dailyMap.get(dayKey) || 0
      dailyMap.set(dayKey, currentProfit + snapshot.stats.totalProfit)
    })

    return Array.from(dailyMap.entries()).map(([timestamp, profit]) => ({
      timestamp,
      profit,
    }))
  }

  /**
   * Check if portfolio is healthy (not over-leveraged)
   */
  isPortfolioHealthy(maxDrawdownPercent = 10): boolean {
    const stats = this.getStats()
    if (stats.totalBalance === 0) return true

    const drawdownPercent = (stats.totalDrawdown / stats.totalBalance) * 100
    return drawdownPercent <= maxDrawdownPercent
  }

  /**
   * Get risk metrics
   */
  getRiskMetrics(): {
    riskRewardRatio: number
    profitFactor: number
    maxConsecutiveLosses: number
  } {
    const contracts = Array.from(this.currentContracts.values())
    if (contracts.length === 0) {
      return {
        riskRewardRatio: 0,
        profitFactor: 1,
        maxConsecutiveLosses: 0,
      }
    }

    const profits = contracts
      .map((c) => (c.payout || 0) - (c.buy_price || 0))
      .filter((p) => p > 0)
      .reduce((a, b) => a + b, 0)

    const losses = contracts
      .map((c) => (c.payout || 0) - (c.buy_price || 0))
      .filter((p) => p < 0)
      .reduce((a, b) => a + Math.abs(b), 0)

    const riskRewardRatio = losses > 0 ? profits / losses : profits > 0 ? Infinity : 0
    const profitFactor = losses > 0 ? profits / losses : profits > 0 ? Infinity : 1

    // Calculate max consecutive losses (simplified)
    let maxConsecutiveLosses = 0
    let currentConsecutiveLosses = 0

    contracts.forEach((c) => {
      const profit = (c.payout || 0) - (c.buy_price || 0)
      if (profit < 0) {
        currentConsecutiveLosses++
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentConsecutiveLosses)
      } else {
        currentConsecutiveLosses = 0
      }
    })

    return {
      riskRewardRatio,
      profitFactor,
      maxConsecutiveLosses,
    }
  }

  /**
   * Cleanup and unsubscribe
   */
  async cleanup(): Promise<void> {
    if (this.portfolioSubscriptionId) {
      try {
        await this.apiClient.forget(this.portfolioSubscriptionId)
      } catch (error) {
        console.error("[v0] Error unsubscribing from portfolio:", error)
      }
    }

    this.statsListeners.clear()
    this.contractListeners.clear()
    this.currentContracts.clear()
    this.isInitialized = false

    console.log("[v0] Portfolio manager cleaned up")
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized
  }

  /**
   * Get last update time
   */
  getLastUpdateTime(): number {
    return this.lastUpdate
  }
}
