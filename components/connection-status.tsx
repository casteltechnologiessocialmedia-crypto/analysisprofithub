'use client'

import { CheckCircle, AlertCircle, Clock, Loader2, RotateCcw, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConnectionStatusProps {
  platform: string
  status: 'connected' | 'connecting' | 'disconnected' | 'error'
  connectedAt?: string
  lastSync?: string
  onReconnect?: () => void
  onDisconnect?: () => void
  isLoading?: boolean
  error?: string
}

export function ConnectionStatus({
  platform,
  status,
  connectedAt,
  lastSync,
  onReconnect,
  onDisconnect,
  isLoading = false,
  error
}: ConnectionStatusProps) {
  const statusConfig = {
    connected: {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-700/50',
      label: 'Connected',
      labelColor: 'text-green-400'
    },
    connecting: {
      icon: Loader2,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-900/20',
      borderColor: 'border-indigo-700/50',
      label: 'Connecting...',
      labelColor: 'text-indigo-400'
    },
    disconnected: {
      icon: Clock,
      color: 'text-slate-500',
      bgColor: 'bg-slate-900/20',
      borderColor: 'border-slate-700/50',
      label: 'Not Connected',
      labelColor: 'text-slate-400'
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-900/20',
      borderColor: 'border-red-700/50',
      label: 'Connection Error',
      labelColor: 'text-red-400'
    }
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className={cn(
      'rounded-xl border p-4 transition',
      config.bgColor,
      config.borderColor
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon className={cn(
            'w-5 h-5',
            config.color,
            status === 'connecting' && 'animate-spin'
          )} />
          <div>
            <p className="text-sm font-medium text-white">{platform}</p>
            <p className={cn('text-xs', config.labelColor)}>{config.label}</p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          {status === 'disconnected' || status === 'error' ? (
            <button
              onClick={onReconnect}
              disabled={isLoading}
              className="p-1.5 hover:bg-indigo-600/30 rounded-lg transition disabled:opacity-50"
              title="Reconnect"
            >
              <RotateCcw className="w-4 h-4 text-indigo-400" />
            </button>
          ) : null}
          
          {status === 'connected' && (
            <button
              onClick={onDisconnect}
              disabled={isLoading}
              className="p-1.5 hover:bg-red-600/30 rounded-lg transition disabled:opacity-50"
              title="Disconnect"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* Details */}
      {status === 'connected' && (
        <div className="space-y-2 text-xs text-slate-400">
          {connectedAt && (
            <p>Connected: {new Date(connectedAt).toLocaleDateString()}</p>
          )}
          {lastSync && (
            <p>Last sync: {new Date(lastSync).toLocaleString()}</p>
          )}
        </div>
      )}

      {/* Error Message */}
      {status === 'error' && error && (
        <p className="text-xs text-red-400 mt-2">{error}</p>
      )}
    </div>
  )
}
