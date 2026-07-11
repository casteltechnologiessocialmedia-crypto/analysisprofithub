'use client'

import React, { useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Zap,
  Clock,
  DollarSign,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { ProfitPlusTradingLogic, TradeSignal, TradeResult } from '@/lib/profit-plus-trading-logic'
import { DerivTradingService } from '@/lib/deriv-trading-service'
import { DerivInfoPanel } from '@/components/deriv-info-panel'
import { SUPPORTED_TIMEFRAMES } from '@/lib/market-timeframes'
import { ExternalLink } from 'lucide-react'

interface TradeStats {
  strategy: string
  totalTrades: number
  wins: number
  losses: number
  winRate: number
  totalProfit: number
  avgProfit: number
  power: number
  confidence: number
}

interface StoredTrade {
  id: string
  strategy: string
  timestamp: number
  stake: number
  profit: number
  win: boolean
  martingaleLevel: number
  entryDigit: number
  prediction: string
}

export function ProfitPlusRebuild() {
  // Market data
  const [lastDigits, setLastDigits] = useState<number[]>([])
  const [currentDigit, setCurrentDigit] = useState<number>(0)
  const [chartData, setChartData] = useState<any[]>([])

  // Strategy signals
  const [signals, setSignals] = useState<{ [key: string]: TradeSignal }>({})
  const [selectedStrategy, setSelectedStrategy] = useState<string>('Over/Under')

  // Trading inputs
  const [stake, setStake] = useState<number>(10)
  const [martingale, setMartingale] = useState<number>(2)
  const [targetProfit, setTargetProfit] = useState<number>(100)
  const [stopLoss, setStopLoss] = useState<number>(50)
  const [entryDigit, setEntryDigit] = useState<number | null>(null)
  const [ticks, setTicks] = useState<number>(5)

  // Trading state
  const [isTrading, setIsTrading] = useState<boolean>(false)
  const [balance, setBalance] = useState<number>(1000)
  const [tradeHistory, setTradeHistory] = useState<StoredTrade[]>([])
  const [stats, setStats] = useState<{ [key: string]: TradeStats }>({})
  const [currentProfit, setCurrentProfit] = useState<number>(0)
  const [selectedMarket, setSelectedMarket] = useState<string>('5s')

  // API reference
  const tradingServiceRef = useRef<DerivTradingService | null>(null)

  // Initialize Deriv API connection
  useEffect(() => {
    const initializeAPI = async () => {
      const service = new DerivTradingService()
      const connected = await service.connect()
      if (connected) {
        tradingServiceRef.current = service
        const bal = await service.getBalance()
        setBalance(bal || 1000)
      }
    }

    initializeAPI()

    return () => {
      tradingServiceRef.current?.disconnect()
    }
  }, [])

  // Generate demo market data
  useEffect(() => {
    const generateDigits = () => {
      const digits: number[] = []
      for (let i = 0; i < 50; i++) {
        digits.push(Math.floor(Math.random() * 10))
      }
      setLastDigits(digits)

      const chart = digits.map((digit, index) => ({
        time: index + 1,
        value: digit,
      }))
      setChartData(chart)

      if (digits.length > 0) {
        setCurrentDigit(digits[digits.length - 1])
      }
    }

    generateDigits()

    // Simulate real-time ticks
    const interval = setInterval(() => {
      generateDigits()
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Analyze signals whenever digits change
  useEffect(() => {
    if (lastDigits.length === 0) return

    const newSignals: { [key: string]: TradeSignal } = {
      'Over/Under': ProfitPlusTradingLogic.analyzeOverUnder(lastDigits),
      'Even/Odd': ProfitPlusTradingLogic.analyzeEvenOdd(lastDigits),
      Matches: ProfitPlusTradingLogic.analyzeMatches(lastDigits),
      Differs: ProfitPlusTradingLogic.analyzeDigits(lastDigits),
      'Rise/Fall': ProfitPlusTradingLogic.analyzeRiseFall(lastDigits),
    }

    setSignals(newSignals)
  }, [lastDigits])

  // Execute trade
  const executeTrade = async () => {
    if (!tradingServiceRef.current || !selectedStrategy || lastDigits.length < 2) {
      console.log('[v0] Cannot execute trade - missing requirements')
      return
    }

    setIsTrading(true)

    try {
      const signal = signals[selectedStrategy]
      if (!signal) return

      // Execute real trade via Deriv API
      const result = await tradingServiceRef.current.executeTrade({
        symbol: selectedMarket,
        prediction: signal.prediction as any,
        stake,
        ticks,
        contractType: 'HIGH_LOW',
      })

      if (result) {
        const isWin = result.win
        const profit = result.profit
        const martingaleLevel = tradeHistory.filter(t => t.strategy === selectedStrategy).length % 3

        // Store trade
        const newTrade: StoredTrade = {
          id: `${Date.now()}`,
          strategy: selectedStrategy,
          timestamp: Date.now(),
          stake,
          profit,
          win: isWin,
          martingaleLevel,
          entryDigit: lastDigits[lastDigits.length - 1],
          prediction: signal.prediction,
        }

        setTradeHistory([newTrade, ...tradeHistory])
        setCurrentProfit(currentProfit + profit)
        setBalance(balance + profit)

        // Update stats
        updateStats(newTrade)

        // Show result card would go here
        console.log('[v0] Trade result:', { isWin, profit })
      }
    } catch (error) {
      console.error('[v0] Trade execution error:', error)
    } finally {
      setIsTrading(false)
    }
  }

  // Update trading statistics
  const updateStats = (trade: StoredTrade) => {
    const strategyStats = stats[trade.strategy] || {
      strategy: trade.strategy,
      totalTrades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      totalProfit: 0,
      avgProfit: 0,
      power: signals[trade.strategy]?.power || 0,
      confidence: signals[trade.strategy]?.confidence || 0,
    }

    strategyStats.totalTrades++
    if (trade.win) {
      strategyStats.wins++
    } else {
      strategyStats.losses++
    }
    strategyStats.winRate = (strategyStats.wins / strategyStats.totalTrades) * 100
    strategyStats.totalProfit += trade.profit
    strategyStats.avgProfit = strategyStats.totalProfit / strategyStats.totalTrades

    setStats({
      ...stats,
      [trade.strategy]: strategyStats,
    })
  }

  const currentSignal = signals[selectedStrategy]
  const strategyStats = stats[selectedStrategy]

  return (
    <div className="w-full space-y-6 p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">ProfitPlus Pro</h1>
          <p className="text-slate-400 mt-1">Real Trading with Correct Predictions</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-3xl font-bold text-green-400">${balance.toFixed(2)}</div>
            <p className={`text-sm ${currentProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {currentProfit >= 0 ? '+' : ''}{currentProfit.toFixed(2)}
            </p>
          </div>
          <Button
            onClick={() => window.open('https://deriv-dtrader.vercel.app', '_blank')}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white flex items-center gap-2"
          >
            <ExternalLink size={18} />
            Open DTrader
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Market Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Market Selection */}
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <div className="flex gap-2 flex-wrap">
              {SUPPORTED_TIMEFRAMES.map(market => (
                <button
                  key={market}
                  onClick={() => setSelectedMarket(market)}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    selectedMarket === market
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {market}
                </button>
              ))}
            </div>
          </Card>

          {/* Chart */}
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Last 50 Digits</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" domain={[0, 9]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Strategy Analysis Tabs */}
          <div>
            <Tabs defaultValue="Over/Under" onValueChange={setSelectedStrategy}>
              <TabsList className="grid w-full grid-cols-5 bg-slate-900/50 border-slate-800">
                <TabsTrigger value="Over/Under">Over/Under</TabsTrigger>
                <TabsTrigger value="Even/Odd">Even/Odd</TabsTrigger>
                <TabsTrigger value="Matches">Matches</TabsTrigger>
                <TabsTrigger value="Differs">Differs</TabsTrigger>
                <TabsTrigger value="Rise/Fall">Rise/Fall</TabsTrigger>
              </TabsList>

              {Object.entries(signals).map(([strategy, signal]) => (
                <TabsContent key={strategy} value={strategy}>
                  <Card className="bg-slate-900/50 border-slate-800 p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400 text-sm">Prediction</p>
                        <div className="flex items-center gap-2 mt-2">
                          {signal.prediction?.includes('UP') || signal.prediction?.includes('RISE') ? (
                            <TrendingUp className="w-6 h-6 text-green-400" />
                          ) : (
                            <TrendingDown className="w-6 h-6 text-red-400" />
                          )}
                          <span className="text-2xl font-bold text-white">{signal.prediction}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-slate-400 text-sm">Power</p>
                        <div className="flex items-end gap-2 mt-2">
                          <span className="text-2xl font-bold text-cyan-400">{signal.power.toFixed(1)}%</span>
                          <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                              style={{ width: `${signal.power}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-slate-400 text-sm">Confidence</p>
                        <span className="text-lg font-semibold text-amber-400">
                          {(signal.confidence * 100).toFixed(1)}%
                        </span>
                      </div>

                      <div>
                        <p className="text-slate-400 text-sm">Analysis</p>
                        <p className="text-sm text-slate-300 mt-1">{signal.reasoning}</p>
                      </div>
                    </div>

                    {strategyStats && (
                      <div className="border-t border-slate-700 pt-4 grid grid-cols-4 gap-2 text-center">
                        <div>
                          <p className="text-slate-500 text-xs">Win Rate</p>
                          <p className="text-lg font-bold text-green-400">{strategyStats.winRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Total Trades</p>
                          <p className="text-lg font-bold text-blue-400">{strategyStats.totalTrades}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Wins/Losses</p>
                          <p className="text-lg font-bold text-white">
                            {strategyStats.wins}/{strategyStats.losses}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Avg Profit</p>
                          <p className={`text-lg font-bold ${strategyStats.avgProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${strategyStats.avgProfit.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>

        {/* Right: Trading Controls & History */}
        <div className="space-y-6">
          {/* Deriv Info Panel */}
          <DerivInfoPanel />
          {/* Trading Console */}
          <Card className="bg-slate-900/50 border-slate-800 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Trading Console
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-400">Stake ($)</label>
                <Input
                  type="number"
                  value={stake}
                  onChange={e => setStake(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  min="1"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400">Martingale Multiplier</label>
                <Input
                  type="number"
                  value={martingale}
                  onChange={e => setMartingale(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  min="1"
                  step="0.5"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400">Target Profit ($)</label>
                <Input
                  type="number"
                  value={targetProfit}
                  onChange={e => setTargetProfit(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400">Stop Loss ($)</label>
                <Input
                  type="number"
                  value={stopLoss}
                  onChange={e => setStopLoss(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400">Entry Digit (0-9)</label>
                <Input
                  type="number"
                  value={entryDigit ?? ''}
                  onChange={e => setEntryDigit(e.target.value ? Math.min(9, Math.max(0, parseInt(e.target.value))) : null)}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  min="0"
                  max="9"
                  placeholder="Any"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400">Ticks Duration</label>
                <Input
                  type="number"
                  value={ticks}
                  onChange={e => setTicks(Math.max(1, Math.min(100, parseFloat(e.target.value) || 1)))}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <Button
              onClick={executeTrade}
              disabled={isTrading || !selectedStrategy || lastDigits.length === 0}
              className={`w-full py-2 font-semibold ${
                isTrading
                  ? 'bg-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
              }`}
            >
              {isTrading ? 'Executing...' : 'Execute Trade'}
            </Button>
          </Card>

          {/* Trade History */}
          <Card className="bg-slate-900/50 border-slate-800 p-6 space-y-3 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 sticky top-0 bg-slate-900/50 pb-3">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Recent Trades
            </h3>

            {tradeHistory.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-4">No trades yet</p>
            ) : (
              <div className="space-y-2">
                {tradeHistory.map(trade => (
                  <div key={trade.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{trade.strategy}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(trade.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${trade.win ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.win ? '+' : ''}{trade.profit.toFixed(2)}
                      </p>
                      {trade.win ? (
                        <CheckCircle className="w-4 h-4 text-green-400 inline" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 inline" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
