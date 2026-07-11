// Correct Trading Logic for ProfitPlus - Real Prediction Algorithms

export interface Digit {
  value: number
  timestamp: number
}

export interface TradeSignal {
  strategy: string
  prediction: 'UP' | 'DOWN' | 'OVER' | 'UNDER' | 'EVEN' | 'ODD' | 'MATCHES' | 'DIFFERS' | 'RISE' | 'FALL'
  confidence: number // 0-1
  power: number // 0-100
  reasoning: string
  entryPoint?: number
}

export interface TradeResult {
  strategy: string
  prediction: string
  stake: number
  profit: number
  win: boolean
  martingaleLevel: number
  timestamp: number
}

export class ProfitPlusTradingLogic {
  /**
   * Over/Under Strategy
   * Predicts if next digit will be Over (5-9) or Under (0-4)
   */
  static analyzeOverUnder(lastDigits: number[]): TradeSignal {
    if (lastDigits.length < 5) {
      return {
        strategy: 'Over/Under',
        prediction: 'OVER',
        confidence: 0.5,
        power: 50,
        reasoning: 'Insufficient data',
      }
    }

    // Get last 10 digits for analysis
    const recent = lastDigits.slice(-10)
    const overCount = recent.filter(d => d >= 5).length
    const underCount = recent.filter(d => d < 5).length
    const overPercent = (overCount / recent.length) * 100
    const underPercent = (underCount / recent.length) * 100

    // Mean reversion - if over is high, predict under and vice versa
    const prediction = overPercent > 60 ? 'UNDER' : 'OVER'
    const extremeDifference = Math.abs(overPercent - underPercent)
    const confidence = Math.min(extremeDifference / 100, 0.95)
    const power = Math.round(50 + (extremeDifference / 2))

    return {
      strategy: 'Over/Under',
      prediction,
      confidence,
      power,
      reasoning: `Over: ${overPercent.toFixed(1)}% | Under: ${underPercent.toFixed(1)}%`,
    }
  }

  /**
   * Even/Odd Strategy
   * Predicts if next digit will be Even (0,2,4,6,8) or Odd (1,3,5,7,9)
   */
  static analyzeEvenOdd(lastDigits: number[]): TradeSignal {
    if (lastDigits.length < 5) {
      return {
        strategy: 'Even/Odd',
        prediction: 'EVEN',
        confidence: 0.5,
        power: 50,
        reasoning: 'Insufficient data',
      }
    }

    const recent = lastDigits.slice(-10)
    const evenCount = recent.filter(d => d % 2 === 0).length
    const oddCount = recent.filter(d => d % 2 === 1).length
    const evenPercent = (evenCount / recent.length) * 100
    const oddPercent = (oddCount / recent.length) * 100

    // Mean reversion
    const prediction = evenPercent > 60 ? 'ODD' : 'EVEN'
    const extremeDifference = Math.abs(evenPercent - oddPercent)
    const confidence = Math.min(extremeDifference / 100, 0.95)
    const power = Math.round(50 + (extremeDifference / 2))

    return {
      strategy: 'Even/Odd',
      prediction,
      confidence,
      power,
      reasoning: `Even: ${evenPercent.toFixed(1)}% | Odd: ${oddPercent.toFixed(1)}%`,
    }
  }

  /**
   * Matches Strategy
   * Predicts if next digit will match the previous digit
   */
  static analyzeMatches(lastDigits: number[]): TradeSignal {
    if (lastDigits.length < 3) {
      return {
        strategy: 'Matches',
        prediction: 'MATCHES',
        confidence: 0.5,
        power: 50,
        reasoning: 'Insufficient data',
      }
    }

    const recent = lastDigits.slice(-10)
    let matchCount = 0

    for (let i = 1; i < recent.length; i++) {
      if (recent[i] === recent[i - 1]) {
        matchCount++
      }
    }

    const matchPercent = (matchCount / (recent.length - 1)) * 100
    // Matches are rare (10% likely) - if rare, predict matches; if common, predict differs
    const prediction = matchPercent < 15 ? 'MATCHES' : 'DIFFERS'
    const confidence = Math.min(Math.abs(matchPercent - 10) / 100, 0.85)
    const power = Math.round(50 + Math.abs(matchPercent - 10) / 2)

    return {
      strategy: 'Matches',
      prediction,
      confidence,
      power,
      reasoning: `Match frequency: ${matchPercent.toFixed(1)}%`,
    }
  }

