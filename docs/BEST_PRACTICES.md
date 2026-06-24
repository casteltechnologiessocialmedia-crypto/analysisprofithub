# API Best Practices Guide

## Overview
Essential best practices for using and maintaining the AnalysisProfitHub API.

---

## Section 1: Security Best Practices

### 1.1 API Key Management

**✅ DO:**
- Store keys in environment variables only
- Use different keys for each environment (dev, staging, prod)
- Rotate keys every 90 days
- Use scoped keys with minimal permissions
- Monitor key usage and revoke unused keys
- Set expiration dates on keys

**❌ DON'T:**
- Commit API keys to git
- Store keys in config files
- Share keys via Slack, email, or chat
- Use production keys in development
- Log API keys to console
- Hardcode keys in client-side code
- Reuse the same key across teams/environments

**Example - Secure storage:**
```env
# .env.local (never commit this)
TRADING_BOT_API_KEY=sk_live_...
MONITORING_SERVICE_API_KEY=sk_live_...
ANALYTICS_INTEGRATION_API_KEY=sk_live_...
```

```javascript
// Good: Load from env
const apiKey = process.env.TRADING_BOT_API_KEY

// Bad: Hardcoded
const apiKey = 'sk_live_abc123...'
```

### 1.2 Request Security

**Use HTTPS Only:**
```javascript
// ✓ Good - Production
const url = 'https://api.analysisprofithub.com/api/v1/users'

// ✗ Bad - HTTP in production
const url = 'http://api.analysisprofithub.com/api/v1/users'
```

**Always Validate Responses:**
```javascript
// Good: Validate structure
const response = await fetch(apiUrl, { headers })
const data = await response.json()

if (!data.data || !Array.isArray(data.data)) {
  throw new Error('Invalid response structure')
}

// Bad: Trust everything
const data = await response.json()
const users = data.data[0] // Could be undefined!
```

**Handle Sensitive Data:**
```javascript
// Good: Don't log sensitive data
if (trade.profit < 0) {
  console.log('[v0] Trade resulted in loss, details in logs')
  logToSecureService(trade)
}

// Bad: Logging sensitive data
console.log('User balance:', userData.balance)
console.log('Trade details:', JSON.stringify(trade))
```

---

## Section 2: Performance Best Practices

### 2.1 Rate Limiting

**Respect Rate Limits:**
```javascript
// Check remaining requests
const remaining = response.headers.get('X-RateLimit-Remaining')
const limit = response.headers.get('X-RateLimit-Limit')
console.log(`Requests remaining: ${remaining}/${limit}`)

// Stop if nearing limit
if (parseInt(remaining) < 10) {
  console.log('Approaching rate limit, backing off...')
  await delay(60000)
}
```

**Implement Exponential Backoff:**
```javascript
async function retryWithBackoff(fn, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (err) {
      if (err.status === 429) {
        const delay = Math.pow(2, i) * 1000
        console.log(`Backoff: waiting ${delay}ms...`)
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      throw err
    }
  }
}

// Usage
await retryWithBackoff(async () => {
  return fetch(apiUrl, { headers })
})
```

### 2.2 Batch Operations

**Use Batch When Possible:**
```javascript
// Bad: 100 separate requests
for (const userId of userIds) {
  const response = await fetch(`/api/v1/users/${userId}`, { headers })
  processUser(await response.json())
}

// Good: Batch request (if available)
const response = await fetch('/api/v1/users/batch', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ ids: userIds })
})
const users = await response.json()
users.forEach(processUser)
```

### 2.3 Caching

**Cache Appropriate Responses:**
```javascript
// Use Map for in-memory cache
const userCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function getUser(userId, apiKey) {
  // Check cache
  const cached = userCache.get(userId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[v0] Cache hit for user', userId)
    return cached.data
  }

  // Fetch from API
  const response = await fetch(`/api/v1/users/${userId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
  const data = await response.json()

  // Store in cache
  userCache.set(userId, { data, timestamp: Date.now() })
  return data
}
```

**Use HTTP Caching Headers:**
```javascript
// Client respects cache headers from API
const response = await fetch(apiUrl, {
  headers: { 'Authorization': `Bearer ${apiKey}` }
})

