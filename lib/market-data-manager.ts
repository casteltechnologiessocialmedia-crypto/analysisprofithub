"use client"

import { DerivAPIClient } from "./deriv-api"
import type { TickData } from "./deriv-api"

export interface TickUpdate {
  symbol: string
  quote: number
  lastDigit: number
  epoch: number
  bid?: number
  ask?: number
  change?: number
  changePercent?: number
}

export interface MarketPrice {
  symbol: string
  bid: number
  ask: number
  last: number
  change: number
  changePercent: number
  volume?: number
  timestamp: number
}

export class MarketDataManager {
  private apiClient: DerivAPIClient
  private activeSubscriptions: Map<string, string> = new Map() // symbol -> subscriptionId
  private tickHistory: Map<string, TickUpdate[]> = new Map()
  private currentPrices: Map<string, MarketPrice> = new Map()
  private tickCallbacks: Map<string, Set<(tick: TickUpdate) => void>> = new Map()
  private priceCallbacks: Map<string, Set<(price: MarketPrice) => void>> = new Map()
  private readonly MAX_HISTORY = 100

  constructor(apiClient: DerivAPIClient) {
    this.apiClient = apiClient
  }

  /**
   * Subscribe to live ticks for a symbol
   */
  async subscribeTick(symbol: string, callback?: (tick: TickUpdate) => void): Promise<string> {
    try {
      // Check if already subscribed
      const existingSubId = this.activeSubscriptions.get(symbol)
      if (existingSubId) {
        console.log(`[v0] Already subscribed to ${symbol}, reusing subscription`)
        if (callback) {
          const callbacks = this.tickCallbacks.get(symbol) || new Set()
          callbacks.add(callback)
          this.tickCallbacks.set(symbol, callbacks)
        }
        return existingSubId
      }

      console.log(`[v0] Subscribing to ticks for ${symbol}`)

      // Subscribe via API client
      const subscriptionId = await this.apiClient.subscribeTicks(symbol, (tick: TickData) => {
        const tickUpdate: TickUpdate = {
          symbol,
          quote: tick.quote,
          lastDigit: tick.lastDigit,
          epoch: tick.epoch,
        }

        // Update history
        this.updateTickHistory(symbol, tickUpdate)

        // Update current price
        this.updateCurrentPrice(symbol, tickUpdate)

        // Notify tick callbacks
        this.notifyTickCallbacks(symbol, tickUpdate)
      })

      this.activeSubscriptions.set(symbol, subscriptionId)

      // Register initial callback
      if (callback) {
        const callbacks = this.tickCallbacks.get(symbol) || new Set()
        callbacks.add(callback)
        this.tickCallbacks.set(symbol, callbacks)
      }

      console.log(`[v0] ✅ Subscribed to ${symbol}`)
      return subscriptionId
    } catch (error) {
      console.error(`[v0] ❌ Failed to subscribe to ${symbol}:`, error)
      throw error
    }
  }

  /**
   * Unsubscribe from ticks
   */
  async unsubscribeTick(symbol: string): Promise<void> {
    try {
      const subscriptionId = this.activeSubscriptions.get(symbol)
      if (subscriptionId) {
        await this.apiClient.forget(subscriptionId)
        this.activeSubscriptions.delete(symbol)
        this.tickCallbacks.delete(symbol)
        this.priceCallbacks.delete(symbol)
        console.log(`[v0] Unsubscribed from ${symbol}`)
      }
    } catch (error) {
      console.error(`[v0] Error unsubscribing from ${symbol}:`, error)
    }
  }

  /**
   * Get current price for a symbol
   */
  getCurrentPrice(symbol: string): MarketPrice | null {
    return this.currentPrices.get(symbol) || null
  }

  /**
   * Get tick history for a symbol
   */
  getTickHistory(symbol: string, limit = 50): TickUpdate[] {
    const history = this.tickHistory.get(symbol) || []
    return history.slice(-limit)
  }

  /**
   * Update tick history
   */
  private updateTickHistory(symbol: string, tick: TickUpdate): void {
    const history = this.tickHistory.get(symbol) || []
    history.push(tick)

    // Keep only last MAX_HISTORY ticks
    if (history.length > this.MAX_HISTORY) {
      history.shift()
    }

    this.tickHistory.set(symbol, history)
  }

