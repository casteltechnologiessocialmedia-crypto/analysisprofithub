import type { Analysis } from "./analysis-engine"

export interface MarketZone {
  zone: "LOWER_BOUND" | "LOWER_QUARTER" | "MID" | "UPPER_QUARTER" | "UPPER_BOUND"
  probability: number
  confidence: number
}

export interface TradingSignal {
  type: "OVER" | "UNDER" | "EVEN" | "ODD" | "DIFFERS" | "MATCHES" | "RISE" | "FALL" | "HIGH" | "LOW"
  power: number
  probability: number
  entry: string
  zone: MarketZone
  timestamp: number
  multiplyFactor: number
}

export interface StrategyAnalysis {
  strategy: string
  signals: TradingSignal[]
  recommendedTrade?: TradingSignal
  marketTrend: string
  volatility: number
}

export class ProfitPlusEngine {
  private POWER_THRESHOLD = 55
  private HIGH_PROBABILITY_THRESHOLD = 70
  private MAX_MULTIPLIER = 5

  /**
   * Analyze multiple strategies and generate trading signals
   */
  analyzeMarket(analysis: Analysis, recentDigits: number[]): StrategyAnalysis[] {
    const strategies: StrategyAnalysis[] = []

    // Analyze Over/Under
    strategies.push(this.analyzeOverUnder(analysis, recentDigits))

    // Analyze Even/Odd
    strategies.push(this.analyzeEvenOdd(analysis, recentDigits))

    // Analyze Differs
    strategies.push(this.analyzediffers(analysis, recentDigits))

    // Analyze Matches
    strategies.push(this.analyzeMatches(analysis, recentDigits))

    // Analyze Rise/Fall
    strategies.push(this.analyzeRiseFall(analysis, recentDigits))

    return strategies
  }

  /**
   * Generate high-probability trading signals from all strategies
   */
  getHighProbabilitySignals(strategies: StrategyAnalysis[]): TradingSignal[] {
    const allSignals: TradingSignal[] = []

    for (const strategy of strategies) {
      for (const signal of strategy.signals) {
        if (
          signal.power >= this.POWER_THRESHOLD &&
          signal.probability >= this.HIGH_PROBABILITY_THRESHOLD
        ) {
          allSignals.push(signal)
        }
      }
    }

    // Sort by power then probability
    return allSignals.sort((a, b) => {
      const powerDiff = b.power - a.power
      return powerDiff !== 0 ? powerDiff : b.probability - a.probability
    })
  }

  /**
   * Get recommended trade from highest probability signal
   */
  getRecommendedTrade(signals: TradingSignal[]): TradingSignal | null {
    if (signals.length === 0) return null
    return signals[0]
  }

  /**
   * Calculate market zone based on current digit
   */
  private getMarketZone(digit: number): MarketZone {
    let zone: "LOWER_BOUND" | "LOWER_QUARTER" | "MID" | "UPPER_QUARTER" | "UPPER_BOUND"
    let confidence: number

    if (digit < 2) {
      zone = "LOWER_BOUND"
      confidence = 85
    } else if (digit < 4) {
      zone = "LOWER_QUARTER"
      confidence = 75
    } else if (digit < 6) {
      zone = "MID"
      confidence = 70
    } else if (digit < 8) {
      zone = "UPPER_QUARTER"
      confidence = 75
    } else {
      zone = "UPPER_BOUND"
      confidence = 85
    }

    return {
      zone,
      probability: confidence / 100,
      confidence,
    }
  }

  /**
   * Calculate martingale multiplier based on consecutive losses
   */
  calculateMartingaleMultiplier(consecutiveLosses: number): number {
    const multiplier = Math.min(Math.pow(2, consecutiveLosses), this.MAX_MULTIPLIER)
    return Math.round(multiplier * 100) / 100
  }

  private analyzeOverUnder(analysis: Analysis, recentDigits: number[]): StrategyAnalysis {
    const overCount = recentDigits.filter((d) => d >= 5).length
    const underCount = recentDigits.length - overCount

    const overProbability = (overCount / recentDigits.length) * 100
    const underProbability = (underCount / recentDigits.length) * 100

    const signals: TradingSignal[] = []

    if (overProbability > this.POWER_THRESHOLD) {
      signals.push({
        type: "OVER",
        power: Math.min(overProbability, 99),
        probability: overProbability,
        entry: recentDigits[recentDigits.length - 1]?.toString() || "0",
        zone: this.getMarketZone(recentDigits[recentDigits.length - 1] || 0),
        timestamp: Date.now(),
        multiplyFactor: 1,
      })
    }

    if (underProbability > this.POWER_THRESHOLD) {
      signals.push({
        type: "UNDER",
        power: Math.min(underProbability, 99),
        probability: underProbability,
        entry: recentDigits[recentDigits.length - 1]?.toString() || "0",
        zone: this.getMarketZone(recentDigits[recentDigits.length - 1] || 0),
        timestamp: Date.now(),
        multiplyFactor: 1,
      })
    }

    return {
      strategy: "Over/Under",
      signals,
      marketTrend: overProbability > 50 ? "OVER" : "UNDER",
      volatility: Math.abs(overProbability - 50) / 50,
    }
  }