// Server might return:
// Cache-Control: public, max-age=300
// (tells clients to cache for 5 minutes)
```

### 2.4 Pagination

**Always Use Pagination:**
```javascript
// Good: Fetch in pages
async function getAllTrades(apiKey) {
  const trades = []
  let offset = 0
  const limit = 100

  while (true) {
    const response = await fetch(
      `/api/v1/trades?limit=${limit}&offset=${offset}`,
      { headers: { 'Authorization': `Bearer ${apiKey}` } }
    )
    
    const data = await response.json()
    trades.push(...data.data)

    if (data.data.length < limit) break
    offset += limit
  }

  return trades
}

// Bad: Assume all data in one request
const response = await fetch('/api/v1/trades', { headers })
const allTrades = (await response.json()).data // Could be huge!
```

---

## Section 3: Reliability Best Practices

### 3.1 Error Handling

**Handle All Error Cases:**
```javascript
async function fetchWithErrorHandling(url, apiKey) {
  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })

    // Handle HTTP errors
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed - check API key')
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded - wait before retrying')
      }
      if (response.status >= 500) {
        throw new Error('Server error - try again later')
      }
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.json()
  } catch (err) {
    console.error('[v0] API request failed:', err.message)
    throw err // Re-throw for caller to handle
  }
}
```

**Provide Fallbacks:**
```javascript
async function getTradeData(apiKey) {
  try {
    return await fetchTrades(apiKey)
  } catch (err) {
    console.warn('[v0] Failed to fetch fresh data, using cache:', err.message)
    return getCachedTrades() // Fallback to cache
  }
}
```

### 3.2 Timeouts

**Set Request Timeouts:**
```javascript
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

// Usage
try {
  const response = await fetchWithTimeout(
    '/api/v1/users',
    { headers },
    5000 // 5 second timeout
  )
} catch (err) {
  if (err.name === 'AbortError') {
    console.error('Request timed out')
  }
}
```

### 3.3 Logging

**Log Effectively:**
```javascript
// Good: Structured logging with context
const logger = {
  info: (msg, data) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data),
  error: (msg, data) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, data),
  warn: (msg, data) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, data)
}

logger.info('[v0] Fetching user trades', { userId, limit: 10 })
try {
  const trades = await fetchTrades(apiKey)
  logger.info('[v0] Trades fetched', { count: trades.length })
} catch (err) {
  logger.error('[v0] Failed to fetch trades', { error: err.message })
}

// Bad: Inconsistent logging
console.log('getting trades')
console.log(userObject) // Could be sensitive!
console.error('error') // No context
```

---

## Section 4: Development Best Practices

### 4.1 Environment Management

**Separate Environments:**
```env
# .env.development
API_BASE_URL=http://localhost:3000
API_KEY=sk_dev_...
LOG_LEVEL=debug

# .env.staging (not in git)
API_BASE_URL=https://staging.analysisprofithub.com
API_KEY=sk_staging_...
LOG_LEVEL=info

# .env.production (not in git)
API_BASE_URL=https://api.analysisprofithub.com
API_KEY=sk_prod_...
LOG_LEVEL=error
```

**Load Correctly:**
```javascript
const apiKey = process.env[`API_KEY_${process.env.NODE_ENV.toUpperCase()}`]
const apiUrl = process.env[`API_URL_${process.env.NODE_ENV.toUpperCase()}`]
```

### 4.2 Configuration

**Use Configuration Files:**
```javascript
// config/api.js
export const apiConfig = {
  development: {
    baseUrl: 'http://localhost:3000',
    timeout: 30000,
    retries: 3,
    logLevel: 'debug'
  },
  production: {
    baseUrl: 'https://api.analysisprofithub.com',
    timeout: 10000,
    retries: 1,
    logLevel: 'error'
  }
}