  /**
   * Update current price from tick
   */
  private updateCurrentPrice(symbol: string, tick: TickUpdate): void {
    const existing = this.currentPrices.get(symbol)

    const prevPrice = existing?.last || tick.quote
    const change = tick.quote - prevPrice
    const changePercent = prevPrice ? (change / prevPrice) * 100 : 0

    const marketPrice: MarketPrice = {
      symbol,
      bid: tick.quote - 0.0001, // Simplified bid/ask calculation
      ask: tick.quote + 0.0001,
      last: tick.quote,
      change,
      changePercent,
      timestamp: tick.epoch * 1000,
    }

    this.currentPrices.set(symbol, marketPrice)
  }

  /**
   * Register callback for tick updates
   */
  onTickUpdate(symbol: string, callback: (tick: TickUpdate) => void): () => void {
    const callbacks = this.tickCallbacks.get(symbol) || new Set()
    callbacks.add(callback)
    this.tickCallbacks.set(symbol, callbacks)

    // Return unsubscribe function
    return () => {
      callbacks.delete(callback)
    }
  }

  /**
   * Register callback for price updates
   */
  onPriceUpdate(symbol: string, callback: (price: MarketPrice) => void): () => void {
    const callbacks = this.priceCallbacks.get(symbol) || new Set()
    callbacks.add(callback)
    this.priceCallbacks.set(symbol, callbacks)

    // Return unsubscribe function
    return () => {
      callbacks.delete(callback)
    }
  }

  /**
   * Notify tick callbacks
   */
  private notifyTickCallbacks(symbol: string, tick: TickUpdate): void {
    const callbacks = this.tickCallbacks.get(symbol)
    if (!callbacks) return

    callbacks.forEach((callback) => {
      try {
        callback(tick)
      } catch (error) {
        console.error("[v0] Error in tick callback:", error)
      }
    })
  }

  /**
   * Notify price callbacks
   */
  private notifyPriceCallbacks(symbol: string, price: MarketPrice): void {
    const callbacks = this.priceCallbacks.get(symbol)
    if (!callbacks) return

    callbacks.forEach((callback) => {
      try {
        callback(price)
      } catch (error) {
        console.error("[v0] Error in price callback:", error)
      }
    })
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.activeSubscriptions.keys())
  }

  /**
   * Get price change for a symbol
   */
  getPriceChange(symbol: string): { change: number; changePercent: number } | null {
    const price = this.currentPrices.get(symbol)
    if (!price) return null

    return {
      change: price.change,
      changePercent: price.changePercent,
    }
  }

  /**
   * Get volatility (standard deviation of recent ticks)
   */
  getVolatility(symbol: string): number {
    const history = this.tickHistory.get(symbol) || []
    if (history.length < 2) return 0

    const quotes = history.map((t) => t.quote)
    const mean = quotes.reduce((a, b) => a + b, 0) / quotes.length
    const variance = quotes.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / quotes.length
    const stdDev = Math.sqrt(variance)

    return stdDev
  }

  /**
   * Get price range (high-low) for recent ticks
   */
  getPriceRange(symbol: string, limit = 50): { high: number; low: number } | null {
    const history = this.getTickHistory(symbol, limit)
    if (history.length === 0) return null

    const quotes = history.map((t) => t.quote)
    const high = Math.max(...quotes)
    const low = Math.min(...quotes)

    return { high, low }
  }

  /**
   * Check if market is moving up or down
   */
  getTrendDirection(symbol: string, windowSize = 10): "up" | "down" | "neutral" {
    const history = this.getTickHistory(symbol, windowSize)
    if (history.length < 2) return "neutral"

    const firstPrice = history[0].quote
    const lastPrice = history[history.length - 1].quote

    if (lastPrice > firstPrice * 1.001) return "up" // 0.1% threshold
    if (lastPrice < firstPrice * 0.999) return "down"
    return "neutral"
  }

  /**
   * Cleanup all subscriptions
   */
  async cleanup(): Promise<void> {
    const symbols = Array.from(this.activeSubscriptions.keys())

    for (const symbol of symbols) {
      try {
        await this.unsubscribeTick(symbol)
      } catch (error) {
        console.error(`[v0] Error cleaning up subscription for ${symbol}:`, error)
      }
    }

    this.tickHistory.clear()
    this.currentPrices.clear()
    this.tickCallbacks.clear()
    this.priceCallbacks.clear()

    console.log("[v0] Market data manager cleaned up")
  }

  /**
   * Get summary of all active symbols and their prices
   */
  getSummary(): Map<
    string,
    {
      price: number
      change: number
      changePercent: number
      subscribed: boolean
    }
  > {
    const summary = new Map()

    this.currentPrices.forEach((price, symbol) => {
      summary.set(symbol, {
        price: price.last,
        change: price.change,
        changePercent: price.changePercent,
        subscribed: this.activeSubscriptions.has(symbol),
      })
    })

    return summary
  }
}
