# Complete Deriv API Workflow - Implementation Guide

## Quick Start: Wiring Tabs to Real Trade Execution

This guide shows you how to convert mock-based trading tabs to use real Deriv API calls via the new `useTrading` hook.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    useTrading Hook                           │
│  (Main interface for all trading tabs)                       │
└──────────────┬────────────────────────────────────────────────┘
               │
    ┌──────────┼──────────┬─────────────────────┐
    │          │          │                     │
    ▼          ▼          ▼                     ▼
TradeExecutionService  PortfolioManager  MarketDataManager  DerivAPIClient
(Executes trades)      (Real portfolio)   (Ticks & prices)  (WebSocket API)
```

### Service Responsibilities

1. **TradeExecutionService**: Handles proposal → buy → subscribe workflow
2. **PortfolioManager**: Monitors open positions in real-time
3. **MarketDataManager**: Manages tick subscriptions and price feeds
4. **useTrading Hook**: Unified interface for React components

---

## Phase 1: Wire ManualTrader Tab

### Step 1: Update ManualTrader Component

**File**: `/components/tabs/manual-trader.tsx`

Before (Mock):
```tsx
const handleTrade = () => {
  // Mock trade
  setMockTradeResult({
    contractId: Math.random(),
    buyPrice: 100,
    status: "pending"
  })
}
```

After (Real):
```tsx
import { useTrading } from "@/hooks/use-trading"

