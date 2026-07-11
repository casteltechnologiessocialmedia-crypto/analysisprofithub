'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { ExternalLink, Info, AlertCircle, CheckCircle2 } from 'lucide-react'
import { DERIV_WORKFLOWS } from '@/lib/deriv-workflows'

export function DerivInfoPanel() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700 p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2 text-slate-300 hover:text-white transition">
          <Info size={18} />
          <span className="font-semibold">Deriv Trading Guide</span>
        </div>
        <span className="text-xs text-slate-500">{isExpanded ? '−' : '+'}</span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4 text-sm">
          {/* Documentation Link */}
          <div>
            <a
              href={DERIV_WORKFLOWS.DOCUMENTATION}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition"
            >
              <ExternalLink size={16} />
              Official Deriv Workflows Documentation
            </a>
          </div>

          {/* Supported Timeframes */}
          <div className="bg-slate-800/50 p-3 rounded">
            <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
              <CheckCircle2 size={16} />
              Supported Timeframes
            </h4>
            <div className="grid grid-cols-2 gap-1 text-slate-300">
              {DERIV_WORKFLOWS.VALID_TIMEFRAMES.map(tf => (
                <div key={tf} className="text-xs">
                  ✓ {tf}
                </div>
              ))}
            </div>
          </div>

          {/* Removed Timeframes */}
          <div className="bg-red-900/20 p-3 rounded border border-red-800">
            <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
              <AlertCircle size={16} />
              Removed Unsupported Timeframes
            </h4>
            <div className="space-y-1 text-xs text-red-300">
              {DERIV_WORKFLOWS.INVALID_TIMEFRAMES.map(tf => (
                <div key={tf}>
                  ✗ {tf} - Not supported by Deriv API
                </div>
              ))}
            </div>
            <p className="text-xs text-red-400 mt-2">
              These timeframes have been removed from the platform to ensure reliable trading execution.
            </p>
          </div>

          {/* Supported Markets */}
          <div className="bg-slate-800/50 p-3 rounded">
            <h4 className="font-semibold text-green-400 mb-2">Supported Markets</h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div>
                <strong>Volatility Indices:</strong>
                <div className="ml-2">{DERIV_WORKFLOWS.SUPPORTED_MARKETS.VOLATILITY_INDICES.map(m => m.symbol).join(', ')}</div>
              </div>
              <div>
                <strong>Synthetic Indices:</strong>
                <div className="ml-2">{DERIV_WORKFLOWS.SUPPORTED_MARKETS.SYNTHETIC_INDICES.map(m => m.symbol).join(', ')}</div>
              </div>
              <div>
                <strong>Forex Pairs:</strong>
                <div className="ml-2">{DERIV_WORKFLOWS.SUPPORTED_MARKETS.FOREX.map(m => m.symbol).join(', ')}</div>
              </div>
            </div>
          </div>

          {/* DTrader Info */}
          <div className="bg-orange-900/20 p-3 rounded border border-orange-800">
            <h4 className="font-semibold text-orange-400 mb-2">DTrader Platform</h4>
            <p className="text-xs text-orange-200 mb-2">
              {DERIV_WORKFLOWS.DTRADER.DESCRIPTION}
            </p>
            <a
              href={DERIV_WORKFLOWS.DTRADER.URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition"
            >
              <ExternalLink size={14} />
              Open DTrader Platform
            </a>
          </div>

          {/* API Rules */}
          <div className="bg-slate-800/50 p-3 rounded text-xs text-slate-300">
            <h4 className="font-semibold text-slate-200 mb-1">Trading Limits</h4>
            <ul className="space-y-1">
              <li>Min Stake: ${DERIV_WORKFLOWS.TRADING_RULES.MIN_STAKE}</li>
              <li>Max Stake: ${DERIV_WORKFLOWS.TRADING_RULES.MAX_STAKE}</li>
              <li>Min Duration: {DERIV_WORKFLOWS.TRADING_RULES.MIN_DURATION}s</li>
              <li>Payout Range: {DERIV_WORKFLOWS.TRADING_RULES.PAYOUT_RANGE[0]}x - {DERIV_WORKFLOWS.TRADING_RULES.PAYOUT_RANGE[1]}x</li>
            </ul>
          </div>
        </div>
      )}
    </Card>
  )
}
