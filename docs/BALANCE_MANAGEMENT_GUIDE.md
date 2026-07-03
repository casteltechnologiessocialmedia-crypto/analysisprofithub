# Balance Display & Management Guide

Complete guide to displaying, tracking, and managing account balances.

## Balance Types

### Total Balance
Overall account value including all positions and cash.

```
Total Balance = Available + Pending + Frozen
```

### Available Balance
Amount available for new trades or withdrawals.

```
Available = Cash + Unrealized Gains - Holds
```

### Pending Balance
Money in transit or awaiting settlement.

```
Pending = Deposits in Transit + Pending Withdrawals + Settlement
```

## BalanceDisplay Component

### Basic Usage

```tsx
import { BalanceDisplay } from '@/components/balance-display'

export function MyDashboard() {
  return (
    <BalanceDisplay
      totalBalance={50000}
      availableBalance={45000}
      pendingBalance={5000}
      change24h={1200.50}
      percentChange24h={2.45}
      currency="USD"
    />
  )
}
```

### With Real-Time Updates

```tsx
import { BalanceDisplay } from '@/components/balance-display'
import useSWR from 'swr'

export function Dashboard() {
  const { data, mutate, isLoading } = useSWR(
    '/api/balance',
    fetcher,
    {
      refreshInterval: 10000, // Update every 10 seconds
      dedupingInterval: 5000
    }
  )

  return (
    <BalanceDisplay
      totalBalance={data?.total || 0}
      availableBalance={data?.available || 0}
      pendingBalance={data?.pending || 0}
      change24h={data?.change24h || 0}
      percentChange24h={data?.percentChange24h || 0}
      isLoading={isLoading}
      onRefresh={() => mutate()}
      showHidden={true}
    />
  )
}
```

### With Manual Refresh

```tsx
const handleRefresh = async () => {
  const response = await fetch('/api/balance')
  const newBalance = await response.json()
  setBalance(newBalance)
}

<BalanceDisplay
  {...balanceProps}
  onRefresh={handleRefresh}
/>
```

## Features

### 1. Balance Display
Shows total balance in large, readable format:
- Main balance amount
- Currency symbol
- Real-time last update timestamp

### 2. Change Tracking
Displays 24-hour performance:
- Absolute change (dollars)
- Percentage change
- Trend indicator (up/down arrow)
- Color coding (green for profit, red for loss)

### 3. Balance Breakdown
Two-column grid showing:
- **Available**: Ready to trade
- **Pending**: In settlement/transit

### 4. Hide Sensitive Data
User can toggle balance visibility:
- Hides amounts as dots
- Useful for public/shared screens
- Eye icon to toggle

### 5. Manual Refresh
Button to fetch latest balance:
- Shows spinning indicator while loading
- Useful for manual updates
- Integrates with SWR cache

## API Integration

### Required Endpoint: GET /api/balance

**Response Format:**
```json
{
  "total": 50000.00,
  "available": 45000.00,
  "pending": 5000.00,
  "frozen": 0.00,
  "change24h": 1200.50,
  "percentChange24h": 2.45,
  "currency": "USD",
  "lastUpdated": "2024-01-15T15:45:30Z"
}
```

### Example Backend (Express/Node.js)

```typescript
app.get('/api/balance', async (req, res) => {
  try {
    // Get user from session/auth
    const userId = req.user.id

    // Fetch balance from database/cache
    const balance = await getBalance(userId)

    // Calculate 24h change
    const change24h = calculateChange(balance, '24h')

    res.json({
      total: balance.total,
      available: balance.available,
      pending: balance.pending,
      frozen: balance.frozen,
      change24h: change24h.amount,
      percentChange24h: change24h.percent,
      currency: 'USD',
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch balance' })
  }
})
```

## Real-Time Balance Updates

### Strategy 1: Polling

Simple but less efficient:

```tsx
const { data } = useSWR('/api/balance', fetcher, {
  refreshInterval: 5000 // Poll every 5 seconds
})
```

**Pros:** Simple, works everywhere
**Cons:** Network overhead, not true real-time

### Strategy 2: WebSocket

Real-time updates:

```tsx
useEffect(() => {
  const ws = new WebSocket('wss://api.example.com/balance')

  ws.onmessage = (event) => {
    const balance = JSON.parse(event.data)
    setBalance(balance)
  }

  return () => ws.close()
}, [])
```

**Pros:** True real-time, efficient
**Cons:** More complex, requires server support

### Strategy 3: Server-Sent Events (SSE)

Middle ground:

```tsx
useEffect(() => {
  const eventSource = new EventSource('/api/balance/stream')

  eventSource.onmessage = (event) => {
    const balance = JSON.parse(event.data)
    setBalance(balance)
  }

  return () => eventSource.close()
}, [])
```

**Pros:** Real-time, simpler than WebSocket
**Cons:** Browser compatibility

## Balance Caching Strategy

### With SWR

