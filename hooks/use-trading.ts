"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useDerivAPI } from "@/lib/deriv-api-context"
import { TradeExecutionService, type TradeRequest, type TradeResult, type OpenTrade } from "@/lib/trade-execution-service"
import { PortfolioManager, type PortfolioStats } from "@/lib/portfolio-manager"
import { MarketDataManager, type TickUpdate, type MarketPrice } from "@/lib/market-data-manager"
import type { PortfolioContract } from "@/lib/deriv-api"

export interface UseTradingReturn {
  // Trade execution
  executeTrade: (request: TradeRequest) => Promise<TradeResult>
  closePosition: (contractId: number, price: number) => Promise<any>
  getProposal: (request: TradeRequest) => Promise<any>

  // Portfolio
  openPositions: OpenTrade[]
  portfolioStats: PortfolioStats
  getPosition: (contractId: number) => OpenTrade | undefined

  // Market data
  currentPrice: (symbol: string) => MarketPrice | null
  tickHistory: (symbol: string, limit?: number) => TickUpdate[]
  subscribeTick: (symbol: string, callback: (tick: TickUpdate) => void) => Promise<string>

  // Account
  balance: number
  currency: string
  accountType: "Demo" | "Real" | null
  isLoggedIn: boolean

  // State
  isLoading: boolean
  error: string | null
  isInitialized: boolean

  // Cleanup
  cleanup: () => Promise<void>
}

export function useTrading(): UseTradingReturn {
  const { apiClient, balance, currency, accountType, isLoggedIn, isAuthorized } = useDerivAPI()

  const executionServiceRef = useRef<TradeExecutionService | null>(null)
  const portfolioManagerRef = useRef<PortfolioManager | null>(null)
  const marketDataManagerRef = useRef<MarketDataManager | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [openPositions, setOpenPositions] = useState<OpenTrade[]>([])
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats>({
    totalProfit: 0,
    totalWins: 0,
    totalLosses: 0,
    winRate: 0,
    openContracts: 0,
    closedContracts: 0,
    totalBalance: 0,
    todayProfit: 0,
    totalDrawdown: 0,
  })

  // Initialize services once when API client is ready
  useEffect(() => {
    if (!apiClient || !isAuthorized) {
      console.log("[v0] Waiting for API client and authorization...")
      return
    }

    const initializeServices = async () => {
      try {
        setIsLoading(true)
        setError(null)

        console.log("[v0] Initializing trading services...")

        // Create services
        const executionService = new TradeExecutionService(apiClient)
        const portfolioManager = new PortfolioManager(apiClient)
        const marketDataManager = new MarketDataManager(apiClient)

        // Initialize portfolio manager
        await portfolioManager.initialize()

        // Store references
        executionServiceRef.current = executionService
        portfolioManagerRef.current = portfolioManager
        marketDataManagerRef.current = marketDataManager

        // Subscribe to portfolio updates
        portfolioManager.onStatsChange((stats) => {
          setPortfolioStats(stats)
        })

        portfolioManager.onContractsChange((contracts) => {
          // Update open positions from portfolio
          const positions = contracts.map((c) => ({
            contractId: c.contract_id,
            symbol: c.symbol || "",
            contractType: c.contract_type,
            buyPrice: c.buy_price,
            payout: c.payout,
            entrySpot: 0,
            currentSpot: 0,
            profitLoss: (c.payout || 0) - (c.buy_price || 0),
            purchaseTime: c.purchase_time || 0,
            isSold: false,
          }))
          setOpenPositions(positions)
        })

        setIsInitialized(true)
        console.log("[v0] ✅ Trading services initialized")
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to initialize trading services"
        console.error("[v0] ❌ Service initialization error:", errorMessage)
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    initializeServices()

    // Cleanup on unmount
    return () => {
      // Don't cleanup here as services might be needed
    }
  }, [apiClient, isAuthorized])

  // Execute trade
  const executeTrade = useCallback(
    async (request: TradeRequest): Promise<TradeResult> => {
      try {
        if (!executionServiceRef.current) {
          throw new Error("Trading service not initialized")
        }

        setIsLoading(true)
        setError(null)

        const result = await executionServiceRef.current.executeTrade(request)
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Trade execution failed"
        setError(errorMessage)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  // Close position
  const closePosition = useCallback(
    async (contractId: number, price: number) => {
      try {
        if (!executionServiceRef.current) {
          throw new Error("Trading service not initialized")
        }

        setIsLoading(true)
        setError(null)

        const result = await executionServiceRef.current.closePosition(contractId, price)
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to close position"
        setError(errorMessage)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  // Get proposal
  const getProposal = useCallback(
    async (request: TradeRequest) => {
      try {
        if (!executionServiceRef.current) {
          throw new Error("Trading service not initialized")
        }

        setError(null)
        const proposal = await executionServiceRef.current.getProposal(request)
        return proposal
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to get proposal"
        setError(errorMessage)
        throw err
      }
    },
    [],
  )

  // Get position
  const getPosition = useCallback((contractId: number) => {
    if (!executionServiceRef.current) return undefined
    return executionServiceRef.current.getPosition(contractId)
  }, [])

  // Get current price
  const currentPrice = useCallback((symbol: string) => {
    if (!marketDataManagerRef.current) return null
    return marketDataManagerRef.current.getCurrentPrice(symbol)
  }, [])

  // Get tick history
  const tickHistory = useCallback((symbol: string, limit?: number) => {
    if (!marketDataManagerRef.current) return []
    return marketDataManagerRef.current.getTickHistory(symbol, limit)
  }, [])

  // Subscribe to ticks
  const subscribeTick = useCallback(async (symbol: string, callback: (tick: TickUpdate) => void) => {
    if (!marketDataManagerRef.current) {
      throw new Error("Market data service not initialized")
    }
    return marketDataManagerRef.current.subscribeTick(symbol, callback)
  }, [])

  // Cleanup
  const cleanup = useCallback(async () => {
    try {
      if (executionServiceRef.current) {
        await executionServiceRef.current.cleanup()
      }
      if (portfolioManagerRef.current) {
        await portfolioManagerRef.current.cleanup()
      }
      if (marketDataManagerRef.current) {
        await marketDataManagerRef.current.cleanup()
      }

      executionServiceRef.current = null
      portfolioManagerRef.current = null
      marketDataManagerRef.current = null

      setIsInitialized(false)
      console.log("[v0] Trading hook cleaned up")
    } catch (err) {
      console.error("[v0] Error cleaning up trading hook:", err)
    }
  }, [])

  return {
    executeTrade,
    closePosition,
    getProposal,
    openPositions,
    portfolioStats,
    getPosition,
    currentPrice,
    tickHistory,
    subscribeTick,
    balance: balance?.amount || 0,
    currency: currency || "USD",
    accountType,
    isLoggedIn,
    isLoading,
    error,
    isInitialized,
    cleanup,
  }
}
