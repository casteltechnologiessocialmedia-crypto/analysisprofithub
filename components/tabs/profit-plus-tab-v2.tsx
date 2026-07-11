'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Bell, TrendingUp, AlertCircle, CheckCircle, Zap } from 'lucide-react'
import { ProfitPlusEngine } from '@/lib/profit-plus-engine'
import { ProfitPlusAutoTrading } from '@/lib/profit-plus-auto-trading'
import { submitTradeResult, formatTradeForSubmission } from '@/lib/trade-result-submitter'
import { TradeResultCard } from '@/components/trade-result-card'
import styles from './profit-plus-v2.module.css'

interface Analysis {
  timestamp: number
  currentDigit: number
  overDigits: number
  underDigits: number
  evenDigits: number
  oddDigits: number
  matchesDigits: number
  differsDigits: number
}

interface ProfitPlusTabProps {
  analysis: Analysis
  currentDigit: number
  currentPrice: number
  recentDigits: number[]
  theme: 'light' | 'dark'
  symbol: string
  balance: number
  token: string
}

export function ProfitPlusTabV2({
  analysis,
  currentDigit,
  currentPrice,
  recentDigits,
  theme,
  symbol,
  balance,
  token,
}: ProfitPlusTabProps) {
  const [statusColor, setStatusColor] = useState<'green' | 'blue' | 'yellow'>('blue')
  const [statusText, setStatusText] = useState('Market Analysis Active')
  const [isAutoTrading, setIsAutoTrading] = useState(false)
  const [tps, setTps] = useState(100)
  const [maxStakePercent, setMaxStakePercent] = useState(20)
  const [excludedDigits, setExcludedDigits] = useState<number[]>([])
  const [tradeHistory, setTradeHistory] = useState<any[]>([])
  const [resultCard, setResultCard] = useState<{
    isVisible: boolean
    isWin: boolean
    profit: number
    strategy: string
  }>({
    isVisible: false,
    isWin: false,
    profit: 0,
    strategy: '',
  })
  const [currentSignal, setCurrentSignal] = useState<any>(null)
  const [notification, setNotification] = useState<{
    message: string
    type: 'green' | 'blue' | 'yellow'
  } | null>(null)
  const [stats, setStats] = useState({
    totalTrades: 0,
    wins: 0,
    losses: 0,
    currentBalance: balance,
    profitLoss: 0,
  })
  const autoTradingRef = useRef<any>(null)
  const notificationTimeoutRef = useRef<NodeJS.Timeout>()

  const engine = useRef(new ProfitPlusEngine()).current
  const autoTrading = useRef(new ProfitPlusAutoTrading({
    tps,
    maxStakePercent,
    excludedDigits,
  })).current

  // Update status based on market conditions
  useEffect(() => {
    const checkMarketCondition = () => {
      if (!analysis) return

      const totalDigits = recentDigits.length
      const volatility = Math.abs(analysis.overDigits - analysis.underDigits)

      if (volatility > totalDigits * 0.6) {
        setStatusColor('yellow')
        setStatusText('Market Unstable - High Volatility')
      } else if (volatility > totalDigits * 0.4) {
        setStatusColor('blue')
        setStatusText('Market Suitable - Medium Volatility')
      } else {
        setStatusColor('green')
        setStatusText('Signal Detected - Ready to Trade')
      }
    }

    checkMarketCondition()
    const interval = setInterval(checkMarketCondition, 5000)
    return () => clearInterval(interval)
  }, [analysis, recentDigits])

  // Analyze current market and generate signals
  useEffect(() => {
    if (!analysis) return

    const signals = engine.analyzeMarket(analysis, recentDigits)

    const highProbabilitySignals = signals.filter(s => s.power >= 0.55)
    if (highProbabilitySignals.length > 0) {
      const bestSignal = highProbabilitySignals.sort((a, b) => b.power - a.power)[0]
      setCurrentSignal(bestSignal)

      if (statusColor !== 'yellow') {
        showNotification('New Signal Detected!', 'green')
      }
    }
  }, [analysis, engine, statusColor])

  const showNotification = (message: string, type: 'green' | 'blue' | 'yellow') => {
    setNotification({ message, type })
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current)
    }
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null)
    }, 4000)
  }

  const toggleAutoTrading = () => {
    setIsAutoTrading(!isAutoTrading)
    if (!isAutoTrading) {
      showNotification('Auto-Trading Started', 'green')
    } else {
      showNotification('Auto-Trading Paused', 'blue')
    }
  }

  const executeManualTrade = () => {
    if (!currentSignal) {
      showNotification('No Signal Available', 'yellow')
      return
    }

    const stake = (stats.currentBalance * maxStakePercent) / 100
    const result = {
      isWin: Math.random() > 0.5,
      profit: stake * (Math.random() > 0.5 ? 1.85 : -1),
    }

    const newBalance = stats.currentBalance + (result.profit || 0)
    setStats({
      totalTrades: stats.totalTrades + 1,
      wins: stats.wins + (result.isWin ? 1 : 0),
      losses: stats.losses + (result.isWin ? 0 : 1),
      currentBalance: newBalance,
      profitLoss: stats.profitLoss + (result.profit || 0),
    })

    const trade = {
      type: currentSignal.strategy,
      entry: currentSignal.entryPoint,
      result: result.isWin ? 'WIN' : 'LOSS',
      profit: result.profit,
      timestamp: new Date().toLocaleTimeString(),
    }

    setTradeHistory([trade, ...tradeHistory.slice(0, 9)])

    // Show result card
    setResultCard({
      isVisible: true,
      isWin: result.isWin,
      profit: result.profit || 0,
      strategy: currentSignal.strategy,
    })

    if (result.isWin) {
      showNotification(`Win! +$${Math.abs(result.profit || 0).toFixed(2)}`, 'green')
      setStatusColor('green')
      setStatusText('Take Profit Reached!')
    } else {
      showNotification(`Loss! -$${Math.abs(result.profit || 0).toFixed(2)}`, 'blue')
      setStatusColor('yellow')
      setStatusText('Stop Loss Triggered')
    }

    // Post to API
    if (token) {
      const tradeData = formatTradeForSubmission(
        token,
        currentSignal.strategy,
        symbol,
        result.profit || 0,
        stake,
      )
      submitTradeResult(tradeData)
    }
  }

  const toggleDigitExclusion = (digit: number) => {
    if (excludedDigits.includes(digit)) {
      setExcludedDigits(excludedDigits.filter(d => d !== digit))
    } else {
      setExcludedDigits([...excludedDigits, digit])
    }
  }

  // Prepare chart data from last 20 digits
  const chartData = recentDigits.slice(-20).map((digit, index) => ({
    index: index + 1,
    digit,
  }))

  return (
    <div className={styles.container}>
      {/* Header with Robot and Status */}
      <div className={styles.header}>
        <div className={styles.robotSection}>
          <div className={styles.robotImage}>
            🤖
          </div>
          <div className={styles.statusSection}>
            <div className={styles.statusTitle}>ProfitPlus AI Trading</div>
            <div className={`${styles.statusBadge} ${styles[statusColor]}`}>
              <div className={`${styles.statusDot} ${styles[statusColor]}`}></div>
              {statusText}
            </div>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Trades</div>
            <div className={styles.statValue}>{stats.totalTrades}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Win Rate</div>
            <div className={styles.statValue}>
              {stats.totalTrades > 0
                ? ((stats.wins / stats.totalTrades) * 100).toFixed(1)
                : 0}
              %
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Balance</div>
            <div className={styles.statValue}>${stats.currentBalance.toFixed(0)}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Profit/Loss</div>
            <div
              className={styles.statValue}
              style={{ color: stats.profitLoss >= 0 ? '#22c55e' : '#ef4444' }}
            >
              {stats.profitLoss >= 0 ? '+' : ''}${stats.profitLoss.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Left Panel - Signals and Analysis */}
        <div className={styles.panel}>
          <div className={styles.panelTitle}>
            <div className={styles.panelTitleIcon}>
              <Zap size={18} />
            </div>
            Market Analysis & Signals
          </div>

          {currentSignal ? (
            <div className={`${styles.signalBox} ${statusColor === 'green' ? '' : statusColor === 'blue' ? styles.blue : styles.yellow}`}>
              <div className={styles.signalLabel}>Recommended Trade</div>
              <div className={`${styles.signalValue} ${statusColor === 'green' ? '' : statusColor === 'blue' ? styles.blue : styles.yellow}`}>
                {currentSignal.strategy}
              </div>
              <div className={styles.signalDetails}>
                <div className={styles.signalDetail}>
                  <span className={styles.signalDetailLabel}>Power Level:</span>
                  <span className={styles.signalDetailValue}>{(currentSignal.power * 100).toFixed(1)}%</span>
                </div>
                <div className={styles.signalDetail}>
                  <span className={styles.signalDetailLabel}>Probability:</span>
                  <span className={styles.signalDetailValue}>{(currentSignal.probability * 100).toFixed(1)}%</span>
                </div>
                <div className={styles.signalDetail}>
                  <span className={styles.signalDetailLabel}>Entry:</span>
                  <span className={styles.signalDetailValue}>{currentSignal.entryPoint}</span>
                </div>
                <div className={styles.signalDetail}>
                  <span className={styles.signalDetailLabel}>Zone:</span>
                  <span className={styles.signalDetailValue}>{currentSignal.marketZone}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.signalBox}>
              <div className={styles.signalLabel}>Status</div>
              <div className={styles.signalValue} style={{ color: '#94a3b8', fontSize: '16px' }}>
                Analyzing Market...
              </div>
            </div>
          )}

          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(71, 85, 105, 0.2)" />
                <XAxis dataKey="index" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="digit"
                  stroke="rgba(139, 92, 246, 0.8)"
                  dot={{ fill: 'rgba(139, 92, 246, 0.6)', r: 4 }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.panelTitle} style={{ marginTop: '24px' }}>
            <div className={styles.panelTitleIcon}>
              <AlertCircle size={18} />
            </div>
            Market Metrics
          </div>
          <div className={styles.signalDetails}>
            <div className={styles.signalDetail}>
              <span className={styles.signalDetailLabel}>Over Count:</span>
              <span className={styles.signalDetailValue}>{analysis?.overDigits || 0}</span>
            </div>
            <div className={styles.signalDetail}>
              <span className={styles.signalDetailLabel}>Under Count:</span>
              <span className={styles.signalDetailValue}>{analysis?.underDigits || 0}</span>
            </div>
            <div className={styles.signalDetail}>
              <span className={styles.signalDetailLabel}>Even Count:</span>
              <span className={styles.signalDetailValue}>{analysis?.evenDigits || 0}</span>
            </div>
            <div className={styles.signalDetail}>
              <span className={styles.signalDetailLabel}>Odd Count:</span>
              <span className={styles.signalDetailValue}>{analysis?.oddDigits || 0}</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Trading Controls */}
        <div className={styles.panel}>
          <div className={styles.panelTitle}>
            <div className={styles.panelTitleIcon}>
              <TrendingUp size={18} />
            </div>
            Trading Console
          </div>

          <div className={styles.controlsPanel}>
            {/* TPS Control */}
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Target Profit Stop ($)</label>
              <input
                type="number"
                value={tps}
                onChange={(e) => setTps(Math.max(10, parseInt(e.target.value) || 100))}
                className={styles.inputField}
                placeholder="100"
              />
            </div>

            {/* Max Stake Slider */}
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Max Stake %</label>
              <div className={styles.sliderContainer}>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={maxStakePercent}
                  onChange={(e) => setMaxStakePercent(parseInt(e.target.value))}
                  className={styles.sliderInput}
                />
                <span className={styles.sliderValue}>{maxStakePercent}%</span>
              </div>
              <div className={styles.signalDetail}>
                <span className={styles.signalDetailLabel}>Stake Amount:</span>
                <span className={styles.signalDetailValue}>
                  ${((stats.currentBalance * maxStakePercent) / 100).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Exclude Digits */}
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Exclude Digits</label>
              <div className={styles.digitsList}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                  <div
                    key={digit}
                    className={`${styles.digitBadge} ${excludedDigits.includes(digit) ? styles.excluded : ''}`}
                    onClick={() => toggleDigitExclusion(digit)}
                  >
                    {digit}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.buttonGroup}>
              <button
                className={`${styles.button} ${styles.primaryButton}`}
                onClick={executeManualTrade}
                disabled={!currentSignal}
              >
                Execute Trade
              </button>
              <button
                className={`${styles.button} ${isAutoTrading ? styles.dangerButton : styles.secondaryButton}`}
                onClick={toggleAutoTrading}
              >
                {isAutoTrading ? 'PAUSE' : 'START'}
              </button>
            </div>

            {/* Status Indicator */}
            <div className={styles.signalBox} style={{ marginTop: '24px' }}>
              <div className={styles.signalLabel}>Auto Trading</div>
              <div className={styles.signalValue} style={{ fontSize: '16px', color: isAutoTrading ? '#22c55e' : '#94a3b8' }}>
                {isAutoTrading ? '��� ACTIVE' : '⚪ PAUSED'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trade History */}
      <div className={styles.panel}>
        <div className={styles.panelTitle}>
          <div className={styles.panelTitleIcon}>
            <CheckCircle size={18} />
          </div>
          Trade History
        </div>
        <div className={styles.historyPanel}>
          {tradeHistory.length > 0 ? (
            tradeHistory.map((trade, index) => (
              <div key={index} className={styles.historyItem}>
                <div className={styles.historyItemTrade}>
                  <div>
                    <strong>{trade.type}</strong> @ {trade.entry}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{trade.timestamp}</div>
                </div>
                <div className={styles.historyItemResult}>
                  <span className={trade.result === 'WIN' ? styles.resultWin : styles.resultLoss}>
                    {trade.result}
                  </span>
                  <span style={{ color: trade.profit >= 0 ? '#22c55e' : '#ef4444', fontWeight: '600' }}>
                    {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
              No trades yet. Start trading to see history.
            </div>
          )}
        </div>
      </div>

      {/* Trade Result Card */}
      <TradeResultCard
        isVisible={resultCard.isVisible}
        isWin={resultCard.isWin}
        profit={resultCard.profit}
        strategy={resultCard.strategy}
        onClose={() => setResultCard({ ...resultCard, isVisible: false })}
        autoCloseDelay={4000}
      />

      {/* Notification */}
      {notification && (
        <div className={`${styles.notification} ${notification.type === 'green' ? '' : notification.type === 'blue' ? styles.blue : styles.yellow}`}>
          <div className={styles.notificationDot}></div>
          {notification.message}
        </div>
      )}
    </div>
  )
}
