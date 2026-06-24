# API Quick Reference Card

Print-friendly reference for common API operations.

## Authentication

### API Key Header
```
Authorization: Bearer sk_live_YOUR_API_KEY
```

### Get New API Key
1. Dashboard → Integrations → API Keys
2. Click Create New Key
3. Copy immediately (shown once!)

---

## Essential Endpoints

### Get User Profile
```
GET /api/v1/users/{loginId}
```
**Returns:** Name, email, balance, trading stats

### Get Current Balance
```
GET /api/v1/users/{loginId}/balance
```
**Returns:** Total, available, pending, frozen balance

### Get Account Details
```
GET /api/v1/users/{loginId}/account
```
**Returns:** Profile, trading stats, security info

### Get Balance History
```
GET /api/v1/users/{loginId}/balance/history?days=7
```
**Returns:** Balance changes over time

### Get Transactions
```
GET /api/v1/users/{loginId}/transactions?limit=100
```
**Returns:** Deposits, withdrawals, trade profits/losses

### Get All Trades
```
GET /api/v1/trades?loginId={loginId}&limit=100
```
**Returns:** Trade list with entry/exit prices

---

## Quick Copy-Paste

### JavaScript
```javascript
const API_KEY = 'sk_live_YOUR_KEY';
const BASE = 'https://api.analysisprofithub.com/api/v1';

async function get(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  return res.json();
}

// Get user
const user = await get('/users/john_doe');

// Get balance
const balance = await get('/users/john_doe/balance');

// Get trades
const trades = await get('/trades?loginId=john_doe&limit=50');
```

### Python
```python
import requests

API_KEY = 'sk_live_YOUR_KEY'
BASE = 'https://api.analysisprofithub.com/api/v1'
headers = {'Authorization': f'Bearer {API_KEY}'}

def get(path):
    return requests.get(f'{BASE}{path}', headers=headers).json()

# Get user
user = get('/users/john_doe')

# Get balance
balance = get('/users/john_doe/balance')

# Get trades
trades = get('/trades?loginId=john_doe&limit=50')
```

### cURL
```bash
API_KEY="sk_live_YOUR_KEY"

# Get user
curl https://api.analysisprofithub.com/api/v1/users/john_doe \
  -H "Authorization: Bearer $API_KEY"

# Get balance
curl https://api.analysisprofithub.com/api/v1/users/john_doe/balance \
  -H "Authorization: Bearer $API_KEY"

# Get trades
curl "https://api.analysisprofithub.com/api/v1/trades?loginId=john_doe&limit=50" \
  -H "Authorization: Bearer $API_KEY"
```

---

## Response Format

### Success (200)
```json
{
  "success": true,
  "data": {
    // Your data here
  }
}
```

### Error (4xx/5xx)
```json
{
  "success": false,
  "error": "Error message",
  "errorCode": "ERROR_CODE"
}
```

---

## Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request |
| 401 | Unauthorized (invalid key) |
| 404 | Not found |
| 429 | Rate limited |
| 500 | Server error |

---

## Rate Limits

| Tier | Requests/Min | Requests/Day |
|------|--------------|--------------|
| Free | 100 | 144,000 |
| Premium | 500 | 720,000 |
| Enterprise | 1,000+ | Unlimited |

---

## Query Parameters

### Pagination
```
?limit=100&offset=0
```

### Filtering
```
?type=deposit&status=completed
```

### Date Range
```
?startDate=2024-06-01&endDate=2024-06-30
```

### Time Series
```
?days=7&limit=100
```

---

## Field Reference

### User Object
```json
{
  "loginId": "john_doe",
  "email": "john@example.com",
  "balance": 50000.50,
  "totalTrades": 245,
  "winRate": 65.5
}
```

### Balance Object
```json
{
  "balance": 50000.50,
  "availableBalance": 48000.50,
  "pendingBalance": 2000.00,
  "frozenBalance": 0.00
}
```

### Trade Object
```json
{
  "id": "trade_1245",
  "symbol": "EUR/USD",
  "type": "BUY",
  "entryPrice": 1.1050,
  "exitPrice": 1.1075,
  "quantity": 100000,
  "profit": 250.00
}
```

### Transaction Object
```json
{
  "id": "txn_12345",
  "type": "deposit|withdrawal|trade_profit|trade_loss",
  "amount": 5000.00,
  "timestamp": "2024-06-20T10:30:00Z",
  "status": "completed|pending|failed"
}
```

---

## Environment Variables

```env
# .env file
API_KEY=sk_live_YOUR_API_KEY
API_BASE_URL=https://api.analysisprofithub.com/api/v1
LOGIN_ID=john_doe
```

---

## Troubleshooting

### 401 Unauthorized
- Check API key is correct
- Verify key hasn't expired
- Generate new key if needed

### 404 Not Found
- Verify loginId spelling
- Check if user exists
- Ensure endpoint path is correct

### 429 Rate Limited
- Wait 60 seconds
- Upgrade to higher tier
- Implement exponential backoff

### CORS Issues
- Check request headers
- Use proxy if on frontend
- Verify origin is whitelisted

---

## OAuth Quick Start

1. Register app in dashboard
2. Get Client ID and Client Secret
3. Redirect to:
```
https://api.analysisprofithub.com/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=YOUR_REDIRECT_URI&
  response_type=code&
  scope=users:read+trades:read+balance:read
```
4. User authorizes
5. Receive code in callback
6. Exchange code for token:
```
POST /oauth/token
client_id=...
client_secret=...
code=...
grant_type=authorization_code
```
7. Use token in API calls

---

## Useful Links

| Resource | URL |
|----------|-----|
| Docs Hub | `docs/INDEX.md` |
| API Reference | `API_DOCUMENTATION.md` |
| Auth Guide | `docs/AUTH_GUIDE.md` |
| Examples | `docs/EXAMPLES.md` |
| Support | support@analysisprofithub.com |

---

## Most Common Tasks

### 1. Get User Balance
```bash
curl https://api.analysisprofithub.com/api/v1/users/john_doe/balance \
  -H "Authorization: Bearer sk_live_KEY"
```

### 2. Get Account Info
```bash
curl https://api.analysisprofithub.com/api/v1/users/john_doe/account \
  -H "Authorization: Bearer sk_live_KEY"
```

### 3. List Recent Trades
```bash
curl "https://api.analysisprofithub.com/api/v1/trades?loginId=john_doe&limit=50" \
  -H "Authorization: Bearer sk_live_KEY"
```

### 4. Get Balance History
```bash
curl "https://api.analysisprofithub.com/api/v1/users/john_doe/balance/history?days=7" \
  -H "Authorization: Bearer sk_live_KEY"
```

### 5. Get Transactions
```bash
curl "https://api.analysisprofithub.com/api/v1/users/john_doe/transactions?limit=100" \
  -H "Authorization: Bearer sk_live_KEY"
```

---

## Save This File!

Bookmark or print this page for quick reference.

Last updated: June 2024
