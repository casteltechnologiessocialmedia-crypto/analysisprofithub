# API Testing Guide

## Overview
Complete guide to testing the AnalysisProfitHub API with various tools and frameworks.

---

## Section 1: Manual Testing

### Using cURL

**1. Create an API Key**
```bash
curl -X POST http://localhost:3000/api/admin/keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-admin-token" \
  -d '{
    "name": "Test Key",
    "scopes": ["users", "trades", "market", "analytics"],
    "rate_limit": 1000
  }' | jq .
```

**2. Test Users Endpoint**
```bash
# List all users
curl -H "Authorization: Bearer YOUR_KEY_HERE" \
  http://localhost:3000/api/v1/users | jq .

# Get specific user
curl -H "Authorization: Bearer YOUR_KEY_HERE" \
  http://localhost:3000/api/v1/users/testuser | jq .

# With pagination
curl -H "Authorization: Bearer YOUR_KEY_HERE" \
  "http://localhost:3000/api/v1/users?limit=10&offset=0" | jq .
```

**3. Test Trades Endpoint**
```bash
# List trades
curl -H "Authorization: Bearer YOUR_KEY_HERE" \
  http://localhost:3000/api/v1/trades | jq .

# Get specific trade
curl -H "Authorization: Bearer YOUR_KEY_HERE" \
  http://localhost:3000/api/v1/trades/trade_123 | jq .

# Filter by user
curl -H "Authorization: Bearer YOUR_KEY_HERE" \
  "http://localhost:3000/api/v1/trades?user_id=user_123" | jq .
```

**4. Check Rate Limiting**
```bash
# See rate limit headers
curl -i -H "Authorization: Bearer YOUR_KEY_HERE" \
  http://localhost:3000/api/v1/users

# Headers to check:
# X-RateLimit-Limit: 1000
# X-RateLimit-Remaining: 999
# X-RateLimit-Reset: 1705324800
```

**5. Test Error Scenarios**
```bash
# Missing authorization
curl http://localhost:3000/api/v1/users
# Expected: 401 Unauthorized

# Invalid key
curl -H "Authorization: Bearer invalid_key" \
  http://localhost:3000/api/v1/users
# Expected: 401 Unauthorized

# Invalid endpoint
curl -H "Authorization: Bearer YOUR_KEY_HERE" \
  http://localhost:3000/api/v1/invalid
# Expected: 404 Not Found

# Rate limit exceeded (make 1000+ requests rapidly)
# Expected: 429 Too Many Requests
```

---

## Section 2: Postman Testing

### Setup

**1. Create Collection**
- Open Postman
- Create new collection: `AnalysisProfitHub API`

**2. Add Environment Variables**
```json
{
  "base_url": "http://localhost:3000",
  "api_key": "YOUR_KEY_HERE",
  "admin_token": "test-admin-token"
}
```

**3. Create Requests**

**Request 1: Create API Key**
```
POST {{base_url}}/api/admin/keys
Headers:
  Authorization: Bearer {{admin_token}}
  Content-Type: application/json

Body:
{
  "name": "Postman Test Key",
  "scopes": ["users", "trades", "market", "analytics"],
  "rate_limit": 1000,
  "expiry_days": 7
}
```

**Request 2: Get Users**
```
GET {{base_url}}/api/v1/users
Headers:
  Authorization: Bearer {{api_key}}

Pre-request Script:
console.log("Getting users list...")

Tests:
pm.test("Status is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response is array", function () {
    pm.expect(pm.response.json().data).to.be.an('array');
});
```

**Request 3: Get Trades**
```
GET {{base_url}}/api/v1/trades?limit=10
Headers:
  Authorization: Bearer {{api_key}}

Tests:
pm.test("Response time < 1000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(1000);
});

pm.test("Has pagination info", function () {
    pm.expect(pm.response.json()).to.have.property('total');
    pm.expect(pm.response.json()).to.have.property('limit');
});
```

---

## Section 3: JavaScript/Node.js Testing

### Using fetch API

```javascript
// tests/api.test.js
const BASE_URL = 'http://localhost:3000'
const API_KEY = 'YOUR_KEY_HERE'

async function testUsersEndpoint() {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/users`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    console.log('✓ Users endpoint works')
    console.log(`  Found ${data.data.length} users`)
    
    return true
  } catch (err) {
    console.error('✗ Users endpoint failed:', err.message)
    return false
  }
}

