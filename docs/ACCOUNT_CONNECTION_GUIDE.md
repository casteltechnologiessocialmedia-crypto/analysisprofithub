# Account Connection & Status Guide

Complete guide to connecting external trading accounts and managing connection status.

## Connection Lifecycle

```
User Initiates → Select Platform → Enter Credentials → Verify → Connected
                                                         ↓
                                                    Reconnect/Disconnect
```

## Platform Support

Currently supported trading platforms:

| Platform | Type | API Required | Notes |
|----------|------|--------------|-------|
| Alpaca | Stock/Options | REST API | Live trading |
| Binance | Cryptocurrency | API Keys | Spot & Futures |
| Kraken | Cryptocurrency | API Keys | High security |
| Coinbase | Cryptocurrency | OAuth | Account linking |

## Step-by-Step Connection Flow

### Step 1: Platform Selection

User clicks "Connect Account" button to open modal.

```tsx
<button onClick={() => setShowModal(true)}>
  Connect Account
</button>
```

Modal shows 4 available platforms in a 2x2 grid:
- Visual platform icon
- Platform name
- Click to select

### Step 2: Enter Credentials

After selecting platform, user sees credential input form:

**Fields:**
- **Username/Email** - Account identifier on the platform
- **API Key** - Secure authentication token

**Security Features:**
- API key masked by default
- Eye icon to toggle visibility
- Real-time input validation
- Security notice explaining encryption

### Step 3: Verification

Component sends credentials to backend:

```tsx
POST /api/accounts/connect
{
  "platform": "alpaca",
  "username": "user@example.com",
  "apiKey": "sk_live_abc123xyz"
}
```

Backend should:
1. Validate API key format
2. Test connection to platform API
3. Retrieve account info
4. Encrypt and store credentials
5. Return success/error

### Step 4: Success/Error States

**On Success:**
- Display checkmark icon
- Show "Account Connected!"
- Auto-close after 2 seconds
- Refresh account list

**On Error:**
- Display error icon
- Show specific error message
- "Try Again" button
- Keep modal open

## Connection Status Management

### Status States

Each connected account shows one of 4 states:

#### 1. Connected ✓
- Green checkmark icon
- "Connected" label
- Shows connection date
- Shows last sync time
- Disconnect button visible

```tsx
<ConnectionStatus
  platform="Alpaca"
  status="connected"
  connectedAt="2024-01-15T10:30:00Z"
  lastSync="2024-01-15T15:45:30Z"
/>
```

#### 2. Connecting ⟳
- Blue loading spinner
- "Connecting..." label
- Temporary state during auth

```tsx
<ConnectionStatus
  platform="Binance"
  status="connecting"
/>
```

#### 3. Disconnected ⏱
- Gray clock icon
- "Not Connected" label
- Reconnect button visible
- Used when user disconnects

```tsx
<ConnectionStatus
  platform="Kraken"
  status="disconnected"
/>
```

#### 4. Error ⚠
- Red alert icon
- "Connection Error" label
- Error message displayed
- Reconnect button visible

```tsx
<ConnectionStatus
  platform="Coinbase"
  status="error"
  error="API key expired or invalid"
/>
```

## Real-Time Connection Monitoring

### Polling Strategy

Fetch account status periodically:

```tsx
const { data: accounts, mutate } = useSWR(
  '/api/accounts',
  fetcher,
  {
    refreshInterval: 30000, // Poll every 30 seconds
    dedupingInterval: 10000 // Dedupe requests within 10 seconds
  }
)
```

### WebSocket Strategy

For real-time updates without polling:

```tsx
useEffect(() => {
  const ws = new WebSocket('wss://api.example.com/accounts/status')

  ws.onmessage = (event) => {
    const status = JSON.parse(event.data)
    setAccounts(prev =>
      prev.map(acc =>
        acc.id === status.accountId
          ? { ...acc, status: status.status }
          : acc
      )
    )
  }

  return () => ws.close()
}, [])
```

## Reconnection Logic

When account becomes disconnected:

```tsx
const handleReconnect = async (accountId) => {
  try {
    // User goes through connection flow again
    setShowModal(true)
    setSelectedAccount(accountId)

    // After getting credentials
    const res = await fetch(`/api/accounts/${accountId}/reconnect`, {
      method: 'POST',
      body: JSON.stringify(credentials)
    })

    if (res.ok) {
      mutate() // Refresh account list
    }
  } catch (error) {
    console.error('Reconnection failed:', error)
  }
}
```

## Disconnection

When user clicks disconnect:

