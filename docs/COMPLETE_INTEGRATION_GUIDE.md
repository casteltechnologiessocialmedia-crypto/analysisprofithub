# Complete Login & Account Flow Integration Guide

Full step-by-step guide to integrate all login and account connection components.

## Quick Start (15 minutes)

### 1. Setup Providers

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

### 2. Create Login Page

```tsx
// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { LoginButton } from '@/components/login-button'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const { login, error, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md space-y-6 p-8 rounded-2xl bg-slate-800 border border-slate-700">
        <h1 className="text-3xl font-bold text-white">Sign In</h1>

        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
          />
        </div>

        {error && <p className="text-red-400">{error}</p>}

        <LoginButton
          onLogin={handleLogin}
          isLoading={loading}
          size="lg"
          className="w-full"
        />
      </div>
    </div>
  )
}
```

### 3. Create Dashboard

```tsx
// app/dashboard/page.tsx
'use client'

import { useAuth } from '@/lib/auth-context'
import { useAccounts } from '@/lib/accounts-context'
import { useBalance } from '@/lib/use-balance'
import { BalanceDisplay } from '@/components/balance-display'
import { ConnectionStatus } from '@/components/connection-status'
import { AccountConnectionModal } from '@/components/account-connection-modal'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const { user, logout, isAuthenticated } = useAuth()
  const { accounts, fetchAccounts, connect } = useAccounts()
  const { balance, refresh, isLoading } = useBalance()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    } else {
      fetchAccounts()
    }
  }, [isAuthenticated, router, fetchAccounts])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-2">Welcome, {user?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Logout
          </button>
        </div>

        {/* Balance Overview */}
        {balance && (
          <BalanceDisplay
            totalBalance={balance.total}
            availableBalance={balance.available}
            pendingBalance={balance.pending}
            change24h={balance.change24h}
            percentChange24h={balance.percentChange24h}
            isLoading={isLoading}
            onRefresh={refresh}
            showHidden={true}
          />
        )}

        {/* Connected Accounts */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Connected Accounts</h2>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
            >
              + Add Account
            </button>
          </div>

          {accounts.length === 0 ? (
            <p className="text-slate-400">No accounts connected. Click "Add Account" to get started.</p>
          ) : (
            <div className="space-y-4">
              {accounts.map(account => (
                <ConnectionStatus
                  key={account.id}
                  platform={account.platform}
                  status={account.status}
                  connectedAt={account.connectedAt}
                  lastSync={account.lastSync}
                  error={account.error}
                  onReconnect={() => setShowModal(true)}
                  onDisconnect={() => {
                    // Implement disconnect logic
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Connection Modal */}
        <AccountConnectionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConnect={async (credentials) => {
            await connect(credentials)
            setShowModal(false)
          }}
        />
      </div>
    </div>
  )
}
```

---

## Backend Setup