async function testTradesEndpoint() {
  try {
    const response = await fetch(
      `${BASE_URL}/api/v1/trades?limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    console.log('✓ Trades endpoint works')
    console.log(`  Found ${data.total} total trades`)
    
    // Check rate limit headers
    const remaining = response.headers.get('X-RateLimit-Remaining')
    console.log(`  Rate limit remaining: ${remaining}`)
    
    return true
  } catch (err) {
    console.error('✗ Trades endpoint failed:', err.message)
    return false
  }
}

async function testRateLimiting() {
  console.log('\nTesting rate limiting...')
  const requests = 100
  let successful = 0

  for (let i = 0; i < requests; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/users`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      })
      if (response.ok) successful++
      
      if (response.status === 429) {
        console.log(`✓ Rate limit hit at request ${i + 1}`)
        return true
      }
    } catch (err) {
      console.error(`Request ${i + 1} failed:`, err.message)
    }
  }

  console.log(`✓ Completed ${requests} requests, ${successful} successful`)
  return true
}

async function testErrorHandling() {
  console.log('\nTesting error handling...')
  const tests = [
    {
      name: 'Missing API Key',
      url: `${BASE_URL}/api/v1/users`,
      headers: {},
      expectedStatus: 401
    },
    {
      name: 'Invalid API Key',
      url: `${BASE_URL}/api/v1/users`,
      headers: { 'Authorization': 'Bearer invalid_key' },
      expectedStatus: 401
    },
    {
      name: 'Invalid Endpoint',
      url: `${BASE_URL}/api/v1/invalid`,
      headers: { 'Authorization': `Bearer ${API_KEY}` },
      expectedStatus: 404
    }
  ]

  for (const test of tests) {
    try {
      const response = await fetch(test.url, {
        headers: test.headers
      })
      
      if (response.status === test.expectedStatus) {
        console.log(`✓ ${test.name}: Got expected ${test.expectedStatus}`)
      } else {
        console.log(`✗ ${test.name}: Expected ${test.expectedStatus}, got ${response.status}`)
      }
    } catch (err) {
      console.error(`✗ ${test.name} failed:`, err.message)
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log('Starting API Tests...\n')
  
  await testUsersEndpoint()
  await testTradesEndpoint()
  await testRateLimiting()
  await testErrorHandling()
  
  console.log('\n✓ All tests completed!')
}

runAllTests().catch(console.error)
```

**Run tests:**
```bash
node tests/api.test.js
```

### Using Jest

```javascript
// tests/api.jest.test.js
describe('API Endpoints', () => {
  const BASE_URL = 'http://localhost:3000'
  const API_KEY = process.env.TEST_API_KEY

  beforeAll(() => {
    if (!API_KEY) {
      throw new Error('TEST_API_KEY not set')
    }
  })

  describe('GET /api/v1/users', () => {
    test('should return 200 with user list', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/users`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('data')
      expect(Array.isArray(data.data)).toBe(true)
    })

    test('should include rate limit headers', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/users`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      })

      expect(response.headers.get('X-RateLimit-Limit')).toBeTruthy()
      expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy()
    })
  })

  describe('GET /api/v1/trades', () => {
    test('should return paginated trades', async () => {
      const response = await fetch(
        `${BASE_URL}/api/v1/trades?limit=10&offset=0`,
        { headers: { 'Authorization': `Bearer ${API_KEY}` } }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('total')
      expect(data).toHaveProperty('data')
      expect(data.data.length).toBeLessThanOrEqual(10)
    })
  })

  describe('Authentication', () => {
    test('should reject missing authorization', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/users`)
      expect(response.status).toBe(401)
    })

    test('should reject invalid key', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/users`, {
        headers: { 'Authorization': 'Bearer invalid_key' }
      })
      expect(response.status).toBe(401)
    })
  })
})
```

**Run Jest tests:**
```bash
npm test
```

---

## Section 4: Python Testing

```python
# tests/test_api.py
import requests
import time
import json

BASE_URL = "http://localhost:3000"
API_KEY = "YOUR_KEY_HERE"

def test_users_endpoint():
    """Test getting users list"""
    response = requests.get(
        f"{BASE_URL}/api/v1/users",
        headers={"Authorization": f"Bearer {API_KEY}"}
    )
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert "data" in data, "Response missing 'data' field"
    assert isinstance(data["data"], list), "'data' should be list"
    print("✓ Users endpoint works")

