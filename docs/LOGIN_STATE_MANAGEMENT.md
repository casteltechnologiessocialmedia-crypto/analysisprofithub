# Login State Management Guide

Complete guide to managing authentication state across your application.

## State Architecture

```
┌─────────────────────────────────────────────┐
│        Global Auth State (Context)          │
├─────────────────────────────────────────────┤
│ - User info                                 │
│ - Auth token                                │
│ - Loading state                             │
│ - Error messages                            │
└─────────────────────────────────────────────┘
           ↓           ↓           ↓
        LoginButton  Dashboard  BalanceDisplay
        (Triggers)  (Uses data) (Uses token)
```

## Authentication Context

Create a context for global auth state:

```tsx
// lib/auth-context.tsx
'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const data = await response.json()

      setUser(data.user)
      setToken(data.token)

      // Store token in httpOnly cookie (sent by server)
      // Never store in localStorage
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    setError(null)

    // Call logout endpoint to clear cookies
    fetch('/api/auth/logout', { method: 'POST' })
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      error,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

## Using the Auth Context

### In Login Button

```tsx
'use client'

import { useAuth } from '@/lib/auth-context'
import { LoginButton } from '@/components/login-button'

export function Header() {
  const { login, loading } = useAuth()

  const handleLogin = async () => {
    await login('user@example.com', 'password')
  }

  return (
    <LoginButton 
      onLogin={handleLogin}
      isLoading={loading}
    />
  )
}
```

### In Dashboard

```tsx
'use client'

import { useAuth } from '@/lib/auth-context'
import { redirect } from 'next/navigation'

export function Dashboard() {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    redirect('/login')
  }

  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      {/* Dashboard content */}
    </div>
  )
}
```

## Account Connection State

Manage account connections separately:

```tsx
// lib/accounts-context.tsx
'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface ConnectedAccount {
  id: string
  platform: string
  username: string
  status: 'connected' | 'connecting' | 'disconnected' | 'error'
  connectedAt: string
  lastSync: string
  error?: string
}

interface AccountsContextType {
  accounts: ConnectedAccount[]
  loading: boolean
  error: string | null
  connect: (credentials: any) => Promise<void>
  disconnect: (accountId: string) => Promise<void>
  reconnect: (accountId: string) => Promise<void>
  fetchAccounts: () => Promise<void>
}

const AccountsContext = createContext<AccountsContextType | undefined>(undefined)

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/accounts')
      const data = await response.json()
      setAccounts(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts')
    } finally {
      setLoading(false)
    }
  }, [])

  const connect = useCallback(async (credentials: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/accounts/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })

      if (!response.ok) throw new Error('Connection failed')

      await fetchAccounts() // Refresh list
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchAccounts])

  const disconnect = useCallback(async (accountId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Disconnection failed')

      await fetchAccounts()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnection failed')
    } finally {
      setLoading(false)
    }
  }, [fetchAccounts])

  const reconnect = useCallback(async (accountId: string) => {
    // Show connection modal again
    // User will provide new credentials
    await disconnect(accountId)
  }, [disconnect])

  return (
    <AccountsContext.Provider value={{
      accounts,
      loading,
      error,
      connect,
      disconnect,
      reconnect,
      fetchAccounts
    }}>
      {children}
    </AccountsContext.Provider>
  )
}

export function useAccounts() {
  const context = useContext(AccountsContext)
  if (!context) {
    throw new Error('useAccounts must be used within AccountsProvider')
  }
  return context
}
```

## Balance State Management

Manage balance data with SWR:

```tsx
// lib/use-balance.ts
'use client'

import useSWR from 'swr'

interface Balance {
  total: number
  available: number
  pending: number
  change24h: number
  percentChange24h: number
}

export function useBalance() {
  const { data, error, isLoading, mutate } = useSWR<Balance>(
    '/api/balance',
    fetch,
    {
      refreshInterval: 30000,      // Refresh every 30 seconds
      dedupingInterval: 10000,     // Dedupe within 10 seconds
      revalidateOnFocus: true,     // Refresh when window focused
      revalidateOnReconnect: true, // Refresh when back online
      shouldRetryOnError: true,    // Retry on error
      errorRetryCount: 3,          // Retry 3 times
      errorRetryInterval: 5000     // Wait 5s between retries
    }
  )

  return {
    balance: data,
    isLoading,
    error,
    refresh: () => mutate()
  }
}
```

## Complete Provider Setup

```tsx
// app/layout.tsx
'use client'

