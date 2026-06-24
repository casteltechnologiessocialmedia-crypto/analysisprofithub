# Developer Workflow Guide

## Overview
This guide covers the recommended workflow for developers working with the AnalysisProfitHub API system. It includes setup, development practices, testing, and deployment.

---

## Part 1: Initial Setup

### Prerequisites
- Node.js 18+
- npm/pnpm/yarn
- Git
- Supabase account (free tier works)
- curl or Postman (for API testing)

### Step 1: Clone & Install
```bash
git clone https://github.com/casteltechnologiessocialmedia-crypto/analysisprofithub.git
cd analysisprofithub
npm install
```

### Step 2: Environment Setup
Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# API Configuration
API_KEY_SECRET=your-secure-secret-key-32-chars-min
API_RATE_LIMIT_DEFAULT=100
API_RATE_LIMIT_WINDOW_MS=60000

# Optional: Admin token for testing
ADMIN_TOKEN=test-admin-token
```

### Step 3: Database Migration
```bash
# Run migration in Supabase SQL editor
# File: supabase/migrations/create_api_keys_table.sql
# Or use Supabase CLI:
supabase migration up
```

### Step 4: Start Dev Server
```bash
npm run dev
# Server runs on http://localhost:3000
```

---

## Part 2: Development Workflow

### Creating Your First API Key

**Option A: Via API (for testing)**
```bash
curl -X POST http://localhost:3000/api/admin/keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-admin-token" \
  -d '{
    "name": "Development Key",
    "scopes": ["users", "trades", "market", "analytics"],
    "rate_limit": 1000,
    "expiry_days": 90
  }'
```

**Response:**
```json
{
  "id": "key_123abc",
  "key": "sk_live_abcd1234...",
  "name": "Development Key",
  "scopes": ["users", "trades", "market", "analytics"],
  "rate_limit": 1000,
  "created_at": "2024-01-15T10:30:00Z",
  "expires_at": "2024-04-15T10:30:00Z"
}
```

**Save the key** - It won't be shown again!

### Testing the API Locally

**1. Fetch Users List**
```bash
curl -H "Authorization: Bearer sk_live_abcd1234..." \
  http://localhost:3000/api/v1/users
```

**2. Get Specific User**
```bash
curl -H "Authorization: Bearer sk_live_abcd1234..." \
  http://localhost:3000/api/v1/users/testuser
```

**3. Fetch Trades**
```bash
curl -H "Authorization: Bearer sk_live_abcd1234..." \
  "http://localhost:3000/api/v1/trades?limit=10&offset=0"
```

---

## Part 3: Common Development Tasks

### Task 1: Adding a New API Endpoint

**Step 1:** Create the route file
```bash
touch app/api/v1/positions/route.ts
```

**Step 2:** Implement the endpoint
```typescript
// app/api/v1/positions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey, rateLimitCheck } from '@/middleware/api-auth'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  // Verify API key
  const authResult = await verifyApiKey(request)
  if (!authResult.valid) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    )
  }

  // Check rate limit
  const rateLimitOk = await rateLimitCheck(authResult.keyId, request)
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .limit(50)

    if (error) throw error

    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    )
  }
}
```

**Step 3:** Test it
```bash
curl -H "Authorization: Bearer sk_live_..." \
  http://localhost:3000/api/v1/positions
```

### Task 2: Testing with Different Scopes

Create different API keys with limited scopes:

```bash
# Read-only key
curl -X POST http://localhost:3000/api/admin/keys \
  -H "Authorization: Bearer test-admin-token" \
  -d '{
    "name": "Read-Only Key",
    "scopes": ["users"],
    "rate_limit": 500
  }'

# Full access key
curl -X POST http://localhost:3000/api/admin/keys \
  -H "Authorization: Bearer test-admin-token" \
  -d '{
    "name": "Full Access Key",
    "scopes": ["users", "trades", "market", "analytics"],
    "rate_limit": 10000
  }'
```

### Task 3: Debugging API Calls

**Enable debug logging:**
```typescript
// In your API route
console.log('[v0] Request headers:', request.headers)
console.log('[v0] Auth result:', authResult)
console.log('[v0] Database response:', data)
```

**Check rate limit status:**
```bash
# Query rate limit logs
curl -H "Authorization: Bearer sk_live_..." \
  "http://localhost:3000/api/admin/keys/key_123/usage"
