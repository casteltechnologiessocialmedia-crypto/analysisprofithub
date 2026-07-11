// Smart Trade Loop Engine - Multi-Trade Management with Market Switching

import { ScanResult } from './trading-scanner-engine'
import { ProfitPlusTradingLogic, TradeResult } from './profit-plus-trading-logic'

export interface TradeExecution {
  tradeNumber: number // 1-7
  strategy: string
  prediction: string
  market: string
  stake: number
  martingaleLevel: number
  targetProfit: number
  stopLoss: number
  ticks: number
  status: 'pending' | 'executing' | 'won' | 'lost' | 'closed'
  result?: TradeResult
  timestamp: number
}

export interface LoopState {
  isRunning: boolean
  currentTradeNumber: number // 1-7
  totalTradesPlanned: number
  cumulativeProfit: number
  targetProfitGlobal: number
  stopLossGlobal: number
  currentMarket: string
  trades: TradeExecution[]
  shouldPause: boolean
  shouldSwitch: boolean
}

export class SmartTradeLoop {
  /**
   * Initialize trade loop for 5-7 consecutive trades
   */
  static initializeLoop(
    selectedStrategy: ScanResult,
    baseStake: number,
    targetProfit: number,
    stopLoss: number,
    martingaleMultiplier: number,
    ticks: number,
    market: string,
    numTrades: number = 5 // 5-7 trades
  ): LoopState {
    return {
      isRunning: false,
      currentTradeNumber: 0,
      totalTradesPlanned: numTrades,
      cumulativeProfit: 0,
      targetProfitGlobal: targetProfit,
      stopLossGlobal: stopLoss,
      currentMarket: market,
      trades: [],
      shouldPause: false,
      shouldSwitch: false,
    }
  }

  /**
   * Generate next trade execution details
   */
  static generateNextTrade(
    loopState: LoopState,
    selectedStrategy: ScanResult,
    baseStake: number,
    martingaleMultiplier: number,
    ticks: number
  ): TradeExecution | null {
    // Check if we've completed all planned trades
    if (loopState.currentTradeNumber >= loopState.totalTradesPlanned) {
      return null
    }

    const tradeNumber = loopState.currentTradeNumber + 1
    
    // Calculate martingale stake based on previous losses
    const lossCount = loopState.trades.filter(t => t.status === 'lost').length
    const martingaleLevel = lossCount + 1
    const stake = baseStake * Math.pow(martingaleMultiplier, lossCount)

    return {
      tradeNumber,
      strategy: selectedStrategy.strategy,
      prediction: selectedStrategy.prediction,
      market: loopState.currentMarket,
      stake,
      martingaleLevel,
      targetProfit: loopState.targetProfitGlobal,
      stopLoss: loopState.stopLossGlobal,
      ticks,
      status: 'pending',
      timestamp: Date.now(),
    }
  }

  /**
   * Update loop state after trade result
   */
  static updateLoopAfterTrade(
    loopState: LoopState,
    trade: TradeExecution,
    result: TradeResult
  ): LoopState {
    const updatedTrade = { ...trade, status: result.win ? 'won' : 'lost', result }
    
    // Add to trades history
    const updatedTrades = [...loopState.trades, updatedTrade]
    
    // Update cumulative profit
    const updatedCumulativeProfit = loopState.cumulativeProfit + (result.profit || 0)

    // Check if global TP/SL hit
    const tpHit = updatedCumulativeProfit >= loopState.targetProfitGlobal
    const slHit = updatedCumulativeProfit <= -loopState.stopLossGlobal

    return {
      ...loopState,
      trades: updatedTrades,
      currentTradeNumber: loopState.currentTradeNumber + 1,
      cumulativeProfit: updatedCumulativeProfit,
      isRunning: !tpHit && !slHit && (loopState.currentTradeNumber + 1) < loopState.totalTradesPlanned,
      shouldPause: (loopState.currentTradeNumber + 1) % 3 === 0, // Pause every 3 trades to recheck
    }
  }

  /**
   * Determine if should switch market
   */
  static shouldSwitchMarket(loopState: LoopState): boolean {
    if (loopState.trades.length < 2) return false

    // Switch if last 2 trades lost
    const lastTwoTrades = loopState.trades.slice(-2)
    const bothLost = lastTwoTrades.every(t => t.status === 'lost')

    return bothLost && loopState.currentTradeNumber < loopState.totalTradesPlanned
  }

  /**
   * Get next best market to switch to
   */
  static getNextMarket(currentMarket: string): string {
    const markets = ['1s', '5s', '10s', '30s', '1m', '5m']
    const currentIndex = markets.indexOf(currentMarket)
    
    // Rotate to next market
    return markets[(currentIndex + 1) % markets.length]
  }

  /**
   * Get loop status summary
   */
  static getLoopStatus(loopState: LoopState): {
    tradesCompleted: number
    tradesRemaining: number
    currentProfit: number
    winCount: number
    lossCount: number
    tpHit: boolean
    slHit: boolean
    nextAction: string
  } {
    const winCount = loopState.trades.filter(t => t.status === 'won').length
    const lossCount = loopState.trades.filter(t => t.status === 'lost').length
    const tpHit = loopState.cumulativeProfit >= loopState.targetProfitGlobal
    const slHit = loopState.cumulativeProfit <= -loopState.stopLossGlobal

    let nextAction = 'Continue Trading'
    if (tpHit) nextAction = 'Target Profit Hit - Loop Complete'
    else if (slHit) nextAction = 'Stop Loss Hit - Loop Ended'
    else if (loopState.shouldPause) nextAction = 'Paused - Recheck Market'
    else if (SmartTradeLoop.shouldSwitchMarket(loopState)) nextAction = 'Switching Market'

    return {
      tradesCompleted: loopState.currentTradeNumber,
      tradesRemaining: loopState.totalTradesPlanned - loopState.currentTradeNumber,
      currentProfit: loopState.cumulativeProfit,
      winCount,
      lossCount,
      tpHit,
      slHit,
      nextAction,
    }
  }

  /**
   * Resume loop after pause
   */
  static resumeLoop(loopState: LoopState): LoopState {
    return {
      ...loopState,
      shouldPause: false,
      isRunning: true,
    }
  }

  /**
   * Get recommended trade parameters
   */
  static getRecommendedParams(
    baseStake: number
  ): {
    stake: number
    recommendedTrades: number
    maxMartingale: number
  } {
    return {
      stake: baseStake,
      recommendedTrades: 5, // Default 5 trades, can go up to 7
      maxMartingale: 4, // Max martingale multiplier to prevent over-betting
    }
  }
}
