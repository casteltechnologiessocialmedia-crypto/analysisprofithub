'use client'

import { useState } from 'react'
import { X, CheckCircle, AlertCircle, Loader2, Copy, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccountConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (credentials: ConnectionCredentials) => Promise<void>
  isLoading?: boolean
}

interface ConnectionCredentials {
  platform: string
  username: string
  apiKey: string
}

type ConnectionStep = 'select' | 'credentials' | 'confirming' | 'success' | 'error'

export function AccountConnectionModal({
  isOpen,
  onClose,
  onConnect,
  isLoading = false
}: AccountConnectionModalProps) {
  const [step, setStep] = useState<ConnectionStep>('select')
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [credentials, setCredentials] = useState({ username: '', apiKey: '' })
  const [showApiKey, setShowApiKey] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const platforms = [
    { id: 'alpaca', name: 'Alpaca', icon: '📈' },
    { id: 'binance', name: 'Binance', icon: '🔗' },
    { id: 'kraken', name: 'Kraken', icon: '⚡' },
    { id: 'coinbase', name: 'Coinbase', icon: '💰' }
  ]

  const handleSelectPlatform = (platformId: string) => {
    setSelectedPlatform(platformId)
    setStep('credentials')
    setError('')
  }

  const handleConnect = async () => {
    if (!credentials.username || !credentials.apiKey) {
      setError('Please fill in all fields')
      return
    }

    setStep('confirming')
    try {
      await onConnect({
        platform: selectedPlatform,
        username: credentials.username,
        apiKey: credentials.apiKey
      })
      setStep('success')
      setTimeout(() => {
        onClose()
        setStep('select')
        setCredentials({ username: '', apiKey: '' })
      }, 2000)
    } catch (err) {
      setStep('error')
      setError(err instanceof Error ? err.message : 'Connection failed')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Connect Account</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Step: Select Platform */}
        {step === 'select' && (
          <div className="space-y-4">
            <p className="text-slate-400 mb-4">Choose a trading platform to connect</p>
            <div className="grid grid-cols-2 gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => handleSelectPlatform(platform.id)}
                  className="p-4 rounded-xl border-2 border-slate-600 hover:border-indigo-500 bg-slate-800/50 hover:bg-slate-800 transition text-center"
                >
                  <div className="text-3xl mb-2">{platform.icon}</div>
                  <div className="text-sm font-medium text-white">{platform.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Enter Credentials */}
        {step === 'credentials' && (
          <div className="space-y-4">
            <p className="text-slate-400 mb-4">
              Enter your {platforms.find(p => p.id === selectedPlatform)?.name} credentials
            </p>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Username / Email
              </label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                placeholder="your@email.com"
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition"
              />
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={credentials.apiKey}
                  onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                  placeholder="sk_live_..."
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition pr-10"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex gap-2 p-3 rounded-lg bg-red-900/20 border border-red-700/50">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Info Box */}
            <div className="p-3 rounded-lg bg-indigo-900/20 border border-indigo-700/50">
              <p className="text-xs text-indigo-300">
                Your credentials are encrypted and never stored in plain text. They&apos;re used only to verify your account.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setStep('select')
                  setError('')
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition"
              >
                Back
              </button>
              <button
                onClick={handleConnect}
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step: Confirming */}
        {step === 'confirming' && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-300 font-medium">Verifying credentials...</p>
            <p className="text-sm text-slate-500 mt-2">This may take a moment</p>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
            <p className="text-white font-bold text-lg">Account Connected!</p>
            <p className="text-slate-400 text-sm mt-2">Redirecting...</p>
          </div>
        )}

        {/* Step: Error */}
        {step === 'error' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center py-6">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-white font-bold text-lg">Connection Failed</p>
              <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
            </div>
            <button
              onClick={() => {
                setStep('credentials')
                setError('')
              }}
              className="w-full px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
