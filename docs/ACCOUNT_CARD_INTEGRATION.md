# Account Card Integration Guide

## Quick Start (5 minutes)

### 1. Import the Component

```tsx
import { AccountCard } from '@/components/account-card';
```

### 2. Add to Your Page

```tsx
export default function Dashboard() {
  return (
    <div className="p-6">
      <AccountCard />
    </div>
  );
}
```

### 3. Fetch Real Data

```tsx
'use client';

import { useEffect, useState } from 'react';
import { AccountCard } from '@/components/account-card';

interface AccountData {
  userName: string;
  email: string;
  accountBalance: number;
  availableBalance: number;
  totalProfit: number;
  profitPercentage: number;
  tradingStats: {
    totalTrades: number;
    winRate: number;
    consecutiveWins: number;
    avgReturn: number;
  };
  lastUpdated: Date;
  status: 'active' | 'inactive' | 'verification_pending';
}

export default function Dashboard() {
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch('/api/v1/users/me/account');
      const accountData = await response.json();
      setData(accountData);
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="p-6">
      <AccountCard 
        data={data || undefined}
        isLoading={loading}
      />
    </div>
  );
}
```

---

## Props Reference

```tsx
interface AccountCardProps {
  // Account data to display
  data?: AccountData;

  // Loading state (shows skeleton)
  isLoading?: boolean;

  // Show/hide balances by default
  showFullBalance?: boolean;

  // Refresh callback
  onRefresh?: () => void;
}
```

### Data Interface

```tsx
interface AccountData {
  // User Information
  userName: string;              // Display name
  email: string;                 // Email address

  // Balance Information
  accountBalance: number;        // Total account balance
  availableBalance: number;      // Available for trading
  totalProfit: number;           // Total P&L
  profitPercentage: number;      // P&L percentage (0-100)

  // Trading Statistics
  tradingStats: {
    totalTrades: number;         // Lifetime trades
    winRate: number;             // Win percentage (0-100)
    consecutiveWins: number;     // Current win streak
    avgReturn: number;           // Average return per trade (%)
  };

  // Status
  lastUpdated: Date;             // When data was last fetched
  status: 'active' | 'inactive' | 'verification_pending';
}
```

---

## Fetching Account Data from API

### Get Current User Account

```bash
curl -X GET https://your-app.com/api/v1/users/me/account \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Response Example

```json
{
  "userName": "John Trader",
  "email": "john@example.com",
  "accountBalance": 25840.50,
  "availableBalance": 18540.50,
  "totalProfit": 5840.50,
  "profitPercentage": 29.2,
  "tradingStats": {
    "totalTrades": 142,
    "winRate": 68.3,
    "consecutiveWins": 8,
    "avgReturn": 2.4
  },
  "lastUpdated": "2024-07-03T18:30:00Z",
  "status": "active"
}
```

### Create Endpoint (Optional)

If you don't have this endpoint yet, create it:

```tsx
// app/api/v1/users/me/account/route.ts

import { getServerSession } from 'next-auth/next';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const session = await getServerSession();
  
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch user account data
  const { data, error } = await supabase
    .from('users')
    .select(`
      username,
      email,
      account_balance,
      available_balance,
      total_profit,
      status,
      updated_at,
      trading_stats (
        total_trades,
        win_rate,
        consecutive_wins,
        avg_return
      )
    `)
    .eq('id', session.user.id)
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    userName: data.username,
    email: data.email,
    accountBalance: data.account_balance,
    availableBalance: data.available_balance,
    totalProfit: data.total_profit,
    profitPercentage: (data.total_profit / data.account_balance) * 100,
    tradingStats: data.trading_stats,
    lastUpdated: data.updated_at,
    status: data.status
  });
}
```

---

## Real-Time Updates

### Polling Strategy

```tsx
'use client';

import { useEffect, useState } from 'react';
import { AccountCard } from '@/components/account-card';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const response = await fetch('/api/v1/users/me/account');
    const accountData = await response.json();
    setData(accountData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Poll every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AccountCard 
      data={data}
      isLoading={loading}
      onRefresh={fetchData}
    />
  );
}
```

### WebSocket Strategy (Advanced)

```tsx
'use client';

import { useEffect, useState } from 'react';
import { AccountCard } from '@/components/account-card';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    fetch('/api/v1/users/me/account')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });

    // WebSocket connection
    const ws = new WebSocket('wss://your-app.com/api/ws/account');

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      setData(prev => ({ ...prev, ...update }));
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => ws.close();
  }, []);

  return (
    <AccountCard 
      data={data}
      isLoading={loading}
    />
  );
}
```

---

## Customization Examples

### Compact Layout

```tsx
<AccountCard 
  data={data}
  isLoading={loading}
