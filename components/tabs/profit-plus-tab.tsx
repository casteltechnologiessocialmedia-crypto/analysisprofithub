"use client"

import React, { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Analysis } from "@/lib/analysis-engine"
import { ProfitPlusEngine, type TradingSignal, type StrategyAnalysis } from "@/lib/profit-plus-engine"
import { ProfitPlusAutoTrading, type TradeExecution } from "@/lib/profit-plus-auto-trading"
import { submitTradeResult, formatTradeForSubmission } from "@/lib/trade-result-submitter"

interface ProfitPlusTabProps {
  analysis?: Analysis
  currentDigit: number
  currentPrice: number
  recentDigits: number[]
  theme: "light" | "dark"
  symbol: string
  balance: number
  token: string
}

export function ProfitPlusTab({
  analysis,
  currentDigit,
  currentPrice,
  recentDigits,
  theme,
  symbol,
  balance,
  token,
}: ProfitPlusTabProps) {
  const [strategies, setStrategies] = useState<StrategyAnalysis[]>([])
  const [highProbabilitySignals, setHighProbabilitySignals] = useState<TradingSignal[]>([])
  const [recommendedTrade, setRecommendedTrade] = useState<TradingSignal | null>(null)
  const [autoTrading, setAutoTrading] = useState(false)
  const [targetProfit, setTargetProfit] = useState(50)
  const [maxStakePercentage, setMaxStakePercentage] = useState(20)
  const [tradeHistory, setTradeHistory] = useState<TradeExecution[]>([])
  const [currentBalance, setCurrentBalance] = useState(balance)
  const [totalProfit, setTotalProfit] = useState(0)
  const [winRate, setWinRate] = useState(0)
  const [excludedDigits, setExcludedDigits] = useState<number[]>([])
  const [logs, setLogs] = useState<string[]>([])

  const engineRef = useRef(new ProfitPlusEngine())
  const autoTradingRef = useRef(
    new ProfitPlusAutoTrading({
      targetProfit,
      maxStakePercentage: Math.min(maxStakePercentage, 20),
    })
  )
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const addLog = (message: string, type: "info" | "success" | "warning" | "error" = "info") => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`].slice(-50))
  }

  // Analyze market on mount and when data changes
  useEffect(() => {
    if (!analysis || recentDigits.length === 0) return

    const engine = engineRef.current
    const allStrategies = engine.analyzeMarket(analysis, recentDigits)
    setStrategies(allStrategies)

    const highProb = engine.getHighProbabilitySignals(allStrategies)
    setHighProbabilitySignals(highProb)

    const recommended = engine.getRecommendedTrade(highProb)
    setRecommendedTrade(recommended)

    addLog(`Analyzed ${allStrategies.length} strategies - ${highProb.length} high probability signals found`)
  }, [analysis, recentDigits])

  // Setup auto-trading refresh
  useEffect(() => {
    if (!autoTrading) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
      return
    }

    addLog("Auto-trading enabled - 60 second refresh rate started")

    refreshIntervalRef.current = setInterval(() => {
      if (!autoTradingRef.current.getConfig().isEnabled) return

      // Check if should skip this tick
      if (autoTradingRef.current.shouldSkipTick(recentDigits)) {
        addLog("Tick skipped - pattern matched", "warning")
        return
      }

      // Check if should pause
      if (autoTradingRef.current.shouldPause(totalProfit)) {
        setAutoTrading(false)
        addLog("Auto-trading paused - Target reached or max losses exceeded", "success")
        return
      }

      // Get recommended trade
      if (recommendedTrade && recommendedTrade.power >= 55) {
        executeAutoTrade(recommendedTrade)
      } else {
        addLog("No suitable signal found for this cycle", "warning")
      }
    }, 60000)

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [autoTrading, recommendedTrade, totalProfit])

  const executeAutoTrade = (signal: TradingSignal) => {
    const autoTrader = autoTradingRef.current
    const engine = engineRef.current

    const multiplier = engine.calculateMartingaleMultiplier(
      autoTrader.getAccountState(currentBalance, balance).consecutiveLosses
    )

    const execution = autoTrader.executeAutoTrade(signal, currentBalance, multiplier)

    addLog(
      `Auto-trade executed: ${execution.tradeType} | Stake: $${execution.stake.toFixed(2)} | Multiplier: ${multiplier}x`,
      "info"
    )

    // Simulate trade result (in real app, this would come from Deriv)
    const isWin = Math.random() > 0.5
    const profit = isWin ? execution.stake * 0.9 : -execution.stake

    autoTrader.recordTradeResult(execution.id, isWin, profit)

    const newBalance = currentBalance + profit
    setCurrentBalance(newBalance)

    const state = autoTrader.getAccountState(newBalance, balance)
    setTotalProfit(state.totalProfit)
    setWinRate(state.winRate)

    const history = autoTrader.getTradeHistory()
    setTradeHistory(history)

    addLog(
      `Trade result: ${isWin ? "WIN" : "LOSS"} | Profit: $${profit.toFixed(2)} | Balance: $${newBalance.toFixed(2)}`,
      isWin ? "success" : "error"
    )

    // Submit to API
    if (token) {
      const strategyName = `ProfitPlus-${signal.type}`
      const tradeData = formatTradeForSubmission(token, strategyName, symbol, profit, execution.stake)

      submitTradeResult(tradeData, {
        onSuccess: () => {
          addLog("Trade posted to database", "success")
        },
        onError: (error) => {
          addLog(`Failed to post trade: ${error.message}`, "error")
        },
      })
    }
  }

  const toggleAutoTrading = () => {
    setAutoTrading(!autoTrading)
    if (!autoTrading) {
      autoTradingRef.current.toggleAutoTrading(true)
      addLog("Auto-trading started", "info")
    } else {
      autoTradingRef.current.pauseAutoTrading()
      addLog("Auto-trading paused", "warning")
    }
  }

  const handleExcludeDigit = (digit: number) => {
    setExcludedDigits((prev) => {
      if (prev.includes(digit)) {
        return prev.filter((d) => d !== digit)
      }
      return [...prev, digit]
    })
  }

  const clearHistory = () => {
    autoTradingRef.current.clearHistory()
    setTradeHistory([])
    setTotalProfit(0)
    setWinRate(0)
    setCurrentBalance(balance)
    addLog("History cleared", "info")
  }

  return (
    <div className={`w-full space-y-4 ${theme === "dark" ? "bg-slate-950 text-white" : "bg-white text-slate-900"}`}>
      <Tabs defaultValue="signals" className="w-full">
        <TabsList className="grid w-full grid-cols-4 gap-2">
          <TabsTrigger value="signals">Signals</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Signals Tab */}
        <TabsContent value="signals" className="space-y-4">
          <Card className={`p-4 ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-slate-50"}`}>
            <h3 className="font-semibold mb-4">Recommended Trade</h3>
            {recommendedTrade ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">{recommendedTrade.type}</span>
                  <Badge className="bg-green-500">{recommendedTrade.power.toFixed(0)}% Power</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Probability: {recommendedTrade.probability.toFixed(1)}%</div>
                  <div>Entry: {recommendedTrade.entry}</div>
                  <div>Zone: {recommendedTrade.zone.zone}</div>
                  <div>Confidence: {recommendedTrade.zone.confidence}%</div>
                </div>
                <Button
                  onClick={() => executeAutoTrade(recommendedTrade)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Execute Trade
                </Button>
              </div>
            ) : (
              <p className="text-yellow-600">No high-probability signals available</p>
            )}
          </Card>

          <Card className={`p-4 ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-slate-50"}`}>
            <h3 className="font-semibold mb-4">High Probability Signals ({highProbabilitySignals.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {highProbabilitySignals.slice(0, 10).map((signal, i) => (
                <div key={i} className={`p-2 rounded border ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{signal.type}</span>
                    <Badge className={signal.power >= 75 ? "bg-green-500" : "bg-blue-500"}>
                      {signal.power.toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Prob: {signal.probability.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          {strategies.map((strategy, i) => (
            <Card key={i} className={`p-4 ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-slate-50"}`}>
              <h4 className="font-semibold mb-3">{strategy.strategy}</h4>
              <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                <div>
                  <div className="text-gray-500">Trend</div>
                  <div className="font-medium">{strategy.marketTrend}</div>
                </div>
                <div>
                  <div className="text-gray-500">Volatility</div>
                  <div className="font-medium">{(strategy.volatility * 100).toFixed(0)}%</div>
                </div>
                <div>
                  <div className="text-gray-500">Signals</div>
                  <div className="font-medium">{strategy.signals.length}</div>
                </div>
              </div>
              {strategy.signals.length > 0 && (
                <div className="space-y-2">
                  {strategy.signals.map((signal, j) => (
                    <div key={j} className={`p-2 rounded text-xs ${theme === "dark" ? "bg-slate-800" : "bg-white"}`}>
                      <div className="flex justify-between">
                        <span>{signal.type}</span>
                        <span className="font-mono">{signal.power.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </TabsContent>

        {/* Trading Tab */}
        <TabsContent value="trading" className="space-y-4">
          <Card className={`p-4 ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-slate-50"}`}>
            <h3 className="font-semibold mb-4">Account Status</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-gray-500 text-sm">Balance</div>
                <div className="text-2xl font-bold">${currentBalance.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">Total Profit</div>
                <div className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                  ${totalProfit.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">Win Rate</div>
                <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">Max Stake (20%)</div>
                <div className="text-2xl font-bold">${(currentBalance * 0.2).toFixed(2)}</div>
              </div>
            </div>
          </Card>

          <Card className={`p-4 ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-slate-50"}`}>
            <h3 className="font-semibold mb-4">Auto Trading Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Target Profit Stop (TPS)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={targetProfit}
                    onChange={(e) => setTargetProfit(Number(e.target.value))}
                    className={`flex-1 px-3 py-2 rounded border ${theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white"}`}
                    disabled={autoTrading}
                  />
                  <span className="text-gray-500">$</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Max Stake Percentage</label>
                <div className="flex gap-2">
                  <input
                    type="range"
                    min="5"
                    max="20"
                    value={maxStakePercentage}
                    onChange={(e) => setMaxStakePercentage(Number(e.target.value))}
                    className="flex-1"
                    disabled={autoTrading}
                  />
                  <span className="text-gray-500 w-12">{maxStakePercentage}%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Exclude Digits</label>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }, (_, i) => i).map((digit) => (
                    <button
                      key={digit}
                      onClick={() => handleExcludeDigit(digit)}
                      className={`py-2 rounded font-medium transition-colors ${
                        excludedDigits.includes(digit)
                          ? "bg-red-500 text-white"
                          : theme === "dark"
                            ? "bg-slate-800 hover:bg-slate-700"
                            : "bg-slate-100 hover:bg-slate-200"
                      }`}
                    >
                      {digit}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={toggleAutoTrading}
                className={`w-full py-6 text-lg font-bold ${
                  autoTrading ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {autoTrading ? "PAUSE AUTO TRADING" : "START AUTO TRADING"}
              </Button>

              <div className="text-sm text-gray-500 text-center">
                {autoTrading ? "🟢 Auto-trading active - 60 second refresh rate" : "Refresh rate: 60 seconds"}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card className={`p-4 ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-slate-50"}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Trade History</h3>
              <Button onClick={clearHistory} variant="outline" size="sm">
                Clear History
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tradeHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No trades yet</p>
              ) : (
                tradeHistory.map((trade, i) => (
                  <div
                    key={trade.id}
                    className={`p-3 rounded border ${
                      trade.status === "WIN"
                        ? theme === "dark"
                          ? "bg-green-950 border-green-800"
                          : "bg-green-50 border-green-200"
                        : theme === "dark"
                          ? "bg-red-950 border-red-800"
                          : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-medium">{trade.tradeType}</span>
                        <span className="text-gray-500 ml-2">Stake: ${trade.stake.toFixed(2)}</span>
                      </div>
                      <span className={`font-bold ${trade.status === "WIN" ? "text-green-600" : "text-red-600"}`}>
                        {trade.status === "WIN" ? "+" : "-"}${Math.abs(trade.profit).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className={`p-4 ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-slate-50"}`}>
            <h3 className="font-semibold mb-4">Activity Log</h3>
            <div className="space-y-1 max-h-64 overflow-y-auto text-xs font-mono">
              {logs.map((log, i) => (
                <div key={i} className="text-gray-500">
                  {log}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
