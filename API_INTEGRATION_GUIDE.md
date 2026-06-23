# API Integration Setup Guide

## Step 1: Database Setup

Run the SQL migration to create the required tables in your Supabase database:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query and run the contents of `supabase/migrations/create_api_keys_table.sql`

Tables created:
- `api_keys` - Stores API key metadata
- `api_key_logs` - Tracks API usage
- `api_key_audit_logs` - Audits key operations

## Step 2: Configure Environment Variables

Add these to your `.env.local` or Vercel project settings:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 3: API Files Structure

New files created:

### Authentication & Utilities
- `lib/api-keys.ts` - Key generation, hashing, validation
- `lib/rate-limiter.ts` - Rate limiting logic
- `middleware/api-auth.ts` - Authentication middleware

### Public API Endpoints (`/api/v1/`)
- `users/route.ts` - List and filter users
- `users/[loginId]/route.ts` - Get user details
- `trades/route.ts` - List and filter trades
- `trades/[tradeId]/route.ts` - Get trade details
- `market/symbols/route.ts` - List trading symbols
- `analytics/overview/route.ts` - Platform analytics

### Admin Endpoints (`/api/admin/keys/`)
- `keys/route.ts` - List and create API keys
- `keys/[keyId]/route.ts` - Manage individual keys (update, delete)

## Step 4: Create Your First API Key

### Via API (Recommended for Automation)

```bash
curl -X POST https://your-domain.com/api/admin/keys \
  -H "Content-Type: application/json" \
  -d '{
    "appName": "My Trading Bot",
    "scope": ["users:read", "trades:read", "analytics:read"],
    "rateLimit": 500,
    "expiresInDays": 365,
    "isTest": false
  }'
```

Response:
```json
{
  "message": "API key created successfully",
  "key": "sk_abcd1234efgh5678ijkl9012mnop3456",
  "keyPreview": "***9012mnop3456",
  "keyId": "550e8400-e29b-41d4-a716-446655440000",
  "appName": "My Trading Bot",
  "scope": ["users:read", "trades:read", "analytics:read"],
  "rateLimit": 500,
  "expiresAt": "2025-06-23T00:00:00Z",
  "isTest": false,
  "warning": "Save your API key now. You won't be able to see it again."
}
```

**⚠️ Save the key immediately! You won't be able to retrieve it later.**

## Step 5: Test the API

### List Users
```bash
curl -H "Authorization: Bearer sk_abcd1234efgh5678ijkl9012mnop3456" \
  https://your-domain.com/api/v1/users?limit=10
```

### Get Single User
```bash
curl -H "Authorization: Bearer sk_abcd1234efgh5678ijkl9012mnop3456" \
  https://your-domain.com/api/v1/users/user123
```

### Get Trades
```bash
curl -H "Authorization: Bearer sk_abcd1234efgh5678ijkl9012mnop3456" \
  https://your-domain.com/api/v1/trades?limit=20&status=closed
```

### Get Analytics
```bash
curl -H "Authorization: Bearer sk_abcd1234efgh5678ijkl9012mnop3456" \
  https://your-domain.com/api/v1/analytics/overview
```

## Step 6: Manage API Keys

### List All Keys
```bash
curl https://your-domain.com/api/admin/keys \
  -H "Authorization: Bearer admin-key"
```

### Update Key (Toggle Active, Change Rate Limit)
```bash
curl -X PATCH https://your-domain.com/api/admin/keys/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false,
    "rateLimit": 1000
  }'
```

### Revoke Key
```bash
curl -X DELETE https://your-domain.com/api/admin/keys/550e8400-e29b-41d4-a716-446655440000
```

## Step 7: Implement in Your External App

### JavaScript Example

```javascript
const API_KEY = 'sk_your_api_key_here';
const API_BASE = 'https://your-domain.com/api/v1';

async function fetchUsers() {
  const response = await fetch(`${API_BASE}/users?limit=50`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error:', error.error.message);
    return null;
  }

  const data = await response.json();
  return data.users;
}

async function fetchTradesForUser(loginId) {
  const response = await fetch(`${API_BASE}/trades?loginId=${loginId}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  });

  const data = await response.json();
  return data.trades;
}

// Usage
const users = await fetchUsers();
if (users) {
  for (const user of users) {
    const trades = await fetchTradesForUser(user.loginId);
    console.log(`${user.name}: ${trades.length} trades`);
  }
}
```

### Python Example

```python
import requests
import os

API_KEY = os.getenv('ANALYSIS_API_KEY')
API_BASE = 'https://your-domain.com/api/v1'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

def get_users(limit=50):
    response = requests.get(
        f'{API_BASE}/users',
        headers=headers,
        params={'limit': limit}
    )
    response.raise_for_status()
    return response.json()['users']

def get_trades(status='closed'):
    response = requests.get(
        f'{API_BASE}/trades',
        headers=headers,
        params={'status': status}
    )
    response.raise_for_status()
    return response.json()['trades']

def get_analytics():
    response = requests.get(
        f'{API_BASE}/analytics/overview',
        headers=headers
    )
    response.raise_for_status()
    return response.json()['overview']

# Usage
users = get_users()
trades = get_trades(status='closed')
analytics = get_analytics()

print(f"Total Users: {len(users)}")
print(f"Closed Trades: {len(trades)}")
print(f"Net Performance: ${analytics['netPerformance']}")
```

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** to store API keys
3. **Rotate keys regularly** (set expiration dates)
4. **Use test keys** (`sk_test_*`) in development
5. **Revoke unused keys** immediately
6. **Monitor API usage** via logs
7. **Set appropriate rate limits** per app
8. **Use HTTPS** for all API requests

## Troubleshooting

### 401 Unauthorized
- Verify API key is correct
- Check Authorization header format: `Bearer sk_xxx`
- Ensure key hasn't expired

### 429 Too Many Requests
- Rate limit exceeded
- Wait for the `Retry-After` time
- Request higher rate limit if needed

### 403 Forbidden
- Key lacks required permissions
- Create a new key with broader scope
- Contact admin for permission changes

### 404 Not Found
- Resource doesn't exist
- Verify loginId or tradeId is correct

## Next Steps

1. Create API keys for each external platform
2. Integrate with your trading bot or analytics dashboard
3. Monitor API usage and logs
4. Implement webhook notifications (coming soon)
5. Set up automated reports using API data

## Support

For issues or questions:
- Check `API_DOCUMENTATION.md` for detailed endpoint reference
- Review error codes and status messages
- Contact: api-support@analysisprofithub.com