/>
```

Add CSS for compact:

```css
.account-card-compact {
  @apply p-4 gap-3;
}

.account-card-compact .text-3xl {
  @apply text-2xl;
}

.account-card-compact .grid-cols-2 {
  @apply grid-cols-1;
}
```

### Hide Balance by Default

```tsx
<AccountCard 
  data={data}
  isLoading={loading}
  showFullBalance={false}
/>
```

### Custom Styling

```tsx
<div className="p-6 bg-gradient-to-br from-blue-900 to-purple-900">
  <AccountCard 
    data={data}
    isLoading={loading}
  />
</div>
```

### Variant: Read-Only

```tsx
function AccountCardReadOnly({ data }: { data: AccountData }) {
  return (
    <div className="soft-card p-6">
      {/* Simplified version without buttons */}
      <h2>{data.userName}</h2>
      <p className="text-3xl font-bold text-primary">
        {data.accountBalance}
      </p>
      {/* ... rest of display */}
    </div>
  );
}
```

---

## Error Handling

```tsx
'use client';

import { useEffect, useState } from 'react';
import { AccountCard } from '@/components/account-card';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/users/me/account');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const accountData = await response.json();
      setData(accountData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch account');
      console.error('Account fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/50 rounded-lg">
        <h3 className="text-red-400">Error loading account</h3>
        <p className="text-sm text-red-300">{error}</p>
        <button 
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <AccountCard 
      data={data}
      isLoading={loading}
      onRefresh={fetchData}
    />
  );
}
```

---

## Testing

### Unit Tests

```tsx
import { render, screen } from '@testing-library/react';
import { AccountCard } from '@/components/account-card';

describe('AccountCard', () => {
  const mockData = {
    userName: 'John Doe',
    email: 'john@example.com',
    accountBalance: 10000,
    availableBalance: 8000,
    totalProfit: 1000,
    profitPercentage: 10,
    tradingStats: {
      totalTrades: 50,
      winRate: 60,
      consecutiveWins: 5,
      avgReturn: 2.0
    },
    lastUpdated: new Date(),
    status: 'active'
  };

  it('renders user name', () => {
    render(<AccountCard data={mockData} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays balance correctly', () => {
    render(<AccountCard data={mockData} />);
    expect(screen.getByText('$10,000.00')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<AccountCard isLoading={true} />);
    expect(screen.getByTestId('card-skeleton')).toBeInTheDocument();
  });
});
```

---

## Performance Tips

1. **Memoize Component**: Wrap with React.memo if data doesn't change frequently
   ```tsx
   const MemoAccountCard = React.memo(AccountCard);
   ```

2. **Debounce Refresh**: Prevent rapid refresh clicks
   ```tsx
   import { useDeferredValue } from 'react';
   
   const debouncedRefresh = useDeferredValue(onRefresh);
   ```

3. **Use SWR for Data**: Automatic revalidation and caching
   ```tsx
   import useSWR from 'swr';
   
   const { data, mutate } = useSWR('/api/v1/users/me/account', fetcher);
   ```

---

## Troubleshooting

### Balance Not Showing

**Problem**: Balance displays as "••••••••"

**Solution**: Click the eye icon to toggle balance visibility, or set `showFullBalance={true}`

### Data Not Updating

**Problem**: Account data shows stale information

**Solution**: Click refresh button or set up polling interval

### Styling Issues

**Problem**: Component doesn't have glow effects

**Solution**: Ensure `globals.css` has the glow utility classes defined

### API 401 Errors

**Problem**: "Unauthorized" error when fetching account

**Solution**: Verify API key is valid and has required scopes

---

## API Integration Checklist

- [ ] Account data endpoint created (`GET /api/v1/users/me/account`)
- [ ] Authentication middleware configured
- [ ] AccountCard component imported
- [ ] Data fetching implemented (polling or WebSocket)
- [ ] Error handling added
- [ ] Loading states handled
- [ ] Responsive design tested
- [ ] Accessibility verified
- [ ] Performance optimized
- [ ] Unit tests written

---

## File Organization

```
your-dashboard/
├── components/
│   └── account-card.tsx          ← Component
├── app/
│   └── dashboard/
│       ├── page.tsx              ← Dashboard page
│       └── api/
│           └── v1/
│               └── users/
│                   └── me/
│                       └── account/
│                           └── route.ts  ← Data endpoint
└── docs/
    ├── ACCOUNT_CARD_DESIGN.md    ← Design docs
    └── ACCOUNT_CARD_INTEGRATION.md ← This file
```