```tsx
import useSWR from 'swr'

const { data, mutate } = useSWR(
  '/api/balance',
  fetcher,
  {
    refreshInterval: 10000,      // Auto-refresh every 10s
    dedupingInterval: 5000,      // Dedupe within 5s
    focusThrottleInterval: 60000, // Refresh on focus after 60s
    revalidateOnFocus: true,     // Revalidate when window focused
    revalidateOnReconnect: true  // Revalidate when online
  }
)

// Manual refresh
await mutate()

// Immediate update without refetch
mutate(newBalance, false)
```

## Multi-Account Balances

Display balances for multiple connected accounts:

```tsx
import { BalanceDisplay } from '@/components/balance-display'
import useSWR from 'swr'

export function MultiAccountDashboard() {
  const { data: accounts } = useSWR('/api/accounts', fetch)
  const { data: balances } = useSWR(
    '/api/accounts/balances',
    fetch
  )

  return (
    <div className="grid gap-6">
      {accounts?.map(account => {
        const accountBalance = balances?.[account.id]

        return (
          <div key={account.id}>
            <h3 className="text-lg font-semibold mb-4">
              {account.platform}
            </h3>
            <BalanceDisplay
              totalBalance={accountBalance?.total || 0}
              availableBalance={accountBalance?.available || 0}
              pendingBalance={accountBalance?.pending || 0}
              change24h={accountBalance?.change24h || 0}
              percentChange24h={accountBalance?.percentChange24h || 0}
            />
          </div>
        )
      })}
    </div>
  )
}
```

### Aggregate Balances

Combine multiple accounts:

```tsx
function useAggregateBalance() {
  const { data: balances } = useSWR('/api/accounts/balances', fetch)

  const aggregate = {
    total: balances?.reduce((sum, b) => sum + b.total, 0) || 0,
    available: balances?.reduce((sum, b) => sum + b.available, 0) || 0,
    pending: balances?.reduce((sum, b) => sum + b.pending, 0) || 0,
    change24h: balances?.reduce((sum, b) => sum + b.change24h, 0) || 0,
    percentChange24h: balances?.reduce((sum, b) => sum + b.percentChange24h, 0) / (balances?.length || 1) || 0
  }

  return aggregate
}

export function PortfolioValue() {
  const balance = useAggregateBalance()

  return <BalanceDisplay {...balance} />
}
```

## Error Handling

### Fallback on Error

```tsx
const { data = { total: 0, available: 0, pending: 0, change24h: 0, percentChange24h: 0 } } = useSWR(
  '/api/balance',
  fetcher
)
```

### Manual Error Handling

```tsx
const [error, setError] = useState<string | null>(null)

const fetchBalance = async () => {
  try {
    const res = await fetch('/api/balance')
    if (!res.ok) throw new Error('Failed to fetch balance')

    const data = await res.json()
    setBalance(data)
    setError(null)
  } catch (err) {
    setError(err.message)
    setBalance(null)
  }
}

return error ? (
  <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
    <p className="text-red-400">{error}</p>
    <button onClick={fetchBalance}>Retry</button>
  </div>
) : (
  <BalanceDisplay {...balance} />
)
```

## Styling & Customization

### Custom Theme

```tsx
<BalanceDisplay
  {...balanceProps}
  className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700"
/>
```

### Responsive Layout

Component automatically adapts to screen size:
- **Mobile**: Single column, larger text
- **Tablet**: Two columns for breakdown
- **Desktop**: Full layout with details

### Dark/Light Mode

Uses semantic color tokens:

```css
:root {
  --background: oklch(0.04 0.01 240);
  --surface: oklch(0.13 0.02 260);
  --text: oklch(0.98 0.01 250);
}

@media (prefers-color-scheme: light) {
  --background: oklch(0.98 0.01 250);
  --surface: oklch(0.93 0.02 260);
  --text: oklch(0.04 0.01 240);
}
```

## Performance Tips

1. **Memoize Component**
   ```tsx
   const MemoizedBalance = React.memo(BalanceDisplay)
   ```

2. **Debounce Updates**
   ```tsx
   const debouncedUpdate = useDebouncedCallback(() => {
     mutate()
   }, 1000)
   ```

3. **Limit Refresh Frequency**
   ```tsx
   refreshInterval: 30000 // Not more than every 30s
   ```

4. **Cache Aggressively**
   ```tsx
   dedupingInterval: 10000,
   revalidateOnFocus: false
   ```

## Testing

```tsx
import { render, screen } from '@testing-library/react'
import { BalanceDisplay } from '@/components/balance-display'

test('displays balance correctly', () => {
  render(
    <BalanceDisplay
      totalBalance={50000}
      availableBalance={45000}
      pendingBalance={5000}
      change24h={1200}
      percentChange24h={2.45}
    />
  )

  expect(screen.getByText('$50,000.00')).toBeInTheDocument()
  expect(screen.getByText('$45,000.00')).toBeInTheDocument()
  expect(screen.getByText('$5,000.00')).toBeInTheDocument()
})

test('toggles balance visibility', async () => {
  render(<BalanceDisplay {...props} showHidden={true} />)

  const toggleButton = screen.getByRole('button')
  await userEvent.click(toggleButton)

  expect(screen.getByText('••••••')).toBeInTheDocument()
})
```

