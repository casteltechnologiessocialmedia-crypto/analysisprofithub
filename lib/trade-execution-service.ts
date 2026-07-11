"use client"

import { DerivAPIClient } from "./deriv-api"
import type { ProposalRequest, BuyResponse, ContractUpdate } from "./deriv-api"

export interface TradeRequest {
  symbol: string
  contractType: string
  amount: number
  duration: number
  durationUnit: "t" | "m" | "h" | "d" // tick, minute, hour, day
  barrier?: string
  basis: "stake" | "payout"
  currency?: string
}

export interface TradeResult {
  contractId: number
  buyPrice: number
  payout: number
  entrySpot?: number
  status: "pending" | "active" | "completed"
  timestamp: number
  longcode: string
  transactionId: number
}

export interface OpenTrade {
  contractId: number
  symbol: string
  contractType: string
  buyPrice: number
  payout: number
  entrySpot?: number
  currentSpot?: number
  profitLoss?: number
  isWin?: boolean
  isSold: boolean
  purchaseTime: number
}

export interface ProposalQuote {
  id: string
  askPrice: number
  payout: number
  spot: number
  spotTime: number
  longcode: string
}

export class TradeExecutionService {
  private apiClient: DerivAPIClient
  private activeProposals: Map<string, ProposalQuote> = new Map()
  private activeTrades: Map<number, OpenTrade> = new Map()
  private contractSubscriptions: Map<number, string> = new Map()
  private lastError: Error | null = null

  constructor(apiClient: DerivAPIClient) {
    this.apiClient = apiClient
  }

