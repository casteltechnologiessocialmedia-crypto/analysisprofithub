"use client"

import React, { useEffect, useState } from "react"
import { Maximize2, RefreshCw, AlertCircle, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DTraderTabProps {
  theme?: "light" | "dark"
}

export function DTraderTab({ theme = "dark" }: DTraderTabProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [iframeKey, setIframeKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dtraderUrl, setDtraderUrl] = useState("https://deriv-dtrader.vercel.app")

  useEffect(() => {
    // Get auth token from sessionStorage (set by Deriv auth)
    const token = sessionStorage.getItem("deriv_token")
    
    if (token) {
      // Pass token to DTrader via URL parameter
      const url = new URL("https://deriv-dtrader.vercel.app")
      url.searchParams.append("token", token)
      setDtraderUrl(url.toString())
      console.log("[v0] DTrader token available, auto-login enabled")
    } else {
      console.log("[v0] No DTrader token found, manual login required")
    }

    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [iframeKey])

  const handleRefresh = () => {
    setIsLoading(true)
    setError(null)
    setIframeKey(prev => prev + 1)
  }

  const handleOpenInNewTab = () => {
    window.open(dtraderUrl, "_blank")
  }

  const handleLoginDirect = () => {
    // Open Deriv login in new tab, then return to this tab
    window.open("https://deriv-dtrader.vercel.app/login", "_blank", "width=500,height=700")
  }

  return (
    <div className={`w-full h-full flex flex-col ${theme === "dark" ? "bg-slate-950" : "bg-white"}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${theme === "dark" ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h2 className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Deriv DTrader</h2>
            <p className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Real-time trading platform</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleLoginDirect}
            className="h-9 gap-2"
          >
            <LogIn className="h-4 w-4" />
            Login to Trade
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            className="h-9 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleOpenInNewTab}
            className="h-9 gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            <Maximize2 className="h-4 w-4" />
            Full Screen
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 relative overflow-hidden ${theme === "dark" ? "bg-black" : "bg-slate-50"}`}>
        {/* Loading State */}
        {isLoading && (
          <div className={`absolute inset-0 flex items-center justify-center z-10 ${theme === "dark" ? "bg-slate-950/80" : "bg-slate-100/80"}`}>
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
              <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>Loading DTrader...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className={`absolute inset-0 flex items-center justify-center z-10 ${theme === "dark" ? "bg-slate-950/80" : "bg-slate-100/80"}`}>
            <div className="flex flex-col items-center gap-4 max-w-md px-6">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className={`text-sm text-center ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>{error}</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleRefresh} className="bg-blue-600 hover:bg-blue-700">
                  Retry
                </Button>
                <Button size="sm" onClick={handleLoginDirect} className="bg-green-600 hover:bg-green-700">
                  Login to Trade
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* iframe with relaxed sandbox for cookie sharing */}
        <iframe
          key={iframeKey}
          src={dtraderUrl}
          title="Deriv DTrader"
          className="w-full h-full border-0"
          allow="clipboard-read; clipboard-write; camera; microphone; payment"
          sandbox={{
            allowSameOrigin: true,
            allowScripts: true,
            allowPopups: true,
            allowPopupsToEscapeSandbox: true,
            allowForms: true,
            allowStorageAccessByUserActivation: true,
            allowTopNavigation: true,
          }}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError("Failed to load DTrader. Click Login to start trading.")
            setIsLoading(false)
          }}
        />
      </div>

      {/* Footer Info */}
      <div className={`px-4 py-3 border-t ${theme === "dark" ? "border-slate-800 bg-slate-900/50 text-slate-400" : "border-slate-200 bg-slate-100 text-slate-600"}`}>
        <p className="text-xs">
          Click "Login to Trade" to authenticate with Deriv • Cookies preserved across sessions
        </p>
      </div>
    </div>
  )
}
