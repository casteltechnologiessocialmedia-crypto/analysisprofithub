# Login Button & Authentication Flow Guide

Complete guide to implementing user login flows with account connection and balance tracking.

## Overview

The login flow consists of 4 integrated components:
1. **LoginButton** - Entry point for authentication
2. **AccountConnectionModal** - Connect trading accounts
3. **ConnectionStatus** - Display connection state
4. **BalanceDisplay** - Show account balances

## Components

### 1. LoginButton Component

Entry point for user authentication with loading states.

**Props:**
```tsx
interface LoginButtonProps {
  onLogin: () => Promise<void>        // Called when user clicks login
  isLoading?: boolean                 // External loading state
  disabled?: boolean                  // Disable button
  className?: string                  // Custom styles
  variant?: 'primary' | 'secondary'   // Button style
  size?: 'sm' | 'md' | 'lg'          // Button size
}
```

**Usage:**
```tsx
import { LoginButton } from '@/components/login-button'

export function Header() {
  const handleLogin = async () => {
    // Call your auth API
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ credentials })
    })
    // Handle response
  }

  return <LoginButton onLogin={handleLogin} variant="primary" size="lg" />
}
```

**Styling:**
- **Primary**: Indigo gradient with shadow effects
- **Secondary**: Slate gradient for secondary actions
- **Outline**: Border style for tertiary actions

---

### 2. AccountConnectionModal Component

Modal for users to connect external trading accounts.

**Props:**
```tsx
interface AccountConnectionModalProps {
  isOpen: boolean                             // Show/hide modal
  onClose: () => void                         // Close handler
  onConnect: (credentials: ConnectionCredentials) => Promise<void>
  isLoading?: boolean                         // Loading state
}

interface ConnectionCredentials {
  platform: string                    // e.g., 'alpaca', 'binance'
  username: string                    // User's platform username
  apiKey: string                      // Platform API key
}
```

**Flow:**
1. **Select Platform** - Choose trading platform (Alpaca, Binance, Kraken, Coinbase)
2. **Enter Credentials** - Input username and API key
3. **Confirming** - Verify credentials with platform
4. **Success/Error** - Display result

**Usage:**
```tsx
import { AccountConnectionModal } from '@/components/account-connection-modal'
import { useState } from 'react'

export function Dashboard() {
  const [isOpen, setIsOpen] = useState(false)

  const handleConnect = async (credentials) => {
    const response = await fetch('/api/accounts/connect', {
      method: 'POST',
      body: JSON.stringify(credentials)
    })
    // Handle response
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Connect Account</button>
      <AccountConnectionModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConnect={handleConnect}
      />
    </>
  )
}
```

**Security:**
- API keys shown as password by default
- Toggle visibility with eye icon
- Keys never logged or stored in plain text
- Encrypted in transit and at rest

---

### 3. ConnectionStatus Component

Display current connection status for trading accounts.

**Props:**
```tsx
interface ConnectionStatusProps {
  platform: string                    // e.g., 'Alpaca'
  status: 'connected' | 'connecting' | 'disconnected' | 'error'
  connectedAt?: string               // ISO date string
  lastSync?: string                  // ISO timestamp
  onReconnect?: () => void           // Reconnect handler
  onDisconnect?: () => void          // Disconnect handler
  isLoading?: boolean                // Loading state
  error?: string                     // Error message
}
```

**Status States:**

| Status | Color | Icon | Action |
|--------|-------|------|--------|
| connected | Green | ✓ | Disconnect button |
| connecting | Blue | ⟳ | Loading spinner |
| disconnected | Gray | ⏱ | Reconnect button |
| error | Red | ⚠ | Reconnect button |

**Usage:**
```tsx
import { ConnectionStatus } from '@/components/connection-status'

export function AccountsPanel() {
  const [accounts, setAccounts] = useState([])

  return (
    <div className="space-y-4">
      {accounts.map(account => (
        <ConnectionStatus
          key={account.id}
          platform={account.platform}
          status={account.status}
          connectedAt={account.connectedAt}
          lastSync={account.lastSync}
          onReconnect={() => handleReconnect(account.id)}
          onDisconnect={() => handleDisconnect(account.id)}
        />
      ))}
    </div>
  )
}
```

---

### 4. BalanceDisplay Component

Show account balances with real-time updates.

**Props:**
```tsx
interface BalanceDisplayProps {
  totalBalance: number               // Total account balance
  availableBalance: number           // Available for trading
  pendingBalance: number             // Pending transactions
  change24h: number                 // Balance change in last 24h
  percentChange24h: number          // Percentage change
  currency?: string                 // Currency code (USD, EUR)
  isLoading?: boolean               // Loading state
  onRefresh?: () => Promise<void>   // Refresh handler
  showHidden?: boolean              // Show hide toggle
  className?: string                // Custom styles
}
```

**Features:**
- Real-time balance display
- 24-hour change tracking
- Currency formatting
- Balance breakdown (Available/Pending)
- Hide sensitive data toggle
- Refresh capability

