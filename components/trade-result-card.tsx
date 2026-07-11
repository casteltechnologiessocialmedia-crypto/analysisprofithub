'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import styles from './trade-result-card.module.css'

export interface TradeResultCardProps {
  isVisible: boolean
  isWin: boolean
  profit: number
  strategy: string
  onClose?: () => void
  autoCloseDelay?: number
}

export const TradeResultCard: React.FC<TradeResultCardProps> = ({
  isVisible,
  isWin,
  profit,
  strategy,
  onClose,
  autoCloseDelay = 4000,
}) => {
  const [show, setShow] = useState(isVisible)

  useEffect(() => {
    setShow(isVisible)

    if (isVisible && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        setShow(false)
        onClose?.()
      }, autoCloseDelay)
      return () => clearTimeout(timer)
    }
  }, [isVisible, autoCloseDelay, onClose])

  if (!show) return null

  const formattedProfit = profit.toFixed(2)
  const profitSign = profit >= 0 ? '+' : '-'
  const title = isWin ? 'TAKE PROFIT HIT!' : 'STOP LOSS HIT!'
  const subtitle = isWin ? 'Target Reached Successfully' : 'Stop Loss Triggered'

  return (
    <div className={`${styles.cardContainer} ${isWin ? styles.winState : styles.lossState}`}>
      <div className={styles.backdrop} onClick={() => setShow(false)} />

      <div className={`${styles.card} ${isWin ? styles.cardWin : styles.cardLoss}`}>
        {/* Icon with animated glow */}
        <div className={styles.iconWrapper}>
          {isWin ? (
            <CheckCircle className={styles.iconWin} size={80} strokeWidth={1.5} />
          ) : (
            <XCircle className={styles.iconLoss} size={80} strokeWidth={1.5} />
          )}
          <div className={`${styles.glow} ${isWin ? styles.glowGreen : styles.glowRed}`} />
        </div>

        {/* Title */}
        <h2 className={styles.title}>{title}</h2>

        {/* Subtitle */}
        <p className={styles.subtitle}>{subtitle}</p>

        {/* Strategy badge */}
        <div className={`${styles.strategyBadge} ${isWin ? styles.strategyWin : styles.strategyLoss}`}>
          {strategy}
        </div>

        {/* Profit amount */}
        <div className={`${styles.profitAmount} ${isWin ? styles.profitWin : styles.profitLoss}`}>
          {profitSign}${formattedProfit}
        </div>

        {/* Action buttons */}
        <div className={styles.buttonGroup}>
          <button
            className={`${styles.button} ${isWin ? styles.buttonWin : styles.buttonLoss}`}
            onClick={() => setShow(false)}
          >
            {isWin ? '🚀 Continue Trading' : '📊 Analyze & Retry'}
          </button>
        </div>

        {/* Close button */}
        <button
          className={styles.closeButton}
          onClick={() => setShow(false)}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default TradeResultCard