```tsx
const handleDisconnect = async (accountId) => {
  // Optional: Show confirmation dialog
  if (!confirm('Are you sure you want to disconnect this account?')) {
    return
  }

  try {
    const res = await fetch(`/api/accounts/${accountId}`, {
      method: 'DELETE'
    })

    if (res.ok) {
      mutate() // Refresh account list
    }
  } catch (error) {
    console.error('Disconnection failed:', error)
  }
}
```

## Error Scenarios

### Invalid Credentials
```json
{
  "success": false,
  "error": "Invalid API key or username"
}
```

Show error message in modal, allow retry.

### API Rate Limit
```json
{
  "success": false,
  "error": "Too many connection attempts. Please wait 1 hour."
}
```

Show error, disable button for 1 hour.

### Connection Timeout
```json
{
  "success": false,
  "error": "Connection timed out. Check your internet connection."
}
```

Show error, allow retry after delay.

### Platform Unavailable
```json
{
  "success": false,
  "error": "Alpaca API is currently unavailable"
}
```

Show error, suggest trying again later.

## Complete Implementation

### Dashboard with Multiple Accounts

```tsx
'use client'

import { useState } from 'react'
import { AccountConnectionModal } from '@/components/account-connection-modal'
import { ConnectionStatus } from '@/components/connection-status'
import { Plus } from 'lucide-react'
import useSWR from 'swr'

export function AccountsManager() {
  const [showModal, setShowModal] = useState(false)
  const { data: accounts, mutate, isLoading } = useSWR(
    '/api/accounts',
    fetch,
    { refreshInterval: 30000 }
  )

  const handleConnect = async (credentials) => {
    const res = await fetch('/api/accounts/connect', {
      method: 'POST',
      body: JSON.stringify(credentials)
    })

    if (!res.ok) throw new Error('Connection failed')

    await mutate() // Refresh list
    setShowModal(false)
  }

  const handleReconnect = async (accountId) => {
    setShowModal(true)
    // Store accountId to update existing instead of creating new
  }

  const handleDisconnect = async (accountId) => {
    if (!confirm('Disconnect this account?')) return

    const res = await fetch(`/api/accounts/${accountId}`, {
      method: 'DELETE'
    })

    if (res.ok) await mutate()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Connected Accounts</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {isLoading ? (
        <p className="text-slate-400">Loading accounts...</p>
      ) : accounts?.length === 0 ? (
        <p className="text-slate-400">No accounts connected yet</p>
      ) : (
        <div className="grid gap-4">
          {accounts.map(account => (
            <ConnectionStatus
              key={account.id}
              platform={account.platform}
              status={account.status}
              connectedAt={account.connectedAt}
              lastSync={account.lastSync}
              error={account.error}
              onReconnect={() => handleReconnect(account.id)}
              onDisconnect={() => handleDisconnect(account.id)}
            />
          ))}
        </div>
      )}

      <AccountConnectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConnect={handleConnect}
      />
    </div>
  )
}
```

## Testing Connection Flow

### Manual Testing Checklist

- [ ] Click "Connect Account" button
- [ ] Select each platform
- [ ] Enter valid credentials
- [ ] See "Connecting..." state
- [ ] See success message
- [ ] Account appears in list
- [ ] Click reconnect on error
- [ ] Click disconnect button
- [ ] Confirm disconnection works
- [ ] Test with invalid credentials
- [ ] Verify error messages display

### Automated Testing

```tsx
// With Jest & React Testing Library
import { render, screen, userEvent } from '@testing-library/react'
import { AccountConnectionModal } from '@/components/account-connection-modal'

test('connects account with valid credentials', async () => {
  const onConnect = jest.fn()
  render(
    <AccountConnectionModal
      isOpen={true}
      onClose={() => {}}
      onConnect={onConnect}
    />
  )

  // Select Alpaca
  await userEvent.click(screen.getByText('Alpaca'))

  // Enter credentials
  await userEvent.type(
    screen.getByPlaceholderText('your@email.com'),
    'test@example.com'
  )
  await userEvent.type(
    screen.getByPlaceholderText('sk_live_...'),
    'sk_live_test123'
  )

  // Click connect
  await userEvent.click(screen.getByText('Connect'))

  // Verify handler called
  expect(onConnect).toHaveBeenCalled()
})
```

## Security Considerations

1. **Credential Storage**
   - Never store API keys in localStorage
   - Use httpOnly cookies or server-side sessions
   - Encrypt keys at rest
   - Implement key rotation

2. **Transport Security**
   - Use HTTPS for all API calls
   - Validate SSL certificates
   - Use request signing when available

3. **Access Control**
   - Require re-authentication for sensitive operations
   - Implement rate limiting per user
   - Log all connection attempts
   - Alert on unusual activity

4. **Data Privacy**
   - Hide API keys from logs
   - Mask sensitive values in UI
   - Implement field-level encryption
   - Comply with platform ToS