import { AuthProvider } from '@/lib/auth-context'
import { AccountsProvider } from '@/lib/accounts-context'

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <AuthProvider>
          <AccountsProvider>
            {children}
          </AccountsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
```

## Usage in Components

### Login Flow Example

```tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { LoginButton } from '@/components/login-button'
import { AccountConnectionModal } from '@/components/account-connection-modal'
import { useAccounts } from '@/lib/accounts-context'

export function AuthFlow() {
  const { login, isAuthenticated, loading, error } = useAuth()
  const { connect } = useAccounts()
  const [showConnectionModal, setShowConnectionModal] = useState(false)

  // Step 1: User logs in
  const handleLogin = async () => {
    await login('user@example.com', 'password')
    // After login, optionally show connection modal
    setShowConnectionModal(true)
  }

  // Step 2: User connects account
  const handleConnect = async (credentials) => {
    await connect(credentials)
    setShowConnectionModal(false)
  }

  if (isAuthenticated) {
    return <p>Logged in! Welcome back.</p>
  }

  return (
    <>
      <LoginButton onLogin={handleLogin} isLoading={loading} />
      {error && <p className="text-red-500">{error}</p>}

      <AccountConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        onConnect={handleConnect}
      />
    </>
  )
}
```

### Dashboard Example

```tsx
'use client'

import { useAuth } from '@/lib/auth-context'
import { useAccounts } from '@/lib/accounts-context'
import { useBalance } from '@/lib/use-balance'
import { BalanceDisplay } from '@/components/balance-display'
import { ConnectionStatus } from '@/components/connection-status'

export function Dashboard() {
  const { user, logout } = useAuth()
  const { accounts, fetchAccounts } = useAccounts()
  const { balance, refresh, isLoading } = useBalance()

  // Fetch accounts on mount
  React.useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1>Dashboard</h1>
        <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded">
          Logout
        </button>
      </div>

      {/* Balance */}
      {balance && (
        <BalanceDisplay
          {...balance}
          isLoading={isLoading}
          onRefresh={refresh}
          showHidden={true}
        />
      )}

      {/* Connected Accounts */}
      <div>
        <h2 className="text-xl font-bold mb-4">Connected Accounts</h2>
        <div className="space-y-4">
          {accounts.map(account => (
            <ConnectionStatus
              key={account.id}
              platform={account.platform}
              status={account.status}
              connectedAt={account.connectedAt}
              lastSync={account.lastSync}
              error={account.error}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
```

## Token Management

### Secure Token Storage

**DO NOT:**
- Store tokens in localStorage
- Store tokens in sessionStorage
- Store tokens in cookies (if they're not httpOnly)

**DO:**
- Use httpOnly cookies (set by server)
- Store temporarily in memory (loses on refresh)
- Use server-side sessions

### Token Refresh

```tsx
// lib/token-refresh.ts
let refreshPromise: Promise<string> | null = null

async function refreshToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = fetch('/api/auth/refresh', {
    method: 'POST'
  })
    .then(res => res.json())
    .then(data => {
      refreshPromise = null
      return data.token
    })

  return refreshPromise
}

// Use in API calls
export async function apiCall(url: string, options = {}) {
  let response = await fetch(url, options)

  // If unauthorized, refresh token and retry
  if (response.status === 401) {
    const newToken = await refreshToken()
    // Update headers with new token
    response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${newToken}`
      }
    })
  }

  return response
}
```

## Error Handling

```tsx
export function useAuth() {
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })

      if (response.status === 401) {
        setError('Invalid email or password')
        return
      }

      if (response.status === 429) {
        setError('Too many login attempts. Please try again later.')
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      // Success
    } catch (err) {
      setError('Network error. Please check your connection.')
    }
  }, [])

  return { error, setError }
}
```

## TypeScript Types

```tsx
// lib/types.ts
export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  lastLogin: string
}

export interface AuthToken {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  refresh_token?: string
}

export interface ConnectedAccount {
  id: string
  userId: string
  platform: string
  username: string
  status: 'connected' | 'connecting' | 'disconnected' | 'error'
  connectedAt: string
  lastSync: string
  error?: string
}

export interface Balance {
  accountId: string
  total: number
  available: number
  pending: number
  frozen: number
  change24h: number
  percentChange24h: number
  lastUpdated: string
}
```

