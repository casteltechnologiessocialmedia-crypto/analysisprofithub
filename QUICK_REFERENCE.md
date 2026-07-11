# Deriv Trading Workflow - Quick Reference

## Import & Use (Copy-Paste)

```tsx
import { useTrading } from "@/hooks/use-trading"

export function MyComponent() {
  const {
    executeTrade,
    closePosition,
    openPositions,
    portfolioStats,
    currentPrice,
    balance,
    isInitialized,
    error
  } = useTrading()

  // Your component code
}
```

---

## Execute Trade

```tsx
// Get a price quote first (optional, executeTrade does this)
const proposal = await getProposal({
  symbol: "1HZ15V",
  contractType: "CALL",
  amount: 10,
  duration: 1,
  durationUnit: "t",
  basis: "stake"
})

// Execute trade
const result = await executeTrade({
  symbol: "1HZ15V",
  contractType: "CALL",
  amount: 10,
  duration: 1,
  durationUnit: "t",
  basis: "stake",
  currency: "USD"
})

// Result contains: contractId, buyPrice, payout, etc.
```

---

## Close Position

```tsx
const position = openPositions[0]
await closePosition(position.contractId, currentPrice("1HZ15V")?.last || 0)
```

---

## Monitor Positions

```tsx
// Real-time open positions
openPositions.forEach(pos => {
  console.log(`${pos.symbol}: $${pos.profitLoss?.toFixed(2)}`)
})

// Portfolio stats
console.log(portfolioStats.totalProfit)     // Total P&L
console.log(portfolioStats.totalWins)       // Win count
console.log(portfolioStats.winRate)         // Win % rate
console.log(portfolioStats.openContracts)   // Active positions
```

---

## Subscribe to Ticks

```tsx
await subscribeTick("1HZ15V", (tick) => {
  console.log(tick.quote)      // Price
  console.log(tick.lastDigit)  // Last digit (0-9)
  console.log(tick.epoch)      // Timestamp
})
```

---

## Get Current Price

```tsx
const price = currentPrice("1HZ15V")
if (price) {
  console.log(price.last)            // Current quote
  console.log(price.change)          // Price change
  console.log(price.changePercent)   // % change
}
```

---

## Error Handling

```tsx
import { TradeErrorHandler } from "@/lib/trade-error-handler"

try {
  await executeTrade({...})
} catch (err) {
  const errorDetail = TradeErrorHandler.handle(err)
  console.log(errorDetail.message)     // User-friendly message
  console.log(errorDetail.type)        // Error type
  console.log(errorDetail.recoverable) // Can retry?
  console.log(errorDetail.action)      // What to do
}
```

---

## Retry Failed Operations

```tsx
import { TradeErrorHandler } from "@/lib/trade-error-handler"

await TradeErrorHandler.retry(
  () => executeTrade({...}),
  3, // max attempts
  (attemptNumber, error) => {
    console.log(`Retry ${attemptNumber}: ${error.message}`)
  }
)
```

---

## Circuit Breaker (Automated Trading)

```tsx
import { CircuitBreaker } from "@/lib/trade-error-handler"

const breaker = new CircuitBreaker()

// Record trade results
if (tradeWon) {
  breaker.recordSuccess(true)
} else {
  breaker.recordSuccess(false)
}

// Check before trading
if (breaker.isOpen()) {
  console.log("Circuit breaker is OPEN - stop trading")
  return
}

// Check portfolio health
const { healthy, reason } = breaker.checkPortfolioHealth(
  portfolioStats.totalProfit,
  balance,
  portfolioStats.winRate
)

if (!healthy) {
  console.log("Portfolio unhealthy:", reason)
}
```

---

## Common Patterns

### Pattern 1: Simple Trade Execution
```tsx
const handleTrade = async (symbol, type) => {
  try {
    const result = await executeTrade({
      symbol,
      contractType: type,
      amount: 10,
      duration: 1,
      durationUnit: "t",
      basis: "stake"
    })
    alert(`Trade executed: ${result.contractId}`)
  } catch (err) {
    alert(err.message)
  }
}
```

### Pattern 2: Real-Time Price Monitoring
```tsx
const [price, setPrice] = useState(0)

useEffect(() => {
  subscribeTick("1HZ15V", (tick) => {
    setPrice(tick.quote)
  })
}, [])

return <div>Price: {price}</div>
```

### Pattern 3: Auto-Trading on Signal
```tsx
const handleSignal = async (signal) => {
  if (signal.strength < 0.75) return
  if (breaker.isOpen()) return

  try {
    const result = await executeTrade({
      symbol: signal.symbol,
      contractType: signal.prediction,
      amount: signal.stake,
      duration: 1,
      durationUnit: "t"
    })
    console.log("Signal trade executed")
  } catch (err) {
    console.error("Signal trade failed:", err)
  }
}
```

