# API Quick Start

## 5-Minute Setup

### 1. Run Database Migration
```sql
-- Run in Supabase SQL Editor
-- See supabase/migrations/create_api_keys_table.sql
```

### 2. Create API Key
```bash
curl -X POST https://your-domain.com/api/admin/keys \
  -H "Content-Type: application/json" \
  -d '{
    "appName": "My App",
    "scope": ["users:read", "trades:read", "analytics:read"],
    "rateLimit": 100
  }'
```

### 3. Use the API
```bash
# List users
curl -H "Authorization: Bearer sk_xxx" \
  https://your-domain.com/api/v1/users

# Get analytics
curl -H "Authorization: Bearer sk_xxx" \
  https://your-domain.com/api/v1/analytics/overview
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List users |
| GET | `/api/v1/users/{loginId}` | Get user details |
| GET | `/api/v1/trades` | List trades |
| GET | `/api/v1/trades/{tradeId}` | Get trade details |
| GET | `/api/v1/market/symbols` | List symbols |
| GET | `/api/v1/analytics/overview` | Platform stats |
| GET | `/api/admin/keys` | List API keys |
| POST | `/api/admin/keys` | Create API key |
| PATCH | `/api/admin/keys/{keyId}` | Update key |
| DELETE | `/api/admin/keys/{keyId}` | Revoke key |

## Common Queries

### Get all real traders
```bash
curl -H "Authorization: Bearer sk_xxx" \
  "https://your-domain.com/api/v1/users?type=Real"
```

### Get closed trades for a user
```bash
curl -H "Authorization: Bearer sk_xxx" \
  "https://your-domain.com/api/v1/trades?loginId=user123&status=closed"
```

### Get platform performance
```bash
curl -H "Authorization: Bearer sk_xxx" \
  "https://your-domain.com/api/v1/analytics/overview?type=Real"
```

## JavaScript Fetch
```javascript
const API_KEY = 'sk_xxx';

fetch('https://your-domain.com/api/v1/users', {
  headers: { 'Authorization': `Bearer ${API_KEY}` }
})
.then(r => r.json())
.then(data => console.log(data.users));
```

## Python Requests
```python
import requests

headers = {'Authorization': 'Bearer sk_xxx'}
r = requests.get('https://your-domain.com/api/v1/users', headers=headers)
print(r.json()['users'])
```

## Response Example
```json
{
  "users": [
    {
      "loginId": "user123",
      "name": "John",
      "balance": 5000,
      "type": "Real",
      "status": "online"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 150,
    "hasMore": true
  }
}
```

## Error Response
```json
{
  "error": {
    "message": "Invalid API key",
    "code": "UNAUTHORIZED"
  }
}
```

## Read Full Documentation
- **API Reference**: `API_DOCUMENTATION.md`
- **Setup Guide**: `API_INTEGRATION_GUIDE.md`
- **Source Code**: `app/api/v1/` and `middleware/api-auth.ts`

## Rate Limits
- Default: 100 requests/minute per key
- Premium: 1000 requests/minute
- Configurable per key

## Support
Email: api-support@analysisprofithub.com