**Usage:**
```tsx
import { BalanceDisplay } from '@/components/balance-display'
import useSWR from 'swr'

export function BalancePanel() {
  const { data, mutate } = useSWR('/api/balance', fetcher)

  return (
    <BalanceDisplay
      totalBalance={data?.total || 0}
      availableBalance={data?.available || 0}
      pendingBalance={data?.pending || 0}
      change24h={data?.change24h || 0}
      percentChange24h={data?.percentChange24h || 0}
      onRefresh={() => mutate()}
      showHidden={true}
    />
  )
}
```

---

## Complete Implementation Example

```tsx
'use client'

import { useState } from 'react'
import { LoginButton } from '@/components/login-button'
import { AccountConnectionModal } from '@/components/account-connection-modal'
import { ConnectionStatus } from '@/components/connection-status'
import { BalanceDisplay } from '@/components/balance-display'
import useSWR from 'swr'

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false)
  const { data: accounts } = useSWR('/api/accounts', fetch)
  const { data: balance, mutate } = useSWR('/api/balance', fetch)

  const handleLogin = async () => {
    // Implement your login logic
    const response = await fetch('/api/auth/login', {
      method: 'POST'
    })
    // Redirect on success
  }

  const handleConnect = async (credentials) => {
    await fetch('/api/accounts/connect', {
      method: 'POST',
      body: JSON.stringify(credentials)
    })
    setShowModal(false)
  }

  return (
    <div className="space-y-6">
      {/* Login */}
      <div>
        <LoginButton onLogin={handleLogin} />
      </div>

      {/* Balance Overview */}
      <BalanceDisplay
        totalBalance={balance?.total || 0}
        availableBalance={balance?.available || 0}
        pendingBalance={balance?.pending || 0}
        change24h={balance?.change24h || 0}
        percentChange24h={balance?.percentChange24h || 0}
        onRefresh={() => mutate()}
        showHidden={true}
      />

      {/* Connected Accounts */}
      <div>
        <h2 className="text-lg font-bold mb-4">Connected Accounts</h2>
        <div className="space-y-4">
          {accounts?.map(acc => (
            <ConnectionStatus
              key={acc.id}
              platform={acc.platform}
              status={acc.status}
              connectedAt={acc.connectedAt}
              lastSync={acc.lastSync}
              onReconnect={() => handleConnect(acc)}
              onDisconnect={() => handleDisconnect(acc.id)}
            />
          ))}
        </div>
      </div>

      {/* Connect New Account */}
      <button
        onClick={() => setShowModal(true)}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg"
      >
        Connect New Account
      </button>

      <AccountConnectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConnect={handleConnect}
      />
    </div>
  )
}
```

---

## API Endpoints Required

The components expect these API endpoints:

### 1. POST /api/auth/login
Authenticate user with credentials.

**Request:**
```json
{
  "username": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "email": "user@example.com"
  },
  "token": "jwt-token"
}
```

### 2. POST /api/accounts/connect
Connect external trading account.

**Request:**
```json
{
  "platform": "alpaca",
  "username": "user@example.com",
  "apiKey": "sk_live_..."
}
```

**Response:**
```json
{
  "success": true,
  "account": {
    "id": "acc-123",
    "platform": "alpaca",
    "username": "user@example.com",
    "status": "connected",
    "connectedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 3. GET /api/accounts
List all connected accounts.

**Response:**
```json
[
  {
    "id": "acc-123",
    "platform": "Alpaca",
    "status": "connected",
    "connectedAt": "2024-01-15T10:30:00Z",
    "lastSync": "2024-01-15T15:30:00Z"
  }
]
```

### 4. GET /api/balance
Get account balance information.

**Response:**
```json
{
  "total": 50000.00,
  "available": 45000.00,
  "pending": 5000.00,
  "change24h": 1200.50,
  "percentChange24h": 2.45
}
```

### 5. DELETE /api/accounts/{id}
Disconnect trading account.

---

## Error Handling

Each component handles errors gracefully:

```tsx
const handleConnect = async (credentials) => {
  try {
    const res = await fetch('/api/accounts/connect', {
      method: 'POST',
      body: JSON.stringify(credentials)
    })
    
    if (!res.ok) {
      throw new Error('Connection failed: ' + res.statusText)
    }
    
    const data = await res.json()
    // Success handling
  } catch (error) {
    // Error state shown in modal
    console.error(error)
  }
}
```

---

## Styling & Customization

All components use Tailwind CSS with custom semantic tokens:

```css
/* In globals.css */
--primary: oklch(0.55 0.25 260)    /* Indigo */
--background: oklch(0.04 0.01 240) /* Dark blue-gray */
--surface: oklch(0.13 0.02 260)    /* Slate */
```

Customize via `className` prop:

```tsx
<LoginButton
  className="bg-blue-600 hover:bg-blue-700"
  size="lg"
/>
```

---

## Best Practices

1. **Loading States** - Always show loading indicators during async operations
2. **Error Handling** - Display clear error messages to users
3. **Sensitive Data** - Use password fields for API keys, hide by default
4. **Rate Limiting** - Implement debouncing for rapid clicks
5. **Token Storage** - Store JWT tokens in httpOnly cookies
6. **Session Management** - Handle token expiration and refresh
7. **Real-time Updates** - Use WebSockets or polling for balance updates
8. **Security** - Never log or transmit credentials unencrypted