export function ManualTraderTab() {
  const { 
    executeTrade, 
    currentPrice, 
    balance, 
    openPositions,
    isInitialized,
    error,
    isLoading
  } = useTrading()

  const [selectedSymbol, setSelectedSymbol] = useState("1HZ15V")
  const [contractType, setContractType] = useState("CALL")
  const [stake, setStake] = useState(10)
  const [duration, setDuration] = useState(1)
  const [tradeResult, setTradeResult] = useState<any>(null)

  const handleTrade = async () => {
    try {
      if (!isInitialized) {
        alert("Trading services not initialized")
        return
      }

      if (stake > balance) {
        alert("Insufficient balance")
        return
      }

      const result = await executeTrade({
        symbol: selectedSymbol,
        contractType,
        amount: stake,
        duration,
        durationUnit: "t",
        basis: "stake",
        currency: "USD"
      })

      setTradeResult(result)
      // Show success message
      console.log("Trade executed:", result)
    } catch (err) {
      console.error("Trade failed:", err)
      alert(err instanceof Error ? err.message : "Trade failed")
    }
  }

  return (
    <div className="space-y-4">
      {/* Show error if any */}
      {error && <div className="p-3 bg-red-500/10 text-red-500">{error}</div>}

      {/* Symbol Selection */}
      <select 
        value={selectedSymbol} 
        onChange={(e) => setSelectedSymbol(e.target.value)}
        disabled={isLoading}
      >
        <option value="1HZ15V">Volatility 15 (1s)</option>
        <option value="1HZ30V">Volatility 30 (1s)</option>
        <option value="1HZ90V">Volatility 90 (1s)</option>
      </select>

      {/* Contract Type */}
      <div className="flex gap-2">
        {["CALL", "PUT"].map((type) => (
          <button
            key={type}
            onClick={() => setContractType(type)}
            className={type === contractType ? "bg-blue-500" : "bg-gray-500"}
            disabled={isLoading}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Stake Input */}
      <input
        type="number"
        value={stake}
        onChange={(e) => setStake(parseFloat(e.target.value))}
        placeholder="Stake"
        disabled={isLoading}
      />

      {/* Current Price Display */}
      {currentPrice(selectedSymbol) && (
        <div>
          Current Price: {currentPrice(selectedSymbol)?.last.toFixed(4)}
        </div>
      )}

      {/* Trade Button */}
      <button 
        onClick={handleTrade}
        disabled={isLoading || !isInitialized}
      >
        {isLoading ? "Executing..." : "Execute Trade"}
      </button>

      {/* Trade Result */}
      {tradeResult && (
        <div className="p-3 bg-green-500/10 text-green-500">
          Trade Executed!
          <div>Contract ID: {tradeResult.contractId}</div>
          <div>Entry Price: {tradeResult.buyPrice}</div>
          <div>Payout: {tradeResult.payout}</div>
        </div>
      )}

      {/* Open Positions */}
      <div>
        <h3>Open Positions ({openPositions.length})</h3>
        {openPositions.map((pos) => (
          <div key={pos.contractId} className="p-2 border">
            <div>Symbol: {pos.symbol}</div>
            <div>Entry: {pos.buyPrice}</div>
            <div>P&L: {pos.profitLoss?.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Key Changes

1. Import `useTrading` hook
2. Replace mock `handleTrade` with `executeTrade` call
3. Pass real trade parameters
4. Show real-time balance and positions
5. Display actual P&L

---

## Phase 2: Wire AutoBot Tab

### Step 1: Update AutoBot Component

**File**: `/components/tabs/autobot-tab.tsx` or `/components/tabs/automated-tab.tsx`

Before (Mock):
```tsx
const runAutoBot = () => {
  // Simulated trades
  setMockTrades([...mockTrades, { id: Math.random(), ... }])
}
```

After (Real):
```tsx
import { useTrading } from "@/hooks/use-trading"

export function AutoBotTab() {
  const { 
    executeTrade, 
    subscribeTick,
    openPositions,
    closePosition,
    balance,
    isInitialized
  } = useTrading()

  const [isRunning, setIsRunning] = useState(false)
  const [trades, setTrades] = useState<any[]>([])
  const [symbol, setSymbol] = useState("1HZ15V")
  const [stake, setStake] = useState(10)
  const [strategy, setStrategy] = useState<"rsi" | "ma">( "rsi")

  // Simple RSI strategy
  const calculateRSI = (prices: number[], period = 14) => {
    if (prices.length < period) return 50
    
    let gains = 0, losses = 0
    for (let i = 1; i < period; i++) {
      const diff = prices[i] - prices[i - 1]
      if (diff > 0) gains += diff
      else losses += Math.abs(diff)
    }
    
    const avgGain = gains / period
    const avgLoss = losses / period
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    const rsi = 100 - (100 / (1 + rs))
    
    return rsi
  }

  // Run the AutoBot
  const runAutoBot = async () => {
    if (!isInitialized) {
      alert("Trading services not initialized")
      return
    }

    setIsRunning(true)

    try {
      // Subscribe to ticks
      let tickPrices: number[] = []

      await subscribeTick(symbol, async (tick) => {
        tickPrices.push(tick.quote)
        if (tickPrices.length > 100) {
          tickPrices.shift()
        }

        // Calculate RSI
        const rsi = calculateRSI(tickPrices)

        // Simple strategy: Buy when RSI < 30 (oversold), Sell when > 70 (overbought)
        if (rsi < 30 && stake <= balance) {
          try {
            const result = await executeTrade({
              symbol,
              contractType: "CALL",
              amount: stake,
              duration: 1,
              durationUnit: "t",
              basis: "stake"
            })

            setTrades((prev) => [...prev, {
              id: result.contractId,
              type: "CALL",
              rsi,
              result
            }])
          } catch (err) {
            console.error("Trade execution failed:", err)
          }
        }

        if (rsi > 70 && openPositions.length > 0) {
          // Close first position (simplified)
          const pos = openPositions[0]
          try {
            await closePosition(pos.contractId, tick.quote)
          } catch (err) {
            console.error("Close failed:", err)
          }
        }
      })

      console.log("AutoBot running...")
    } catch (err) {
      console.error("AutoBot error:", err)
      alert(err instanceof Error ? err.message : "AutoBot failed")
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Strategy Settings */}
      <div>
        <label>Strategy</label>
        <select value={strategy} onChange={(e) => setStrategy(e.target.value as any)}>
          <option value="rsi">RSI</option>
          <option value="ma">Moving Average</option>
        </select>
      </div>

      {/* Control Buttons */}
      <button 
        onClick={runAutoBot}
        disabled={isRunning}
      >
        {isRunning ? "Running..." : "Start AutoBot"}
      </button>

      {/* Trades List */}
      <div>
        <h3>Executed Trades ({trades.length})</h3>
        {trades.map((trade) => (
          <div key={trade.id} className="p-2 border">
            <div>Contract: {trade.id}</div>
            <div>Type: {trade.type}</div>
            <div>RSI: {trade.rsi?.toFixed(2)}</div>
            <div>P&L: {trade.result?.payout}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Key Features

1. Real RSI calculation from tick data
2. Real trade execution based on signal
3. Position closing based on thresholds
4. Live tick subscription
5. Error handling

---

## Phase 3: Wire Signals Tab

### Example: Update SignalsTab

**File**: `/components/tabs/signals-tab.tsx`

```tsx
import { useTrading } from "@/hooks/use-trading"

export function SignalsTab() {
  const { executeTrade, subscribeTick, balance } = useTrading()

  const [signals, setSignals] = useState<any[]>([])
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false)

  const handleSignal = async (signal: any) => {
    if (!autoTradeEnabled) return

    try {
      if (signal.strength < 0.75) return

      const result = await executeTrade({
        symbol: signal.symbol,
        contractType: signal.prediction, // "CALL" or "PUT"
        amount: signal.stake || 10,
        duration: 1,
        durationUnit: "t",
        basis: "stake"
      })

      console.log("Signal traded:", result)
      setSignals((prev) => [...prev, { ...signal, executed: true, result }])
    } catch (err) {
      console.error("Signal trade failed:", err)
    }
  }

  return (
    <div className="space-y-4">
      <label>
        <input 
          type="checkbox"
          checked={autoTradeEnabled}
          onChange={(e) => setAutoTradeEnabled(e.target.checked)}
        />
        Auto Trade on Signals
      </label>

      {/* Signals list */}
      {signals.map((signal) => (
        <div key={signal.id}>
          <button onClick={() => handleSignal(signal)}>
            Trade: {signal.symbol} {signal.prediction}
          </button>
          {signal.executed && <span className="text-green-500">✓ Executed</span>}
        </div>
      ))}
    </div>
  )
}
```

---

## Testing Checklist

- [ ] Manual trade execution works (check console logs)
- [ ] Position opens and shows in portfolio
- [ ] Real-time P&L updates
- [ ] Close position works
- [ ] Balance updates correctly
- [ ] Error messages display properly
- [ ] Tick subscriptions don't create duplicates
- [ ] Memory is cleaned up on unmount

---

## Common Patterns

### Getting Real Price
```tsx
const price = currentPrice(symbol)
console.log(price?.last) // Current quote
console.log(price?.change) // Price change
```

### Executing Trade with Validation
```tsx
try {
  if (stake > balance) throw new Error("Insufficient balance")
  if (!isInitialized) throw new Error("Services not ready")
  
  const result = await executeTrade({...})
} catch (err) {
  setError(err.message)
}
```

### Monitoring Position
```tsx
const position = getPosition(contractId)
console.log(position?.profitLoss)
console.log(position?.isSold)
```

### Subscribing to Ticks
```tsx
await subscribeTick(symbol, (tick) => {
  console.log(tick.quote) // Price
  console.log(tick.lastDigit) // Last digit for digit contracts
})
```

---

## Troubleshooting

### "Trading service not initialized"
- Wait for `isInitialized` to become true
- Check if API is authorized: `isAuthorized` in context

### Trades not executing
- Check balance is sufficient
- Verify symbol is valid
- Check console for detailed error

### No tick updates
- Ensure symbol has valid subscription
- Check WebSocket connection
- Monitor `currentPrice()` for data

### Memory leaks
- Always call `cleanup()` on component unmount
- Don't forget to unsubscribe from callbacks
- Check for circular references in listeners

---

## Next Steps

1. ✅ Core services created (TradeExecutionService, PortfolioManager, MarketDataManager)
2. ✅ useTrading hook implemented
3. TODO: Wire ManualTrader tab
4. TODO: Wire AutoBot tabs  
5. TODO: Wire Signals tabs
6. TODO: Create RealTimePortfolioPanel
7. TODO: Add circuit breakers
8. TODO: Create trade journal database schema
9. TODO: Wire remaining tabs
10. TODO: End-to-end testing

---

## Files Created

- `/lib/trade-execution-service.ts` - Trade execution
- `/lib/portfolio-manager.ts` - Portfolio management
- `/lib/market-data-manager.ts` - Market data
- `/hooks/use-trading.ts` - React hook interface

## Files to Modify

- `/components/tabs/manual-trader.tsx`
- `/components/tabs/autobot-tab.tsx`
- `/components/tabs/automated-tab.tsx`
- `/components/tabs/signals-tab.tsx`
- `/components/tabs/pro-signals-tab.tsx`
- And all other trading tabs

---

## Support

For issues:
1. Check console logs (they show `[v0]` prefixes)
2. Verify API connection status
3. Test with demo account first
4. Check WebSocket subscription logs
