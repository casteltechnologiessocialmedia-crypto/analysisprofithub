# AnalysisProfitHub API Documentation

Complete documentation for integrating with AnalysisProfitHub API.

## Quick Navigation

### Getting Started
- **[Authentication Guide](./AUTH_GUIDE.md)** - API Keys, OAuth, User Login
- **[Accounts & Balance Guide](./ACCOUNTS_BALANCE_GUIDE.md)** - Fetch user data, balance, transactions
- **[Code Examples](./EXAMPLES.md)** - Ready-to-use code snippets

### Reference
- **[API Documentation](../API_DOCUMENTATION.md)** - Complete endpoint reference
- **[Architecture Guide](../API_ARCHITECTURE.md)** - System design and flow diagrams
- **[Implementation Guide](../API_INTEGRATION_GUIDE.md)** - Setup and deployment

---

## What Would You Like to Do?

### I Want to...

#### 🔐 Authenticate Users
**See:** [Authentication Guide](./AUTH_GUIDE.md)
- Generate API keys
- Use OAuth 2.0
- Implement user login
- Handle sessions

**Quick Start:**
```bash
curl -X GET https://api.analysisprofithub.com/api/v1/users/john_doe \
  -H "Authorization: Bearer sk_live_YOUR_KEY"
```

---

#### 💰 Get User Balance & Account Info
**See:** [Accounts & Balance Guide](./ACCOUNTS_BALANCE_GUIDE.md)
- Fetch user profile
- Get current balance
- View transaction history
- Access trading statistics

**Quick Start:**
```javascript
// Get user balance
const response = await fetch('https://api.analysisprofithub.com/api/v1/users/john_doe/balance', {
  headers: { 'Authorization': 'Bearer sk_live_YOUR_KEY' }
});
const { data } = await response.json();
console.log(`Balance: $${data.balance}`);
```

---