  /**
   * Differs Strategy
   * Predicts if next digit will differ from the previous digit
   */
  static analyzeDigits(lastDigits: number[]): TradeSignal {
    if (lastDigits.length < 3) {
      return {
        strategy: 'Differs',
        prediction: 'DIFFERS',
        confidence: 0.5,
        power: 50,
        reasoning: 'Insufficient data',
      }
    }

    const recent = lastDigits.slice(-10)
    let differCount = 0

    for (let i = 1; i < recent.length; i++) {
      if (recent[i] !== recent[i - 1]) {
        differCount++
      }
    }

    const differPercent = (differCount / (recent.length - 1)) * 100
    // Differs is common (90% likely) - if common, predict differs; if rare, predict matches
    const prediction = differPercent > 85 ? 'DIFFERS' : 'MATCHES'
    const confidence = Math.min(Math.abs(differPercent - 90) / 100, 0.85)
    const power = Math.round(50 + Math.abs(differPercent - 90) / 2)

    return {
      strategy: 'Differs',
      prediction,
      confidence,
      power,
      reasoning: `Differ frequency: ${differPercent.toFixed(1)}%`,
    }
  }

  /**
   * Rise/Fall Strategy
   * Predicts if next digit will be higher (Rise) or lower (Fall) than previous
   */
  static analyzeRiseFall(lastDigits: number[]): TradeSignal {
    if (lastDigits.length < 5) {
      return {
        strategy: 'Rise/Fall',
        prediction: 'RISE',
        confidence: 0.5,
        power: 50,
        reasoning: 'Insufficient data',
      }
    }

    const recent = lastDigits.slice(-10)
    let riseCount = 0
    let fallCount = 0

    for (let i = 1; i < recent.length; i++) {
      if (recent[i] > recent[i - 1]) riseCount++
      else if (recent[i] < recent[i - 1]) fallCount++
    }

    const risePercent = (riseCount / (recent.length - 1)) * 100
    const fallPercent = (fallCount / (recent.length - 1)) * 100

    // Mean reversion
    const prediction = risePercent > 60 ? 'FALL' : 'RISE'
    const extremeDifference = Math.abs(risePercent - fallPercent)
    const confidence = Math.min(extremeDifference / 100, 0.85)
    const power = Math.round(50 + (extremeDifference / 2))

    return {
      strategy: 'Rise/Fall',
      prediction,
      confidence,
      power,
      reasoning: `Rise: ${risePercent.toFixed(1)}% | Fall: ${fallPercent.toFixed(1)}%`,
    }
  }

  /**
   * Check if prediction matches actual result
   */
  static checkPrediction(
    strategy: string,
    prediction: string,
    actualDigit: number,
    previousDigit: number
  ): boolean {
    switch (strategy) {
      case 'Over/Under':
        const isOver = actualDigit >= 5
        return (prediction === 'OVER' && isOver) || (prediction === 'UNDER' && !isOver)

      case 'Even/Odd':
        const isEven = actualDigit % 2 === 0
        return (prediction === 'EVEN' && isEven) || (prediction === 'ODD' && !isEven)

      case 'Matches':
        const matches = actualDigit === previousDigit
        return (prediction === 'MATCHES' && matches) || (prediction === 'DIFFERS' && !matches)

      case 'Differs':
        const differs = actualDigit !== previousDigit
        return (prediction === 'DIFFERS' && differs) || (prediction === 'MATCHES' && !differs)

      case 'Rise/Fall':
        const rises = actualDigit > previousDigit
        return (prediction === 'RISE' && rises) || (prediction === 'FALL' && !rises)

      default:
        return false
    }
  }

  /**
   * Calculate profit with martingale
   */
  static calculateProfit(
    stake: number,
    isWin: boolean,
    martingaleLevel: number = 1
  ): number {
    if (isWin) {
      // Win pays 1:1 (85% average payout)
      return stake * martingaleLevel * 0.85
    } else {
      // Loss loses the stake
      return -stake * martingaleLevel
    }
  }

  /**
   * Calculate next martingale stake
   */
  static calculateMartingaleStake(
    baseSt: number,
    multiplier: number,
    currentLevel: number,
    maxStake: number
  ): { stake: number; level: number } {
    const nextLevel = currentLevel + 1
    const nextStake = Math.min(baseSt * Math.pow(multiplier, nextLevel - 1), maxStake)
    return { stake: nextStake, level: nextLevel }
  }
}