### 1. Login Endpoint

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    // Get user data from database
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, created_at, last_login')
      .eq('id', data.user.id)
      .single()

    // Update last_login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id)

    // Create response with httpOnly cookie
    const response = NextResponse.json({
      success: true,
      user,
      token: data.session?.access_token
    })

    // Set secure httpOnly cookie
    response.cookies.set('auth_token', data.session?.access_token || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 2. Logout Endpoint

```typescript
// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })

  // Clear auth cookie
  response.cookies.delete('auth_token')

  return response
}
```

### 3. Account Connection Endpoint

```typescript
// app/api/accounts/connect/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { platform, username, apiKey } = await request.json()

    // Get user from auth token
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify platform API credentials
    const isValid = await verifyPlatformCredentials(platform, username, apiKey)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid platform credentials' },
        { status: 400 }
      )
    }

    // Encrypt API key
    const encryptedKey = encryptKey(apiKey)

    // Store in database
    const { data: account, error } = await supabase
      .from('connected_accounts')
      .insert({
        user_id: user.id,
        platform,
        username,
        api_key: encryptedKey,
        status: 'connected',
        connected_at: new Date().toISOString(),
        last_sync: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      account: {
        ...account,
        api_key: undefined // Don't return encrypted key
      }
    })
  } catch (error) {
    console.error('Connection error:', error)
    return NextResponse.json(
      { error: 'Failed to connect account' },
      { status: 500 }
    )
  }
}

function encryptKey(key: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY || '')
  let encrypted = cipher.update(key, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

async function verifyPlatformCredentials(
  platform: string,
  username: string,
  apiKey: string
): Promise<boolean> {
  // Implement platform-specific verification
  // For example, test the API key with a simple request
  try {
    if (platform === 'alpaca') {
      const response = await fetch('https://api.alpaca.markets/v2/account', {
        headers: {
          'APCA-API-KEY-ID': username,
          'APCA-API-SECRET-KEY': apiKey
        }
      })
      return response.ok
    }
    // Add other platforms...
    return false
  } catch (error) {
    return false
  }
}
```

### 4. Balance Endpoint

```typescript
// app/api/balance/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get balance from database or calculate from accounts
    const { data: balance } = await supabase
      .from('account_balances')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!balance) {
      return NextResponse.json({
        total: 0,
        available: 0,
        pending: 0,
        change24h: 0,
        percentChange24h: 0,
        lastUpdated: new Date().toISOString()
      })
    }

    return NextResponse.json(balance)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    )
  }
}
```

---

## Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Connected accounts
CREATE TABLE connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  platform TEXT NOT NULL,
  username TEXT NOT NULL,
  api_key TEXT NOT NULL, -- Encrypted
  status TEXT DEFAULT 'connected',
  connected_at TIMESTAMP DEFAULT NOW(),
  last_sync TIMESTAMP DEFAULT NOW(),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Account balances
CREATE TABLE account_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  account_id UUID REFERENCES connected_accounts(id),
  total DECIMAL(20, 2) DEFAULT 0,
  available DECIMAL(20, 2) DEFAULT 0,
  pending DECIMAL(20, 2) DEFAULT 0,
  frozen DECIMAL(20, 2) DEFAULT 0,
  change_24h DECIMAL(20, 2) DEFAULT 0,
  percent_change_24h DECIMAL(10, 4) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_connected_accounts_user_id ON connected_accounts(user_id);
CREATE INDEX idx_account_balances_user_id ON account_balances(user_id);
```

---

## File Structure

```
app/
├── api/
│   ├── auth/
│   │   ├── login/route.ts
│   │   ├── logout/route.ts
│   │   └── refresh/route.ts
│   ├── accounts/
│   │   ├── route.ts
│   │   ├── connect/route.ts
│   │   └── [id]/route.ts
│   └── balance/route.ts
├── dashboard/page.tsx
├── login/page.tsx
└── layout.tsx

components/
├── login-button.tsx
├── account-connection-modal.tsx
├── connection-status.tsx
└── balance-display.tsx

lib/
├── auth-context.tsx
├── accounts-context.tsx
├── use-balance.ts
├── supabase.ts
└── types.ts

docs/
├── LOGIN_FLOW_GUIDE.md
├── ACCOUNT_CONNECTION_GUIDE.md
├── BALANCE_MANAGEMENT_GUIDE.md
├── LOGIN_STATE_MANAGEMENT.md
└── COMPLETE_INTEGRATION_GUIDE.md
```

---

## Testing

### Manual Testing Checklist

- [ ] Login with valid credentials → Redirects to dashboard
- [ ] Login with invalid credentials → Shows error
- [ ] Account connection modal opens → Shows platform selection
- [ ] Select platform → Shows credential form
- [ ] Enter valid credentials → Connects successfully
- [ ] Enter invalid credentials → Shows error
- [ ] Disconnect account → Removes from list
- [ ] Balance updates every 30 seconds → Real-time refresh works
- [ ] Click balance refresh → Immediate update
- [ ] Hide balance toggle → Works correctly
- [ ] Logout → Returns to login page

### Unit Tests

```tsx
import { render, screen, userEvent } from '@testing-library/react'
import { LoginPage } from '@/app/login/page'

describe('Login Flow', () => {
  test('displays login form', () => {
    render(<LoginPage />)
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
  })

  test('submits login on button click', async () => {
    render(<LoginPage />)
    
    await userEvent.type(
      screen.getByPlaceholderText('Email'),
      'test@example.com'
    )
    await userEvent.type(
      screen.getByPlaceholderText('Password'),
      'password123'
    )
    await userEvent.click(screen.getByText('Sign In'))

    // Assert API call was made
  })
})
```

---

## Troubleshooting

### Issue: "Cannot use client component in server context"
**Solution**: Add `'use client'` at top of component file

### Issue: Token not persisting after refresh
**Solution**: Ensure server sets httpOnly cookie, not localStorage

### Issue: Balance not updating
**Solution**: Check SWR refreshInterval, verify API endpoint returns data

### Issue: Account connection fails
**Solution**: Verify platform API credentials, check encryption key set

---

## Production Checklist

- [ ] HTTPS enabled
- [ ] Environment variables configured
- [ ] Database backups scheduled
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Error monitoring (Sentry) set up
- [ ] Logging configured
- [ ] Performance monitoring set up
- [ ] Security headers added
- [ ] SQL injection prevention tested
- [ ] XSS prevention verified
- [ ] CSRF tokens implemented
- [ ] Load testing completed
- [ ] Incident response plan ready

