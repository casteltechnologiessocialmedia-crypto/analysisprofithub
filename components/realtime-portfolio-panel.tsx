"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Wallet, DollarSign, AlertCircle, RefreshCw } from "lucide-react"

interface PortfolioPosition {
  id: string
  market: string
  contractType: string
  entryPrice: number
  currentPrice: number
  quantity: number
  stake: number
  unrealizedPL: number
  unrealizedPLPercent: number
  entryTime: number
  status: "open" | "closing" | "closed"
}

interface PortfolioStats {
  totalBalance: number
  totalEquity: number
  usedMargin: number
  availableMargin: number
  marginLevel: number
  totalProfitLoss: number
  totalProfitLossPercent: number
  dailyProfitLoss: number
  openPositions: number
  closedToday: number
  winRate: number
}

interface RealTimePortfolioPanelProps {
  balance?: number
  currency?: string
  positions?: PortfolioPosition[]
  theme?: "light" | "dark"
  onRefresh?: () => Promise<void>
  isLoading?: boolean
}

export function RealTimePortfolioPanel({
  balance = 1000,
  currency = "USD",
  positions = [],
  theme = "dark",
  onRefresh,
  isLoading = false,
}: RealTimePortfolioPanelProps) {
  const [stats, setStats] = useState<PortfolioStats>({
    totalBalance: balance,
    totalEquity: balance,
    usedMargin: 0,
    availableMargin: balance,
    marginLevel: 100,
    totalProfitLoss: 0,
    totalProfitLossPercent: 0,
    dailyProfitLoss: 0,
    openPositions: 0,
    closedToday: 0,
    winRate: 0,
  })

  const [refreshing, setRefreshing] = useState(false)

  // Calculate portfolio stats from positions
  useEffect(() => {
    let totalUnrealizedPL = 0
    let usedMargin = 0
    let openCount = 0
    let winCount = 0

    positions.forEach((position) => {
      if (position.status === "open" || position.status === "closing") {
        totalUnrealizedPL += position.unrealizedPL
        usedMargin += position.stake
        openCount++
        if (position.unrealizedPL > 0) {
          winCount++
        }
      }
    })

    const totalEquity = balance + totalUnrealizedPL
    const availableMargin = Math.max(0, balance - usedMargin)
    const marginLevel = usedMargin > 0 ? (totalEquity / usedMargin) * 100 : 100

    setStats({
      totalBalance: balance,
      totalEquity,
      usedMargin,
      availableMargin,
      marginLevel,
      totalProfitLoss: totalUnrealizedPL,
      totalProfitLossPercent: balance > 0 ? (totalUnrealizedPL / balance) * 100 : 0,
      dailyProfitLoss: totalUnrealizedPL,
      openPositions: openCount,
      closedToday: positions.filter((p) => p.status === "closed").length,
      winRate: openCount > 0 ? (winCount / openCount) * 100 : 0,
    })
  }, [balance, positions])

  const handleRefresh = useCallback(async () => {
    if (onRefresh && !refreshing) {
      setRefreshing(true)
      try {
        await onRefresh()
      } catch (error) {
        console.error("[v0] Portfolio refresh failed:", error)
      } finally {
        setRefreshing(false)
      }
    }
  }, [onRefresh, refreshing])

  const isNegativeEquity = stats.totalEquity < stats.totalBalance * 0.5
  const isCriticalMargin = stats.marginLevel < 150

  return (
    <div className="space-y-4">
      {/* Alert Section */}
      {isCriticalMargin && (
        <Card className={`border-2 ${theme === "dark" ? "bg-red-500/10 border-red-500/50" : "bg-red-50 border-red-300"}`}>
          <CardContent className="p-3 flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 shrink-0 ${theme === "dark" ? "text-red-400" : "text-red-600"}`} />
            <div>
              <p className={`text-sm font-semibold ${theme === "dark" ? "text-red-300" : "text-red-700"}`}>
                Low Margin Warning
              </p>
              <p className={`text-xs mt-1 ${theme === "dark" ? "text-red-400/80" : "text-red-600/80"}`}>
                Margin level at {stats.marginLevel.toFixed(1)}%. Consider closing positions.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Balance Card */}
        <Card
          className={`${
            theme === "dark"
              ? "bg-[#0a0e27]/50 border-blue-500/20"
              : "bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200"
          }`}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Balance</p>
              <Wallet className={`w-4 h-4 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
            </div>
            <p className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              {stats.totalBalance.toFixed(2)} {currency}
            </p>
          </CardContent>
        </Card>

        {/* Equity Card */}
        <Card
          className={`${
            isNegativeEquity
              ? theme === "dark"
                ? "bg-red-500/10 border-red-500/30"
                : "bg-red-50 border-red-200"
              : theme === "dark"
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-emerald-50 border-emerald-200"
          }`}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Equity</p>
              <DollarSign className={`w-4 h-4 ${isNegativeEquity ? "text-red-500" : "text-emerald-500"}`} />
            </div>
            <p className={`text-lg font-bold ${isNegativeEquity ? "text-red-400" : "text-emerald-400"}`}>
              {stats.totalEquity.toFixed(2)} {currency}
            </p>
          </CardContent>
        </Card>

        {/* Profit/Loss Card */}
        <Card
          className={`${
            stats.totalProfitLoss >= 0
              ? theme === "dark"
                ? "bg-green-500/10 border-green-500/30"
                : "bg-green-50 border-green-200"
              : theme === "dark"
                ? "bg-red-500/10 border-red-500/30"
                : "bg-red-50 border-red-200"
          }`}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>P/L Today</p>
              {stats.totalProfitLoss >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
            <p className={`text-lg font-bold ${stats.totalProfitLoss >= 0 ? "text-green-400" : "text-red-400"}`}>
              {stats.totalProfitLoss >= 0 ? "+" : ""} {stats.totalProfitLoss.toFixed(2)} {currency}
            </p>
            <p className={`text-xs mt-1 ${stats.totalProfitLoss >= 0 ? "text-green-400" : "text-red-400"}`}>
              {stats.totalProfitLossPercent >= 0 ? "+" : ""} {stats.totalProfitLossPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        {/* Margin Level Card */}
        <Card
          className={`${
            isCriticalMargin
              ? theme === "dark"
                ? "bg-red-500/10 border-red-500/30"
                : "bg-red-50 border-red-200"
              : theme === "dark"
                ? "bg-orange-500/10 border-orange-500/30"
                : "bg-orange-50 border-orange-200"
          }`}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Margin</p>
              <AlertCircle
                className={`w-4 h-4 ${isCriticalMargin ? "text-red-500" : "text-orange-500"}`}
              />
            </div>
            <p className={`text-lg font-bold ${isCriticalMargin ? "text-red-400" : "text-orange-400"}`}>
              {stats.marginLevel.toFixed(0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Margin Detail Section */}
      <Card className={`${theme === "dark" ? "bg-[#0a0e27]/50 border-blue-500/20" : "bg-gray-50 border-gray-200"}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Margin Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2 text-xs">
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>Used Margin</span>
              <span className={theme === "dark" ? "text-white" : "text-gray-900"}>
                {stats.usedMargin.toFixed(2)} {currency}
              </span>
            </div>
            <Progress
              value={(stats.usedMargin / stats.totalBalance) * 100}
              className="h-2"
            />
          </div>
          <div>
            <div className="flex justify-between mb-2 text-xs">
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>Available</span>
              <span className={theme === "dark" ? "text-white" : "text-gray-900"}>
                {stats.availableMargin.toFixed(2)} {currency}
              </span>
            </div>
            <Progress
              value={(stats.availableMargin / stats.totalBalance) * 100}
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Positions Summary */}
      <Card className={`${theme === "dark" ? "bg-[#0a0e27]/50 border-blue-500/20" : "bg-gray-50 border-gray-200"}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Positions ({stats.openPositions})</CardTitle>
            <button
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
              className={`p-1.5 rounded hover:bg-opacity-50 transition ${
                theme === "dark" ? "hover:bg-blue-500/20" : "hover:bg-gray-200"
              }`}
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""} ${
                  theme === "dark" ? "text-blue-400" : "text-blue-600"
                }`}
              />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {positions.length === 0 ? (
            <p className={`text-xs text-center py-4 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
              No open positions
            </p>
          ) : (
            positions.map((position) => (
              <div
                key={position.id}
                className={`p-3 rounded-lg border ${
                  theme === "dark"
                    ? "bg-[#0f1629]/50 border-blue-500/20"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <p className={`text-xs font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {position.market} - {position.contractType}
                    </p>
                    <p className={`text-xs mt-1 ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                      Stake: {position.stake.toFixed(2)} {currency}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-xs font-semibold ${
                        position.unrealizedPL >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {position.unrealizedPL >= 0 ? "+" : ""} {position.unrealizedPL.toFixed(2)}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] mt-1 ${
                        position.status === "open"
                          ? "border-blue-500/50 text-blue-400"
                          : position.status === "closing"
                            ? "border-yellow-500/50 text-yellow-400"
                            : "border-gray-500/50 text-gray-400"
                      }`}
                    >
                      {position.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Session Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card className={`${theme === "dark" ? "bg-[#0a0e27]/50 border-blue-500/20" : "bg-gray-50 border-gray-200"}`}>
          <CardContent className="p-3">
            <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Open Positions</p>
            <p className={`text-lg font-bold mt-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              {stats.openPositions}
            </p>
          </CardContent>
        </Card>

        <Card className={`${theme === "dark" ? "bg-[#0a0e27]/50 border-blue-500/20" : "bg-gray-50 border-gray-200"}`}>
          <CardContent className="p-3">
            <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Closed Today</p>
            <p className={`text-lg font-bold mt-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              {stats.closedToday}
            </p>
          </CardContent>
        </Card>

        <Card className={`${theme === "dark" ? "bg-[#0a0e27]/50 border-blue-500/20" : "bg-gray-50 border-gray-200"}`}>
          <CardContent className="p-3">
            <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Win Rate</p>
            <p className={`text-lg font-bold mt-1 text-emerald-400`}>{stats.winRate.toFixed(0)}%</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