  /**
   * Get a proposal (price quote) for a potential trade
   */
  async getProposal(request: TradeRequest): Promise<ProposalQuote> {
    try {
      const proposalRequest: ProposalRequest = {
        symbol: request.symbol,
        contract_type: request.contractType,
        amount: request.amount,
        basis: request.basis,
        duration: request.duration,
        duration_unit: request.durationUnit,
        currency: request.currency || "USD",
        ...(request.barrier ? { barrier: request.barrier } : {}),
      }

      console.log("[v0] 📊 Getting proposal:", proposalRequest)
      const response = await this.apiClient.getProposal(proposalRequest)

      const quote: ProposalQuote = {
        id: response.id,
        askPrice: response.ask_price,
        payout: response.payout,
        spot: response.spot,
        spotTime: response.spot_time,
        longcode: response.longcode,
      }

      this.activeProposals.set(quote.id, quote)
      console.log("[v0] ✅ Proposal received:", quote)

      return quote
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error))
      console.error("[v0] ❌ Proposal error:", this.lastError)
      throw this.lastError
    }
  }

  /**
   * Execute a trade (buy a contract)
   */
  async executeTrade(request: TradeRequest): Promise<TradeResult> {
    try {
      // Step 1: Get proposal (quote)
      const proposal = await this.getProposal(request)

      // Step 2: Buy the contract
      console.log("[v0] 💳 Executing trade with proposal:", proposal.id)
      const buyResponse = await this.apiClient.buyContract(proposal.id, proposal.askPrice)

      if (!buyResponse || !buyResponse.contract_id) {
        throw new Error("Invalid buy response - no contract ID")
      }

      const trade: TradeResult = {
        contractId: buyResponse.contract_id,
        buyPrice: buyResponse.buy_price,
        payout: buyResponse.payout,
        entrySpot: proposal.spot,
        status: "active",
        timestamp: Date.now(),
        longcode: buyResponse.longcode,
        transactionId: buyResponse.transaction_id,
      }

      // Step 3: Subscribe to contract updates
      await this.subscribeToContractUpdates(trade.contractId)

      // Step 4: Store in active trades
      this.activeTrades.set(trade.contractId, {
        contractId: trade.contractId,
        symbol: request.symbol,
        contractType: request.contractType,
        buyPrice: trade.buyPrice,
        payout: trade.payout,
        entrySpot: trade.entrySpot,
        purchaseTime: buyResponse.start_time,
        isSold: false,
      })

      console.log("[v0] ✅ Trade executed:", trade)
      return trade
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error))
      console.error("[v0] ❌ Trade execution error:", this.lastError)
      throw this.lastError
    }
  }

  /**
   * Close/sell an open position
   */
  async closePosition(contractId: number, price: number): Promise<any> {
    try {
      console.log("[v0] 🔚 Closing contract:", contractId, "at price:", price)

      const response = await this.apiClient.sellContract(contractId, price)

      if (response.error) {
        throw new Error(response.error.message || "Failed to close position")
      }

      // Update local state
      const trade = this.activeTrades.get(contractId)
      if (trade) {
        trade.isSold = true
        trade.profitLoss = (response.sell_price || price) - trade.buyPrice
      }

      // Unsubscribe from updates
      const subId = this.contractSubscriptions.get(contractId)
      if (subId) {
        await this.apiClient.forget(subId)
        this.contractSubscriptions.delete(contractId)
      }

      console.log("[v0] ✅ Position closed:", response)
      return response
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error))
      console.error("[v0] ❌ Close position error:", this.lastError)
      throw this.lastError
    }
  }

  /**
   * Subscribe to contract updates (price changes, status updates)
   */
  async subscribeToContractUpdates(
    contractId: number,
    callback?: (contract: ContractUpdate) => void,
  ): Promise<string> {
    try {
      const subscriptionId = await this.apiClient.subscribeProposalOpenContract(
        contractId,
        (contract: ContractUpdate) => {
          // Update local cache
          const trade = this.activeTrades.get(contractId)
          if (trade) {
            trade.currentSpot = contract.current_spot
            trade.isSold = contract.is_sold
            if (contract.profit !== undefined) {
              trade.profitLoss = contract.profit
              trade.isWin = contract.profit > 0
            }
          }

          // Notify callback if provided
          if (callback) {
            callback(contract)
          }

          console.log(`[v0] 📈 Contract update (${contractId}):`, {
            currentSpot: contract.current_spot,
            profit: contract.profit,
            isSold: contract.is_sold,
          })
        },
      )

      this.contractSubscriptions.set(contractId, subscriptionId)
      console.log("[v0] ✅ Subscribed to contract updates:", subscriptionId)

      return subscriptionId
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error))
      console.error("[v0] ❌ Subscription error:", this.lastError)
      throw this.lastError
    }
  }

  /**
   * Get all open positions
   */
  getOpenPositions(): OpenTrade[] {
    return Array.from(this.activeTrades.values()).filter((t) => !t.isSold)
  }

  /**
   * Get specific position
   */
  getPosition(contractId: number): OpenTrade | undefined {
    return this.activeTrades.get(contractId)
  }

  /**
   * Get all trades (open and closed)
   */
  getAllTrades(): OpenTrade[] {
    return Array.from(this.activeTrades.values())
  }

  /**
   * Calculate profit/loss for a position
   */
  calculatePnL(contractId: number): { profit: number; profitPercent: number; isWin: boolean } | null {
    const trade = this.activeTrades.get(contractId)
    if (!trade) return null

    const profit = (trade.profitLoss || 0) - (trade.buyPrice || 0)
    const profitPercent = trade.buyPrice ? (profit / trade.buyPrice) * 100 : 0

    return {
      profit,
      profitPercent,
      isWin: profit > 0,
    }
  }

  /**
   * Get portfolio statistics
   */
  getPortfolioStats(): {
    totalTrades: number
    openTrades: number
    closedTrades: number
    totalProfit: number
    totalWins: number
    totalLosses: number
    winRate: number
  } {
    const allTrades = Array.from(this.activeTrades.values())
    const openTrades = allTrades.filter((t) => !t.isSold)
    const closedTrades = allTrades.filter((t) => t.isSold)

    const totalProfit = allTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0)
    const totalWins = closedTrades.filter((t) => (t.profitLoss || 0) > 0).length
    const totalLosses = closedTrades.filter((t) => (t.profitLoss || 0) < 0).length
    const winRate = closedTrades.length > 0 ? (totalWins / closedTrades.length) * 100 : 0

    return {
      totalTrades: allTrades.length,
      openTrades: openTrades.length,
      closedTrades: closedTrades.length,
      totalProfit,
      totalWins,
      totalLosses,
      winRate,
    }
  }

  /**
   * Unsubscribe from contract updates
   */
  async unsubscribeFromContract(contractId: number): Promise<void> {
    const subId = this.contractSubscriptions.get(contractId)
    if (subId) {
      await this.apiClient.forget(subId)
      this.contractSubscriptions.delete(contractId)
      console.log("[v0] Unsubscribed from contract:", contractId)
    }
  }

  /**
   * Clean up all subscriptions
   */
  async cleanup(): Promise<void> {
    for (const [contractId, subId] of this.contractSubscriptions.entries()) {
      try {
        await this.apiClient.forget(subId)
      } catch (error) {
        console.error(`[v0] Error cleaning up subscription for ${contractId}:`, error)
      }
    }
    this.contractSubscriptions.clear()
    console.log("[v0] Trade execution service cleaned up")
  }

  getLastError(): Error | null {
    return this.lastError
  }

  clearError(): void {
    this.lastError = null
  }
}