```

---

## Part 4: Best Practices During Development

### 1. API Key Management
✅ **Do:**
- Store keys in `.env.local` (never commit)
- Rotate keys regularly in production
- Use different keys for different environments
- Monitor key usage

❌ **Don't:**
- Log API keys to console
- Commit keys to git
- Share keys via Slack/email
- Use production keys in development

### 2. Error Handling
```typescript
// Good error handling
try {
  const response = await fetch(apiUrl, { headers })
  const data = await response.json()
  
  if (!response.ok) {
    console.error('[v0] API Error:', {
      status: response.status,
      message: data.error,
      timestamp: new Date().toISOString()
    })
    throw new Error(data.error)
  }
  
  return data
} catch (err) {
  console.error('[v0] Request failed:', err.message)
  throw err
}
```

### 3. Rate Limiting
- Monitor your rate limit headers
- Implement exponential backoff for retries
- Cache responses when appropriate
- Use batch endpoints for bulk operations

### 4. Testing Checklist
Before committing:
- [ ] All endpoints return expected status codes
- [ ] Rate limiting works correctly
- [ ] Error messages are clear
- [ ] Response format matches documentation
- [ ] No sensitive data in logs
- [ ] Pagination works as expected

---

## Part 5: Development Scenarios

### Scenario 1: Building a Dashboard
```typescript
// Fetch all data needed for dashboard
async function getDashboardData(apiKey: string) {
  const baseUrl = 'http://localhost:3000/api/v1'
  const headers = { 'Authorization': `Bearer ${apiKey}` }

  const [users, trades, overview] = await Promise.all([
    fetch(`${baseUrl}/users?limit=10`, { headers }).then(r => r.json()),
    fetch(`${baseUrl}/trades?limit=20`, { headers }).then(r => r.json()),
    fetch(`${baseUrl}/analytics/overview`, { headers }).then(r => r.json())
  ])

  return { users, trades, overview }
}
```

### Scenario 2: Real-time Updates
```typescript
// Poll for new trades (use WebSocket for production)
async function pollNewTrades(apiKey: string) {
  const baseUrl = 'http://localhost:3000/api/v1'
  const headers = { 'Authorization': `Bearer ${apiKey}` }

  setInterval(async () => {
    const response = await fetch(
      `${baseUrl}/trades?sort=-created_at&limit=5`,
      { headers }
    )
    const { data } = await response.json()
    console.log('[v0] New trades:', data)
  }, 5000) // Poll every 5 seconds
}
```

### Scenario 3: Error Recovery
```typescript
// Retry with exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options)
      if (response.ok) return response
      if (response.status === 429) {
        // Rate limited, wait and retry
        const delay = Math.pow(2, i) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      return response
    } catch (err) {
      if (i === maxRetries - 1) throw err
      console.log(`[v0] Retry ${i + 1}/${maxRetries}`)
    }
  }
}
```

---

## Part 6: Debugging Tips

### Common Issues

**Issue: 401 Unauthorized**
```
Cause: Invalid or missing API key
Fix: Check Authorization header format
curl -H "Authorization: Bearer YOUR_KEY_HERE"
```

**Issue: 429 Too Many Requests**
```
Cause: Rate limit exceeded
Fix: Wait before next request or reduce request frequency
curl -i (to see rate limit headers)
```

**Issue: 500 Internal Server Error**
```
Cause: Server-side error
Fix: Check server logs and database connection
npm run dev (watch terminal for errors)
```

### Debug Checklist
- [ ] Is the API server running? (`http://localhost:3000`)
- [ ] Is the API key valid? (Check in database)
- [ ] Is the key expired? (Check created_at + expiry_days)
- [ ] Is the scope correct? (Key has required scope)
- [ ] Are rate limits hit? (Check usage logs)
- [ ] Is database connected? (Check Supabase)

---

## Part 7: Deployment

### Before Deploying

1. **Test in staging:**
```bash
npm run build
npm run start
```

2. **Set production env vars in Vercel**
3. **Verify database migrations ran**
4. **Test with real API key**

### Production Checklist
- [ ] All sensitive data in env vars
- [ ] API keys are hashed in database
- [ ] Rate limiting is active
- [ ] Logging is configured
- [ ] CORS headers are set correctly
- [ ] Error messages don't leak sensitive info
- [ ] Database backups are enabled
- [ ] Monitoring is set up

---

## Part 8: Monitoring & Maintenance

### Check API Health
```bash
# See current usage
curl -H "Authorization: Bearer test-admin-token" \
  http://your-domain.com/api/admin/keys

# See rate limit status
curl -i -H "Authorization: Bearer sk_live_..." \
  http://your-domain.com/api/v1/users
# Check headers: X-RateLimit-Limit, X-RateLimit-Remaining
```

### Regular Tasks
- Review API key usage weekly
- Rotate keys quarterly
- Update documentation when endpoints change
- Monitor error rates
- Check performance metrics

---

## Quick Reference

| Task | Command |
|------|---------|
| Start dev | `npm run dev` |
| Create key | `POST /api/admin/keys` |
| Get users | `GET /api/v1/users` |
| Get trades | `GET /api/v1/trades` |
| Test locally | `curl -H "Authorization: Bearer KEY" URL` |
| View logs | Terminal window running `npm run dev` |

---

## Getting Help

- Check `/docs/INDEX.md` for navigation
- See `/docs/EXAMPLES.md` for code samples
- Read `/docs/BEST_PRACTICES.md` for standards
- Review `/docs/AUTH_GUIDE.md` for auth details

---

## Next Steps

1. Follow "Part 1: Initial Setup" above
2. Create your first API key (Part 2)
3. Test the endpoints locally
4. Read TESTING_GUIDE.md for automated testing
5. Deploy to Vercel when ready