  private analyzeEvenOdd(analysis: Analysis, recentDigits: number[]): StrategyAnalysis {
    const evenCount = recentDigits.filter((d) => d % 2 === 0).length
    const oddCount = recentDigits.length - evenCount

    const evenProbability = (evenCount / recentDigits.length) * 100
    const oddProbability = (oddCount / recentDigits.length) * 100

    const signals: TradingSignal[] = []

    if (evenProbability > this.POWER_THRESHOLD) {
      signals.push({
        type: "EVEN",
        power: Math.min(evenProbability, 99),
        probability: evenProbability,
        entry: recentDigits[recentDigits.length - 1]?.toString() || "0",
        zone: this.getMarketZone(recentDigits[recentDigits.length - 1] || 0),
        timestamp: Date.now(),
        multiplyFactor: 1,
      })
    }

    if (oddProbability > this.POWER_THRESHOLD) {
      signals.push({
        type: "ODD",
        power: Math.min(oddProbability, 99),
        probability: oddProbability,
        entry: recentDigits[recentDigits.length - 1]?.toString() || "0",
        zone: this.getMarketZone(recentDigits[recentDigits.length - 1] || 0),
        timestamp: Date.now(),
        multiplyFactor: 1,
      })
    }

    return {
      strategy: "Even/Odd",
      signals,
      marketTrend: evenProbability > 50 ? "EVEN" : "ODD",
      volatility: Math.abs(evenProbability - 50) / 50,
    }
  }

  private analyzeMatches(analysis: Analysis, recentDigits: number[]): StrategyAnalysis {
    if (recentDigits.length < 2) {
      return {
        strategy: "Matches",
        signals: [],
        marketTrend: "NEUTRAL",
        volatility: 0,
      }
    }

    const lastDigit = recentDigits[recentDigits.length - 1]
    const matchCount = recentDigits.slice(0, -1).filter((d) => d === lastDigit).length

    const matchProbability = (matchCount / (recentDigits.length - 1)) * 100
    const nonMatchProbability = 100 - matchProbability

    const signals: TradingSignal[] = []

    if (matchProbability > this.POWER_THRESHOLD) {
      signals.push({
        type: "MATCHES",
        power: Math.min(matchProbability, 99),
        probability: matchProbability,
        entry: lastDigit.toString(),
        zone: this.getMarketZone(lastDigit),
        timestamp: Date.now(),
        multiplyFactor: 1.2,
      })
    }

    if (nonMatchProbability > this.POWER_THRESHOLD) {
      signals.push({
        type: "DIFFERS",
        power: Math.min(nonMatchProbability, 99),
        probability: nonMatchProbability,
        entry: lastDigit.toString(),
        zone: this.getMarketZone(lastDigit),
        timestamp: Date.now(),
        multiplyFactor: 1.15,
      })
    }

    return {
      strategy: "Matches",
      signals,
      marketTrend: matchProbability > 50 ? "MATCHES" : "DIFFERS",
      volatility: Math.abs(matchProbability - 50) / 50,
    }
  }

  private analyzediffers(analysis: Analysis, recentDigits: number[]): StrategyAnalysis {
    if (recentDigits.length < 2) {
      return {
        strategy: "Differs",
        signals: [],
        marketTrend: "NEUTRAL",
        volatility: 0,
      }
    }

    // This is covered by analyzeMatches as the inverse
    return {
      strategy: "Differs",
      signals: [],
      marketTrend: "NEUTRAL",
      volatility: 0,
    }
  }

  private analyzeRiseFall(analysis: Analysis, recentDigits: number[]): StrategyAnalysis {
    if (recentDigits.length < 2) {
      return {
        strategy: "Rise/Fall",
        signals: [],
        marketTrend: "NEUTRAL",
        volatility: 0,
      }
    }

    const lastDigit = recentDigits[recentDigits.length - 1]
    const secondLast = recentDigits[recentDigits.length - 2]

    const riseCount = recentDigits
      .slice(1)
      .filter((d, i) => d > recentDigits[i])
      .length

    const fallCount = recentDigits.length - 1 - riseCount

    const riseProbability = (riseCount / (recentDigits.length - 1)) * 100
    const fallProbability = (fallCount / (recentDigits.length - 1)) * 100

    const signals: TradingSignal[] = []

    if (lastDigit > secondLast && riseProbability > this.POWER_THRESHOLD) {
      signals.push({
        type: "RISE",
        power: Math.min(riseProbability, 99),
        probability: riseProbability,
        entry: lastDigit.toString(),
        zone: this.getMarketZone(lastDigit),
        timestamp: Date.now(),
        multiplyFactor: 1.1,
      })
    }

    if (lastDigit < secondLast && fallProbability > this.POWER_THRESHOLD) {
      signals.push({
        type: "FALL",
        power: Math.min(fallProbability, 99),
        probability: fallProbability,
        entry: lastDigit.toString(),
        zone: this.getMarketZone(lastDigit),
        timestamp: Date.now(),
        multiplyFactor: 1.1,
      })
    }

    return {
      strategy: "Rise/Fall",
      signals,
      marketTrend: riseProbability > 50 ? "RISE" : "FALL",
      volatility: Math.abs(riseProbability - 50) / 50,
    }
  }
}