def test_trades_endpoint():
    """Test getting trades list"""
    response = requests.get(
        f"{BASE_URL}/api/v1/trades?limit=5",
        headers={"Authorization": f"Bearer {API_KEY}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "total" in data, "Response missing pagination"
    print(f"✓ Trades endpoint works (total: {data['total']})")

def test_rate_limiting():
    """Test rate limit headers"""
    response = requests.get(
        f"{BASE_URL}/api/v1/users",
        headers={"Authorization": f"Bearer {API_KEY}"}
    )
    
    assert "X-RateLimit-Limit" in response.headers
    assert "X-RateLimit-Remaining" in response.headers
    limit = response.headers.get("X-RateLimit-Limit")
    remaining = response.headers.get("X-RateLimit-Remaining")
    print(f"✓ Rate limit: {remaining}/{limit}")

def test_authentication_errors():
    """Test authentication failures"""
    # Missing auth
    response = requests.get(f"{BASE_URL}/api/v1/users")
    assert response.status_code == 401, "Should reject missing auth"
    
    # Invalid key
    response = requests.get(
        f"{BASE_URL}/api/v1/users",
        headers={"Authorization": "Bearer invalid"}
    )
    assert response.status_code == 401, "Should reject invalid key"
    print("✓ Authentication errors handled correctly")

def test_pagination():
    """Test pagination"""
    response = requests.get(
        f"{BASE_URL}/api/v1/trades?limit=5&offset=10",
        headers={"Authorization": f"Bearer {API_KEY}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) <= 5, "Should respect limit"
    print(f"✓ Pagination works (got {len(data['data'])} items)")

if __name__ == "__main__":
    print("Running API tests...\n")
    test_users_endpoint()
    test_trades_endpoint()
    test_rate_limiting()
    test_authentication_errors()
    test_pagination()
    print("\n✓ All tests passed!")
```

**Run Python tests:**
```bash
pip install requests
python tests/test_api.py
```

---

## Section 5: Test Checklist

### Functionality Tests
- [ ] Users endpoint returns data
- [ ] Trades endpoint returns data
- [ ] Market endpoint returns symbols
- [ ] Analytics endpoint returns stats
- [ ] Pagination works correctly
- [ ] Filtering works correctly
- [ ] Sorting works correctly

### Authentication Tests
- [ ] Missing auth header returns 401
- [ ] Invalid key returns 401
- [ ] Valid key allows access
- [ ] Expired key returns 401
- [ ] Key with limited scope works

### Rate Limiting Tests
- [ ] Rate limit headers present
- [ ] Requests tracked correctly
- [ ] Limit enforced at threshold
- [ ] 429 returned when exceeded
- [ ] Reset works after window

### Error Handling Tests
- [ ] 404 for invalid endpoints
- [ ] 400 for invalid parameters
- [ ] 500 for database errors
- [ ] Error messages are clear
- [ ] No sensitive data in errors

### Performance Tests
- [ ] Response < 1 second
- [ ] Large payloads handled
- [ ] Concurrent requests work
- [ ] Memory usage reasonable

---

## Automation Scripts

### Test All Endpoints

```bash
#!/bin/bash
# test-all.sh

API_KEY="YOUR_KEY_HERE"
BASE_URL="http://localhost:3000"

echo "Testing API Endpoints..."

# Test 1: Users
echo -n "GET /api/v1/users ... "
if curl -s -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/v1/users" > /dev/null 2>&1; then
  echo "✓"
else
  echo "✗"
  exit 1
fi

# Test 2: Trades
echo -n "GET /api/v1/trades ... "
if curl -s -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/v1/trades" > /dev/null 2>&1; then
  echo "✓"
else
  echo "✗"
  exit 1
fi

# Test 3: Market
echo -n "GET /api/v1/market/symbols ... "
if curl -s -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/v1/market/symbols" > /dev/null 2>&1; then
  echo "✓"
else
  echo "✗"
  exit 1
fi

# Test 4: Analytics
echo -n "GET /api/v1/analytics/overview ... "
if curl -s -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/v1/analytics/overview" > /dev/null 2>&1; then
  echo "✓"
else
  echo "✗"
  exit 1
fi

echo ""
echo "✓ All endpoint tests passed!"
```

---

## Common Test Patterns

### Test with Authentication Error Handling
```javascript
async function testWithErrorHandling(url, key) {
  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${key}` }
    })
    const data = await response.json()
    
    if (!response.ok) {
      console.error(`API Error (${response.status}):`, data.error)
      return null
    }
    
    return data
  } catch (err) {
    console.error('Network error:', err.message)
    return null
  }
}
```

### Test with Retry Logic
```javascript
async function testWithRetry(url, key, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${key}` }
      })
      
      if (response.status === 429) {
        const delay = Math.pow(2, i) * 1000
        console.log(`Rate limited, retrying in ${delay}ms...`)
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      
      return await response.json()
    } catch (err) {
      if (i === maxRetries - 1) throw err
    }
  }
}
```

---

## Debugging Failed Tests

| Symptom | Cause | Solution |
|---------|-------|----------|
| 401 Unauthorized | Invalid/missing key | Check API key in Authorization header |
| 429 Too Many Requests | Rate limit hit | Wait before retrying or use new key |
| 500 Internal Error | Server error | Check server logs, verify database |
| Timeout | Server unresponsive | Ensure `npm run dev` is running |
| CORS error | Browser blocking request | Set CORS headers in API |

---

## Next Steps

1. Start with manual testing (Section 1)
2. Set up Postman (Section 2) for repeated tests
3. Write JavaScript tests (Section 3) for CI/CD
4. Add Python tests (Section 4) for automation
5. Run full test suite before deployment
