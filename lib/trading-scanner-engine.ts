// AI Trading Scanner Engine - Multi-Strategy Analysis & Ranking

import { ProfitPlusTradingLogic, TradeSignal } from './profit-plus-trading-logic'

export interface ScanResult {
  strategy: string
  signal: TradeSignal
  score: number // power * confidence
  rank: number
  prediction: string
  digitRange?: string // e.g., "Over 5-9", "Under 0-4", "Even", "Odd"
}

export interface ScannerState {
  isScanning: boolean
  progress: number // 0-100
  currentStrategy: string
  results: ScanResult[]
  topStrategies: ScanResult[] // top 5
}

export class TradingScannerEngine {
  /**
   * Scan all strategies and rank by signal strength
   */
  static async scanAllStrategies(
    lastDigits: number[],
    onProgress?: (progress: number, strategy: string) => void
  ): Promise<ScanResult[]> {
    const results: ScanResult[] = []
    const strategies = [
      { name: 'Over/Under', analyzer: ProfitPlusTradingLogic.analyzeOverUnder },
      { name: 'Even/Odd', analyzer: ProfitPlusTradingLogic.analyzeEvenOdd },
      { name: 'Matches', analyzer: ProfitPlusTradingLogic.analyzeMatches },
      { name: 'Differs', analyzer: ProfitPlusTradingLogic.analyzeDigits },
      { name: 'Rise/Fall', analyzer: ProfitPlusTradingLogic.analyzeRiseFall },
    ]

    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i]
      
      // Update progress
      const progress = Math.round(((i + 1) / strategies.length) * 100)
      if (onProgress) {
        onProgress(progress, strategy.name)
      }

      // Analyze strategy
      const signal = strategy.analyzer(lastDigits)
      
      // Calculate score (power * confidence)
      const score = (signal.power / 100) * signal.confidence

      // Determine digit range based on strategy and prediction
      let digitRange = ''
      if (strategy.name === 'Over/Under') {
        digitRange = signal.prediction === 'OVER' ? 'Over 5-9' : 'Under 0-4'
      } else if (strategy.name === 'Even/Odd') {
        digitRange = signal.prediction === 'EVEN' ? 'Even (0,2,4,6,8)' : 'Odd (1,3,5,7,9)'
      } else if (strategy.name === 'Matches') {
        digitRange = signal.prediction === 'MATCHES' ? 'Match Previous' : 'Differ Previous'
      } else if (strategy.name === 'Differs') {
        digitRange = signal.prediction === 'DIFFERS' ? 'Differ Previous' : 'Match Previous'
      } else if (strategy.name === 'Rise/Fall') {
        digitRange = signal.prediction === 'RISE' ? 'Rise (Higher)' : 'Fall (Lower)'
      }

      results.push({
        strategy: strategy.name,
        signal,
        score,
        rank: 0, // Will be set after sorting
        prediction: signal.prediction,
        digitRange,
      })

      // Simulate async delay for realistic scanning
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score)

    // Set ranks
    results.forEach((result, index) => {
      result.rank = index + 1
    })

    return results
  }

  /**
   * Get top N strategies
   */
  static getTopStrategies(results: ScanResult[], count: number = 5): ScanResult[] {
    return results.slice(0, count)
  }

  /**
   * Format signal for display
   */
  static formatSignal(result: ScanResult): string {
    return `${result.strategy} → ${result.digitRange || result.prediction}`
  }

  /**
   * Determine if signal is strong enough to trade (min 50% score)
   */
  static isStrongSignal(result: ScanResult): boolean {
    return result.score >= 0.5
  }

  /**
   * Get recommendation based on top strategy
   */
  static getRecommendation(topStrategy: ScanResult): {
    strategy: string
    prediction: string
    confidence: string
    reasoning: string
  } {
    const confidenceLevel = topStrategy.signal.confidence >= 0.8 ? 'Very High' : 
                           topStrategy.signal.confidence >= 0.6 ? 'High' :
                           topStrategy.signal.confidence >= 0.4 ? 'Medium' : 'Low'

    return {
      strategy: topStrategy.strategy,
      prediction: topStrategy.prediction,
      confidence: confidenceLevel,
      reasoning: topStrategy.signal.reasoning,
    }
  }
}

export const DIGIT_RANGES = {
  OVER: [5, 6, 7, 8, 9],
  UNDER: [0, 1, 2, 3, 4],
  EVEN: [0, 2, 4, 6, 8],
  ODD: [1, 3, 5, 7, 9],
  ALL: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
}