### Pattern 4: RSI-Based Trading
```tsx
const calculateRSI = (prices, period = 14) => {
  if (prices.length < period) return 50
  
  let gains = 0, losses = 0
  for (let i = 1; i < period; i++) {
    const diff = prices[i] - prices[i - 1]
    if (diff > 0) gains += diff
    else losses += Math.abs(diff)
  }
  
  const avgGain = gains / period
  const avgLoss = losses / period
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

// Usage
let prices = []
await subscribeTick("1HZ15V", async (tick) => {
  prices.push(tick.quote)
  if (prices.length > 100) prices.shift()
  
  const rsi = calculateRSI(prices)
  
  if (rsi < 30) {
    // Oversold - buy
    await executeTrade({...})
  } else if (rsi > 70 && openPositions.length > 0) {
    // Overbought - sell
    const pos = openPositions[0]
    await closePosition(pos.contractId, tick.quote)
  }
})
```

---

## Types Reference

```tsx
interface TradeRequest {
  symbol: string              // "1HZ15V", "1HZ30V", etc.
  contractType: string        // "CALL", "PUT", "DIGIT", etc.
  amount: number             // Stake in currency
  duration: number           // 1, 5, 10, 60, etc.
  durationUnit: string       // "t" (tick), "m" (minute), "h", "d"
  barrier?: string           // Only for certain contracts
  basis: "stake" | "payout"  // "stake" for most
  currency?: string          // "USD", etc.
}

interface TradeResult {
  contractId: number
  buyPrice: number
  payout: number
  entrySpot?: number
  status: "pending" | "active" | "completed"
  timestamp: number
  longcode: string
  transactionId: number
}

interface OpenTrade {
  contractId: number
  symbol: string
  contractType: string
  buyPrice: number
  payout: number
  profitLoss?: number
  isSold: boolean
  purchaseTime: number
}

interface PortfolioStats {
  totalProfit: number
  totalWins: number
  totalLosses: number
  winRate: number
  openContracts: number
  closedContracts: number
  totalBalance: number
  todayProfit: number
  totalDrawdown: number
}
```

---

## Available Symbols

```tsx
// 1-Second Volatility Indices
"1HZ15V"   // Volatility 15 (1s)
"1HZ30V"   // Volatility 30 (1s)
"1HZ90V"   // Volatility 90 (1s)
"1HZ100V"  // Volatility 100 (1s)

// Standard Volatility
"R_10"     // Volatility 10
"R_25"     // Volatility 25
"R_50"     // Volatility 50
"R_100"    // Volatility 100

// Jump Indices
"JUMP10"
"JUMP25"
"JUMP50"
"JUMP100"
```

---

## Debugging Commands

```tsx
// Log all open positions
console.log("[v0] Positions:", openPositions)

// Log portfolio stats
console.log("[v0] Stats:", portfolioStats)

// Log current price
console.log("[v0] Price:", currentPrice("1HZ15V"))

// Log service state
console.log("[v0] Ready:", isInitialized)
console.log("[v0] Balance:", balance)

// Monitor ticks
await subscribeTick("1HZ15V", (tick) => {
  console.log(`[v0] Tick: ${tick.quote} (${tick.lastDigit})`)
})
```

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Trading service not initialized" | Hook not ready | Wait for `isInitialized === true` |
| "Insufficient balance" | Stake > balance | Reduce stake amount |
| "Market is closed" | Market offline | Wait for market to open |
| "Contract limit" | Too many open | Close some positions |
| "Network connection failed" | WebSocket down | Check internet, retry |
| "Invalid symbol" | Wrong symbol name | Use valid symbol from list |

---

## Files You Need

To wire a new tab:

1. Import hook: `import { useTrading } from "@/hooks/use-trading"`
2. Use hook: `const { executeTrade, ... } = useTrading()`
3. Replace mock: Change `setMockResult` → `await executeTrade(...)`
4. Add UI: Show `isLoading`, `error`, results
5. Optional: Subscribe to ticks for live prices

That's it! The services handle everything else.

---

## Performance

- **Subscriptions**: One per symbol globally (no duplicates)
- **Memory**: ~100 ticks cached per symbol
- **Latency**: Real-time WebSocket updates (no polling)
- **Cleanup**: Automatic on component unmount

---

## More Info

- **Full docs**: `/WORKFLOW_COMPLETE.md`
- **Step-by-step guide**: `/IMPLEMENTATION_GUIDE.md`
- **Deriv API docs**: https://developers.deriv.com/
- **Source services**: `/lib/trade-execution-service.ts`, etc.
