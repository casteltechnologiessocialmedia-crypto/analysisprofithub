'use client'

import React, { useState, useEffect } from 'react'
import { TradingScannerEngine, ScanResult } from '@/lib/trading-scanner-engine'
import { Zap, CheckCircle2 } from 'lucide-react'
import styles from './trading-scanner-ui.module.css'

interface TradingScannerUIProps {
  lastDigits: number[]
  onScanComplete?: (results: ScanResult[]) => void
  onStrategySelect?: (strategy: ScanResult) => void
}

export function TradingScannerUI({
  lastDigits,
  onScanComplete,
  onStrategySelect,
}: TradingScannerUIProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStrategy, setCurrentStrategy] = useState('')
  const [results, setResults] = useState<ScanResult[]>([])
  const [selectedStrategy, setSelectedStrategy] = useState<ScanResult | null>(null)
  const [showResults, setShowResults] = useState(false)

  const handleScan = async () => {
    if (lastDigits.length < 5) {
      alert('Need at least 5 digits to scan')
      return
    }

    setIsScanning(true)
    setProgress(0)
    setResults([])
    setSelectedStrategy(null)
    setShowResults(false)

    try {
      const scanResults = await TradingScannerEngine.scanAllStrategies(
        lastDigits,
        (progress, strategy) => {
          setProgress(progress)
          setCurrentStrategy(strategy)
        }
      )

      setResults(scanResults)
      setShowResults(true)

      if (onScanComplete) {
        onScanComplete(scanResults)
      }
    } catch (error) {
      console.error('Scan failed:', error)
    } finally {
      setIsScanning(false)
      setCurrentStrategy('')
    }
  }

  const handleSelectStrategy = (strategy: ScanResult) => {
    setSelectedStrategy(strategy)
    if (onStrategySelect) {
      onStrategySelect(strategy)
    }
  }

  return (
    <div className={styles.container}>
      {/* Scanner Control */}
      <div className={styles.scannerControl}>
        <button
          onClick={handleScan}
          disabled={isScanning}
          className={`${styles.scanButton} ${isScanning ? styles.scanning : ''}`}
        >
          <Zap size={20} />
          {isScanning ? 'Scanning Market...' : 'Start Scan'}
        </button>

        {/* Progress Display */}
        {isScanning && (
          <div className={styles.progressSection}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className={styles.progressText}>
              <span className={styles.percentage}>{progress}%</span>
              <span className={styles.strategy}>Analyzing {currentStrategy}</span>
            </div>

            {/* Animated Dots */}
            <div className={styles.scanningDots}>
              <div className={styles.dot}></div>
              <div className={styles.dot}></div>
              <div className={styles.dot}></div>
            </div>
          </div>
        )}
      </div>

      {/* Results Display */}
      {showResults && results.length > 0 && (
        <div className={styles.resultsContainer}>
          <h3 className={styles.resultsTitle}>Top Strategy Signals</h3>

          <div className={styles.strategiesList}>
            {results.map((result) => (
              <div
                key={result.strategy}
                className={`${styles.strategyCard} ${
                  selectedStrategy?.strategy === result.strategy
                    ? styles.selected
                    : ''
                }`}
                onClick={() => handleSelectStrategy(result)}
              >
                {/* Rank Badge */}
                <div className={styles.rankBadge}>#{result.rank}</div>

                {/* Strategy Header */}
                <div className={styles.strategyHeader}>
                  <h4 className={styles.strategyName}>{result.strategy}</h4>
                  {selectedStrategy?.strategy === result.strategy && (
                    <CheckCircle2 size={20} className={styles.selectedIcon} />
                  )}
                </div>

                {/* Signal Details */}
                <div className={styles.signalDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Prediction:</span>
                    <span className={styles.value}>{result.digitRange}</span>
                  </div>

                  <div className={styles.detailRow}>
                    <span className={styles.label}>Power:</span>
                    <div className={styles.powerBar}>
                      <div
                        className={styles.powerFill}
                        style={{ width: `${result.signal.power}%` }}
                      />
                      <span className={styles.powerText}>
                        {result.signal.power.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className={styles.detailRow}>
                    <span className={styles.label}>Confidence:</span>
                    <span className={styles.confidenceValue}>
                      {(result.signal.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className={styles.detailRow}>
                    <span className={styles.label}>Score:</span>
                    <span className={styles.scoreValue}>
                      {(result.score * 100).toFixed(1)}
                    </span>
                  </div>

                  {/* Reasoning */}
                  <div className={styles.reasoning}>
                    <small>{result.signal.reasoning}</small>
                  </div>
                </div>

                {/* Select Button */}
                <button className={styles.selectButton}>
                  {selectedStrategy?.strategy === result.strategy
                    ? '✓ Selected'
                    : 'Select Strategy'}
                </button>
              </div>
            ))}
          </div>

          {/* Recommendation */}
          {results.length > 0 && (
            <div className={styles.recommendationBox}>
              <h4>Top Recommendation</h4>
              <p>
                <strong>{results[0].strategy}</strong> shows the strongest signal with{' '}
                <strong>{results[0].digitRange}</strong> prediction
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
