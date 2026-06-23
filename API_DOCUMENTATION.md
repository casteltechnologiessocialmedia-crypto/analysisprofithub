# AnalysisProfitHub Public API Documentation

## Overview

The AnalysisProfitHub API allows external platforms and services to connect with your trading platform. Query user data, trade history, market signals, and analytics through simple REST endpoints.

## Authentication

All API requests require an API key passed in the `Authorization` header:

```
Authorization: Bearer sk_xxxxxxxxxxxxxxxxxxxxx
```

or

```
Authorization: sk_xxxxxxxxxxxxxxxxxxxxx
```

### Getting an API Key

1. Go to the **Admin Panel**
2. Navigate to **API Keys** section
3. Click **Create New Key**
4. Enter app name, select permissions, and set rate limit
5. Copy the key immediately (you won't see it again)

## Base URL

```
https://your-domain.com/api/v1
```

## Response Format

All responses are JSON with the following structure:

### Success Response
```json
{
  "data": { /* endpoint-specific data */ },
  "pagination": { /* if applicable */ }
}
```

### Error Response
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "timestamp": "2024-06-23T10:30:00Z"
  }
}
```

## Rate Limiting

Rate limits vary by API key. Check the response headers:

- `X-RateLimit-Limit` - Requests allowed per minute
- `X-RateLimit-Remaining` - Requests remaining in current window

When limit is exceeded, you'll receive a 429 status with retry-after information.

## Endpoints

### Users

#### List Users
```
GET /users
```

Query Parameters:
- `limit` (number, default: 50, max: 500)
- `offset` (number, default: 0)
- `type` (string: "Real" or "Demo")
- `status` (string: "online" or "offline")

Example:
```bash
curl -H "Authorization: Bearer sk_xxx" \
  "https://your-domain.com/api/v1/users?limit=25&offset=0&type=Real"
```

Response:
```json
{
  "users": [
    {
      "loginId": "user123",
      "name": "John Trader",
      "balance": 5000.50,
      "type": "Real",
      "status": "online",
      "lastSeen": "2024-06-23T10:25:00Z"
    }
  ],
  "pagination": {
    "limit": 25,
    "offset": 0,
    "total": 150,
    "hasMore": true
  }
}
```

#### Get User Details
```
GET /users/{loginId}
```

Example:
```bash
curl -H "Authorization: Bearer sk_xxx" \
  "https://your-domain.com/api/v1/users/user123"
```

### Trades

#### List Trades
```
GET /trades
```

Query Parameters:
- `limit` (number, default: 50, max: 500)
- `offset` (number, default: 0)
- `status` (string: "open", "closed", "won", "lost")
- `loginId` (string: filter by user)

Example:
```bash
curl -H "Authorization: Bearer sk_xxx" \
  "https://your-domain.com/api/v1/trades?limit=25&status=closed"
```

Response:
```json
{
  "trades": [
    {
      "id": "trade_123",
      "loginId": "user123",
      "stake": 100,
      "profitLoss": 25.50,
      "status": "closed",
      "createdAt": "2024-06-23T10:00:00Z",
      "market": "EURUSD",
      "entryPrice": 1.0850,
      "exitPrice": 1.0885,
      "volume": 1.0,
      "leverage": 1
    }
  ],
  "pagination": { /* ... */ }
}
```

#### Get Trade Details
```
GET /trades/{tradeId}
```

Example:
```bash
curl -H "Authorization: Bearer sk_xxx" \
  "https://your-domain.com/api/v1/trades/trade_123"
```

### Market Data

#### List Available Symbols
```
GET /market/symbols
```

Example:
```bash
curl -H "Authorization: Bearer sk_xxx" \
  "https://your-domain.com/api/v1/market/symbols"
```

Response:
```json
{
  "symbols": [
    {
      "symbol": "EURUSD",
      "name": "EUR/USD",
      "category": "Forex",
      "active": true
    },
    {
      "symbol": "BTCUSD",
      "name": "Bitcoin",
      "category": "Crypto",
      "active": true
    }
  ],
  "total": 12,
  "timestamp": "2024-06-23T10:30:00Z"
}
```

### Analytics

#### Get Platform Overview
```
GET /analytics/overview
```

Query Parameters:
- `type` (string: "Real", "Demo", or "All")
- `pnl` (string: "Profits", "Losses", or "All")

Example:
```bash
curl -H "Authorization: Bearer sk_xxx" \
  "https://your-domain.com/api/v1/analytics/overview?type=Real"
```

Response:
```json
{
  "overview": {
    "totalUsers": 250,
    "onlineUsers": 45,
    "offlineUsers": 205,
    "totalRealBalance": 125000.00,
    "totalDemoBalance": 85000.00,
    "totalTrades": 5230,
    "netPerformance": 12500.50,
    "totalVolume": 850000.00
  },
  "topTraders": [
    {
      "loginId": "user123",
      "name": "Top Trader",
      "type": "Real",
      "netPnl": 5000.00,
      "wins": 45,
      "total": 50
    }
  ],
  "timestamp": "2024-06-23T10:30:00Z"
}
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid API key |
| FORBIDDEN | 403 | Insufficient permissions for this endpoint |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMITED | 429 | Rate limit exceeded |
| INTERNAL_ERROR | 500 | Server error |

## Example: JavaScript SDK

```javascript
class AnalysisProfitHubAPI {
  constructor(apiKey, baseUrl = 'https://your-domain.com/api/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`${error.error.code}: ${error.error.message}`);
    }

    return response.json();
  }

  async getUsers(options = {}) {
    const params = new URLSearchParams(options);
    return this.request(`/users?${params}`);
  }

  async getUser(loginId) {
    return this.request(`/users/${loginId}`);
  }

  async getTrades(options = {}) {
    const params = new URLSearchParams(options);
    return this.request(`/trades?${params}`);
  }

  async getTrade(tradeId) {
    return this.request(`/trades/${tradeId}`);
  }

  async getSymbols() {
    return this.request('/market/symbols');
  }

  async getAnalyticsOverview(options = {}) {
    const params = new URLSearchParams(options);
    return this.request(`/analytics/overview?${params}`);
  }
}

// Usage
const api = new AnalysisProfitHubAPI('sk_xxx');

// Get all users
const users = await api.getUsers({ limit: 50, type: 'Real' });

// Get trades for a user
const trades = await api.getTrades({ loginId: 'user123' });

// Get platform analytics
const analytics = await api.getAnalyticsOverview({ type: 'Real' });
```

## Example: Python

```python
import requests

class AnalysisProfitHubAPI:
    def __init__(self, api_key, base_url='https://your-domain.com/api/v1'):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }

    def request(self, endpoint, params=None):
        response = requests.get(
            f'{self.base_url}{endpoint}',
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()

    def get_users(self, **kwargs):
        return self.request('/users', params=kwargs)

    def get_user(self, login_id):
        return self.request(f'/users/{login_id}')

    def get_trades(self, **kwargs):
        return self.request('/trades', params=kwargs)

    def get_analytics(self, **kwargs):
        return self.request('/analytics/overview', params=kwargs)

# Usage
api = AnalysisProfitHubAPI('sk_xxx')
users = api.get_users(limit=50, type='Real')
trades = api.get_trades(status='closed')
```

## Webhook Setup (Future)

Coming soon: Real-time notifications for trade execution, user status changes, and market signals.

## Support

For API support, please contact: api-support@analysisprofithub.com

## Changelog

### v1.0.0 (2024-06-23)
- Initial public API release
- Users endpoint
- Trades endpoint
- Market symbols endpoint
- Analytics overview endpoint
