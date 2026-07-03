'use client'

import { Eye, EyeOff, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface BalanceDisplayProps {
  totalBalance: number
  availableBalance: number
  pendingBalance: number
  change24h: number
  percentChange24h: number
  currency?: string
  isLoading?: boolean
  onRefresh?: () => Promise<void>
  showHidden?: boolean
  className?: string
}

export function BalanceDisplay({
  totalBalance,
  availableBalance,
  pendingBalance,
  change24h,
  percentChange24h,
  currency = 'USD',
  isLoading = false,
  onRefresh,
  showHidden = false,
  className
}: BalanceDisplayProps) {
  const [hidden, setHidden] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const isPositive = change24h >= 0

  const handleRefresh = async () => {
    if (!onRefresh) return
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  return (
    <div className={cn(
      'rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 border border-slate-700',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-slate-300 font-medium">Total Balance</h3>
        <div className="flex gap-2">
          {showHidden && (
            <button
              onClick={() => setHidden(!hidden)}
              className="p-2 hover:bg-slate-700 rounded-lg transition"
            >
              {hidden ? (
                <EyeOff className="w-4 h-4 text-slate-400" />
              ) : (
                <Eye className="w-4 h-4 text-slate-400" />
              )}
            </button>
          )}
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
              className="p-2 hover:bg-slate-700 rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={cn(
                'w-4 h-4 text-slate-400 transition',
                refreshing && 'animate-spin'
              )} />
            </button>
          )}
        </div>
      </div>

      {/* Main Balance */}
      <div className="mb-6">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-10 bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 bg-slate-700 rounded w-1/3 animate-pulse" />
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold text-white">
                {hidden ? '••••••' : formatCurrency(totalBalance)}
              </span>
              <span className="text-sm text-slate-400">{currency}</span>
            </div>
            
            {/* Change Indicator */}
            <div className="flex items-center gap-2">
              <div className={cn(
                'flex items-center gap-1 text-sm font-medium',
                isPositive ? 'text-green-400' : 'text-red-400'
              )}>
                {isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {hidden ? '••••' : `${isPositive ? '+' : ''}${formatCurrency(change24h)}`}
              </div>
              <span className={cn(
                'text-xs',
                isPositive ? 'text-green-400' : 'text-red-400'
              )}>
                {hidden ? '••' : `${isPositive ? '+' : ''}${percentChange24h.toFixed(2)}%`}
              </span>
              <span className="text-xs text-slate-500">24h</span>
            </div>
          </>
        )}
      </div>

      {/* Balance Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        {/* Available */}
        <div className="rounded-lg bg-slate-800/50 p-4 border border-slate-700/50">
          <p className="text-xs text-slate-400 mb-2">Available</p>
          <p className="text-lg font-semibold text-white">
            {isLoading ? (
              <div className="h-6 bg-slate-700 rounded w-20 animate-pulse" />
            ) : hidden ? '••••••' : formatCurrency(availableBalance)}
          </p>
        </div>

        {/* Pending */}
        <div className="rounded-lg bg-slate-800/50 p-4 border border-slate-700/50">
          <p className="text-xs text-slate-400 mb-2">Pending</p>
          <p className="text-lg font-semibold text-white">
            {isLoading ? (
              <div className="h-6 bg-slate-700 rounded w-20 animate-pulse" />
            ) : hidden ? '••••••' : formatCurrency(pendingBalance)}
          </p>
        </div>
      </div>

      {/* Info */}
      {!hidden && (
        <p className="text-xs text-slate-500 mt-4">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      )}
    </div>
  )
}
