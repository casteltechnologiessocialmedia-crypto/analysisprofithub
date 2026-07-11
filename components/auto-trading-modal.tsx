'use client'

import React, { useState, useEffect } from 'react'
import { ScanResult } from '@/lib/trading-scanner-engine'
import { SmartTradeLoop, TradeExecution, LoopState } from '@/lib/smart-trade-loop'
import { Play, Pause, X } from 'lucide-react'
import styles from './auto-trading-modal.module.css'

interface AutoTradingModalProps {
  isOpen: boolean
  selectedStrategy: ScanResult | null
  baseStake: number
  targetProfit: number
  stopLoss: number
  martingaleMultiplier: number
  ticks: number
  market: string
  onClose?: () => void
  onTradeExecute?: (trade: TradeExecution) => Promise<any>
  onLoopComplete?: (loopState: LoopState) => void
}

export function AutoTradingModal({
  isOpen,
  selectedStrategy,
  baseStake,
  targetProfit,
  stopLoss,
  martingaleMultiplier,
  ticks,
  market,
  onClose,
  onTradeExecute,
  onLoopComplete,
}: AutoTradingModalProps) {
  const [loopState, setLoopState] = useState<LoopState | null>(null)
  const [currentTrade, setCurrentTrade] = useState<TradeExecution | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [tradeStatus, setTradeStatus] = useState<'idle' | 'running' | 'paused' | 'complete'>('idle')

  useEffect(() => {
    if (isOpen && selectedStrategy) {
      // Initialize loop
      const newLoopState = SmartTradeLoop.initializeLoop(
        selectedStrategy,
        baseStake,
        targetProfit,
        stopLoss,
        martingaleMultiplier,
        ticks,
        market,
        5 // Start with 5 trades
      )
      setLoopState(newLoopState)
      setTradeStatus('idle')
    }
  }, [isOpen, selectedStrategy])

  const handleStartAutoTrading = async () => {
    if (!loopState || !selectedStrategy) return

    setIsExecuting(true)
    setTradeStatus('running')
    
    let currentLoop = { ...loopState }

    while (
      currentLoop.currentTradeNumber < currentLoop.totalTradesPlanned &&
      currentLoop.cumulativeProfit < currentLoop.targetProfitGlobal
    ) {
      // Check if should pause to recheck market
      if (currentLoop.shouldPause) {
        setTradeStatus('paused')
        setLoopState(currentLoop)
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second pause
        currentLoop = SmartTradeLoop.resumeLoop(currentLoop)
        setTradeStatus('running')
      }

      // Check if should switch market
      if (SmartTradeLoop.shouldSwitchMarket(currentLoop)) {
        const newMarket = SmartTradeLoop.getNextMarket(currentLoop.currentMarket)
        currentLoop.currentMarket = newMarket
        setTradeStatus('paused')
        setLoopState(currentLoop)
        await new Promise(resolve => setTimeout(resolve, 1500))
        currentLoop = SmartTradeLoop.resumeLoop(currentLoop)
        setTradeStatus('running')
      }

      // Generate next trade
      const nextTrade = SmartTradeLoop.generateNextTrade(
        currentLoop,
        selectedStrategy,
        baseStake,
        martingaleMultiplier,
        ticks
      )

      if (!nextTrade) break

      setCurrentTrade(nextTrade)

      try {
        // Execute trade via API
        if (onTradeExecute) {
          const result = await onTradeExecute(nextTrade)
          
          // Update loop state with result
          currentLoop = SmartTradeLoop.updateLoopAfterTrade(currentLoop, nextTrade, result)
          setLoopState(currentLoop)
        }
      } catch (error) {
        console.error('Trade execution failed:', error)
        break
      }

      // Delay between trades
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    setTradeStatus('complete')
    setIsExecuting(false)
    
    if (onLoopComplete) {
      onLoopComplete(currentLoop)
    }
  }

  const handlePause = () => {
    setTradeStatus('paused')
    setIsExecuting(false)
  }

  const handleResume = async () => {
    if (!loopState) return
    await handleStartAutoTrading()
  }

  if (!isOpen || !selectedStrategy || !loopState) return null

  const status = SmartTradeLoop.getLoopStatus(loopState)
  const isComplete = status.tpHit || status.slHit

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} />

      {/* Modal */}
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h2 className={styles.title}>Auto Trading Session</h2>
            <p className={styles.subtitle}>{selectedStrategy.strategy}</p>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        {/* Trade Details */}
        <div className={styles.tradeDetails}>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.label}>Market Type</span>
              <span className={styles.value}>{loopState.currentMarket}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Strategy</span>
              <span className={styles.value}>{selectedStrategy.strategy}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Prediction</span>
              <span className={styles.value}>{selectedStrategy.digitRange}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Base Stake</span>
              <span className={styles.value}>${baseStake}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Target Profit</span>
              <span className={styles.value}>${targetProfit}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Stop Loss</span>
              <span className={styles.value}>${stopLoss}</span>
            </div>
          </div>
        </div>

        {/* Current Trade Info */}
        {currentTrade && (
          <div className={styles.currentTradeBox}>
            <h4>Trade #{currentTrade.tradeNumber}</h4>
            <p>Stake: <strong>${currentTrade.stake.toFixed(2)}</strong></p>
            <p>Martingale Level: <strong>{currentTrade.martingaleLevel}</strong></p>
            <p>Ticks: <strong>{currentTrade.ticks}</strong></p>
          </div>
        )}

        {/* Loop Status */}
        <div className={styles.loopStatus}>
          <div className={styles.progressContainer}>
            <div className={styles.tradeCounter}>
              Trade {status.tradesCompleted}/{loopState.totalTradesPlanned}
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${(status.tradesCompleted / loopState.totalTradesPlanned) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Cumulative P/L</span>
              <span className={`${styles.statValue} ${status.currentProfit >= 0 ? styles.positive : styles.negative}`}>
                ${status.currentProfit.toFixed(2)}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Wins</span>
              <span className={styles.statValue}>{status.winCount}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Losses</span>
              <span className={styles.statValue}>{status.lossCount}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Status</span>
              <span className={`${styles.statValue} ${styles.statusValue}`}>
                {tradeStatus.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Status Message */}
          <div className={styles.statusMessage}>
            {status.nextAction}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          {!isExecuting && tradeStatus === 'idle' && (
            <button
              onClick={handleStartAutoTrading}
              className={`${styles.button} ${styles.startButton}`}
            >
              <Play size={20} />
              Start Auto Trading
            </button>
          )}

          {isExecuting && tradeStatus === 'running' && (
            <button
              onClick={handlePause}
              className={`${styles.button} ${styles.pauseButton}`}
            >
              <Pause size={20} />
              Pause Trading
            </button>
          )}

          {tradeStatus === 'paused' && (
            <>
              <button
                onClick={handleResume}
                className={`${styles.button} ${styles.resumeButton}`}
              >
                <Play size={20} />
                Resume Trading
              </button>
              <button onClick={onClose} className={`${styles.button} ${styles.cancelButton}`}>
                Cancel
              </button>
            </>
          )}

          {tradeStatus === 'complete' && (
            <button onClick={onClose} className={`${styles.button} ${styles.doneButton}`}>
              Done
            </button>
          )}
        </div>

        {/* Trade History */}
        {loopState.trades.length > 0 && (
          <div className={styles.tradeHistory}>
            <h4>Trade History</h4>
            <div className={styles.historyList}>
              {loopState.trades.map((trade, index) => (
                <div
                  key={index}
                  className={`${styles.historyItem} ${
                    trade.status === 'won' ? styles.won : styles.lost
                  }`}
                >
                  <span>#{trade.tradeNumber}</span>
                  <span>${trade.stake.toFixed(2)}</span>
                  <span>{trade.status.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