#### 📊 List & Analyze Trades
**See:** [Code Examples](./EXAMPLES.md#scenario-4-calculatewinlossstatistics)
- Fetch trade history
- Calculate statistics
- Export reports
- Monitor performance

**Quick Start:**
```javascript
const trades = await fetch('https://api.analysisprofithub.com/api/v1/trades?loginId=john_doe', {
  headers: { 'Authorization': 'Bearer sk_live_YOUR_KEY' }
}).then(r => r.json());
```

---

#### 🔧 Set Up Integration
**See:** [Implementation Guide](../API_INTEGRATION_GUIDE.md)
- Create API keys
- Setup database
- Deploy endpoints
- Configure webhooks

---

#### 📱 Build a Dashboard
**See:** [Code Examples](./EXAMPLES.md#scenario-1-monitoruserbalancechanges)
- Real-time balance monitoring
- User profile display
- Trade history table
- Performance metrics

---

## Authentication Methods

### 1. API Key (Recommended for Server-to-Server)
```bash
Authorization: Bearer sk_live_YOUR_API_KEY
```
**Best for:** Automated tools, integrations, bots
**See:** [API Key Authentication](./AUTH_GUIDE.md#api-key-authentication)

### 2. OAuth 2.0 (For User Delegation)
```
GET https://api.analysisprofithub.com/oauth/authorize?client_id=...&redirect_uri=...
```
**Best for:** Web apps, multi-user platforms
**See:** [OAuth 2.0](./AUTH_GUIDE.md#oauth-20-authentication)

### 3. User Session (Web/App Login)
```
POST /api/auth/login
```
**Best for:** Direct user login
**See:** [User Login](./AUTH_GUIDE.md#user-login)

---

## API Endpoints Overview

### Users
- `GET /api/v1/users` - List all users
- `GET /api/v1/users/{loginId}` - Get user profile
- `GET /api/v1/users/{loginId}/balance` - Get balance
- `GET /api/v1/users/{loginId}/account` - Get full account details
- `GET /api/v1/users/{loginId}/balance/history` - Balance changes over time
- `GET /api/v1/users/{loginId}/transactions` - Get transactions

### Trades
- `GET /api/v1/trades` - List all trades
- `GET /api/v1/trades/{tradeId}` - Get trade details

### Market Data
- `GET /api/v1/market/symbols` - Available symbols

### Analytics
- `GET /api/v1/analytics/overview` - Platform statistics

### Admin (Requires Authentication)
- `POST /api/admin/keys` - Create API key
- `GET /api/admin/keys` - List API keys
- `PATCH /api/admin/keys/{keyId}` - Update key settings
- `DELETE /api/admin/keys/{keyId}` - Revoke key

---

## Code Examples by Language

### JavaScript/Node.js
```javascript
const apiKey = 'sk_live_YOUR_API_KEY';

async function getUser(loginId) {
  const response = await fetch(
    `https://api.analysisprofithub.com/api/v1/users/${loginId}`,
    { headers: { 'Authorization': `Bearer ${apiKey}` } }
  );
  return response.json();
}
```
**See:** [JavaScript Examples](./EXAMPLES.md#javascriptnodejs)

### Python
```python
import requests

api_key = 'sk_live_YOUR_API_KEY'
headers = {'Authorization': f'Bearer {api_key}'}

response = requests.get(
  'https://api.analysisprofithub.com/api/v1/users/john_doe',
  headers=headers
)
user = response.json()['data']
```
**See:** [Python Examples](./EXAMPLES.md#python)

### cURL
```bash
curl -X GET https://api.analysisprofithub.com/api/v1/users/john_doe \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"
```
**See:** [cURL Examples](./EXAMPLES.md#curl)

---

## Common Tasks

### Generate API Key
1. Log into admin dashboard
2. Go to **Integrations → API Keys**
3. Click **Create New Key**
4. Configure settings (rate limit, scopes, expiration)
5. Copy key (shown only once!)
6. Store securely in `.env`

**See:** [Managing API Keys](../API_README.md#generating-api-keys)

---

### Authenticate User via OAuth
1. Get user login URL from client
2. User logs in and approves access
3. Receive authorization code
4. Exchange code for access token
5. Use token to call API

**See:** [OAuth 2.0 Flow](./AUTH_GUIDE.md#oauth-20-authentication)

---

### Fetch User Balance
```javascript
const response = await fetch(
  'https://api.analysisprofithub.com/api/v1/users/john_doe/balance',
  { headers: { 'Authorization': 'Bearer sk_live_KEY' } }
);
const { data } = await response.json();
console.log(`Available: $${data.availableBalance}`);
```

**See:** [Fetch Balance](./ACCOUNTS_BALANCE_GUIDE.md#fetch-user-balance)

---

### Get Account Details with Trading Stats
```javascript
const response = await fetch(
  'https://api.analysisprofithub.com/api/v1/users/john_doe/account',
  { headers: { 'Authorization': 'Bearer sk_live_KEY' } }
);
const { data } = await response.json();
console.log(`Win Rate: ${data.trading.winRate}%`);
console.log(`Total Profit: $${data.trading.totalProfit}`);
```

**See:** [Account Details](./ACCOUNTS_BALANCE_GUIDE.md#get-account-details)

---

### List All Trades
```javascript
const response = await fetch(
  'https://api.analysisprofithub.com/api/v1/trades?limit=100',
  { headers: { 'Authorization': 'Bearer sk_live_KEY' } }
);
const { data } = await response.json();
data.trades.forEach(trade => {
  console.log(`${trade.symbol}: ${trade.type} @${trade.entryPrice}`);
});
```

---

### Export User Report
See: [Real-World Scenarios](./EXAMPLES.md#real-world-scenarios)

---

## Error Handling

### Common Errors

| Error | Meaning | Solution |
|-------|---------|----------|
| `401 Unauthorized` | Invalid API key | Verify key is correct and not expired |
| `404 Not Found` | User doesn't exist | Check loginId spelling |
| `429 Rate Limited` | Too many requests | Wait before retrying |
| `500 Server Error` | Backend issue | Contact support |

**See:** [Error Handling](./ACCOUNTS_BALANCE_GUIDE.md#error-handling)

---

## Best Practices

### Security ✅
- Store API keys in environment variables
- Use HTTPS for all requests
- Rotate keys every 90 days
- Never commit secrets to git
- Use minimal scopes needed

### Performance ✅
- Cache responses when possible
- Implement pagination for large datasets
- Use batch requests when available
- Implement exponential backoff for retries
- Monitor rate limits

**See:** [Security Guide](./AUTH_GUIDE.md#security-best-practices)

---

## Frequently Asked Questions

### Q: How do I generate an API key?
A: In the admin dashboard, go to **Integrations → API Keys** and click **Create New Key**. Copy it immediately (shown only once). Store it in a `.env` file.

### Q: What's the rate limit?
A: Default is 100 requests/minute per key. Premium keys can have up to 1000 req/min.

### Q: Can I use OAuth for my integration?
A: Yes! OAuth is ideal for web apps where users grant access. See the [OAuth 2.0 guide](./AUTH_GUIDE.md#oauth-20-authentication).

### Q: How do I get real-time updates?
A: You can poll the API or use webhooks. WebSocket support coming soon.

### Q: What data can I access?
A: Users, trades, balances, transactions, and analytics. API keys can be scoped to limit access.

### Q: How do I handle API key expiration?
A: API keys can be set with expiration dates. You'll receive a 401 error when expired. Generate a new key in advance.

---

## Support & Resources

### Documentation
- [Complete API Reference](../API_DOCUMENTATION.md)
- [Architecture Guide](../API_ARCHITECTURE.md)
- [Implementation Guide](../API_INTEGRATION_GUIDE.md)

### Getting Help
- Email: support@analysisprofithub.com
- Status: status.analysisprofithub.com
- Discord: discord.gg/analysisprofithub

### Useful Links
- [Admin Dashboard](https://app.analysisprofithub.com/admin)
- [API Status](https://status.analysisprofithub.com)
- [Blog](https://blog.analysisprofithub.com)

---

## What's Next?

1. **Read** the authentication guide matching your use case
2. **Generate** an API key in the admin dashboard
3. **Test** with a curl request or code example
4. **Integrate** with your platform
5. **Monitor** API usage and performance

**Happy coding!** 🚀