export default apiConfig[process.env.NODE_ENV]
```

### 4.3 Testing

**Write Tests for Critical Paths:**
```javascript
// tests/api-critical.test.js
describe('Critical API Operations', () => {
  test('Should fetch user balance', async () => {
    const balance = await getBalance(testUserId, testApiKey)
    expect(balance).toBeGreaterThanOrEqual(0)
  })

  test('Should handle API errors gracefully', async () => {
    const result = await getBalance('invalid_id', 'invalid_key')
    expect(result).toEqual(null) // Fallback
  })

  test('Should respect rate limits', async () => {
    // Test rate limiting behavior
  })
})
```

---

## Section 5: Monitoring & Observability

### 5.1 Health Checks

**Implement Health Endpoints:**
```javascript
export async function checkAPIHealth(apiKey) {
  const checks = {
    users: false,
    trades: false,
    market: false,
    analytics: false
  }

  for (const endpoint of Object.keys(checks)) {
    try {
      const response = await fetch(
        `/api/v1/${endpoint}?limit=1`,
        { headers: { 'Authorization': `Bearer ${apiKey}` } }
      )
      checks[endpoint] = response.ok
    } catch (err) {
      checks[endpoint] = false
    }
  }

  return checks
}

// Check regularly
setInterval(async () => {
  const health = await checkAPIHealth(apiKey)
  const allHealthy = Object.values(health).every(v => v)
  
  if (!allHealthy) {
    console.warn('[v0] API health check failed:', health)
    alertOps(health)
  }
}, 5 * 60 * 1000) // Every 5 minutes
```

### 5.2 Metrics

**Track Key Metrics:**
```javascript
const metrics = {
  requestCount: 0,
  errorCount: 0,
  totalLatency: 0,
  rateLimitHits: 0
}

async function trackRequest(fn) {
  const start = Date.now()
  metrics.requestCount++

  try {
    return await fn()
  } catch (err) {
    metrics.errorCount++
    if (err.status === 429) {
      metrics.rateLimitHits++
    }
    throw err
  } finally {
    metrics.totalLatency += Date.now() - start
  }
}

// Report metrics
setInterval(() => {
  console.log('[v0] Metrics:', {
    requests: metrics.requestCount,
    errors: metrics.errorCount,
    avgLatency: metrics.totalLatency / metrics.requestCount,
    rateLimitHits: metrics.rateLimitHits
  })
}, 60000)
```

---

## Section 6: Common Pitfalls

### Pitfall 1: Not Handling Network Errors
```javascript
// ✗ Bad: Assumes network always works
const data = await fetch(url).then(r => r.json())

// ✓ Good: Handles network failures
try {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return await response.json()
} catch (err) {
  console.error('Network error:', err)
  return fallbackData
}
```

### Pitfall 2: Leaking Sensitive Data
```javascript
// ✗ Bad: Logging passwords
console.log('User login:', { email, password })

// ✓ Good: Mask sensitive data
console.log('User login:', { email, password: '***' })
```

### Pitfall 3: Ignoring Rate Limits
```javascript
// ✗ Bad: No rate limit handling
for (let i = 0; i < 10000; i++) {
  await fetch(apiUrl, { headers })
}

// ✓ Good: Respect rate limits
const requests = []
for (let i = 0; i < 10000; i++) {
  requests.push(fetch(apiUrl, { headers }))
  if (requests.length >= 50) {
    await Promise.all(requests)
    requests.length = 0
    await delay(1000)
  }
}
```

### Pitfall 4: Not Validating Input
```javascript
// ✗ Bad: Trust user input
const userId = request.query.userId
await fetchUser(userId)

// ✓ Good: Validate input
const userId = request.query.userId
if (!userId || typeof userId !== 'string' || userId.length > 50) {
  throw new Error('Invalid userId')
}
await fetchUser(userId)
```

---

## Checklist

### Before Going to Production
- [ ] API keys are in env vars, not hardcoded
- [ ] Using HTTPS
- [ ] Error handling for all cases
- [ ] Rate limiting handled
- [ ] Sensitive data not logged
- [ ] Tests pass
- [ ] Monitoring configured
- [ ] Health checks working
- [ ] Documentation updated
- [ ] Security review completed

---

## Resources

- See `/docs/DEVELOPER_GUIDE.md` for setup
- See `/docs/TESTING_GUIDE.md` for testing
- See `/docs/EXAMPLES.md` for code samples
