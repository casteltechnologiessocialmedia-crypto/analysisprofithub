# AnalysisProfitHub Public API

Connect external trading platforms, bots, dashboards, and analytics tools to AnalysisProfitHub through our secure REST API.

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[API_QUICK_START.md](./API_QUICK_START.md)** | 5-minute setup guide (start here!) |
| **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** | Complete API reference with examples |
| **[API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md)** | Detailed setup and integration instructions |
| **[API_ARCHITECTURE.md](./API_ARCHITECTURE.md)** | System architecture and visual diagrams |
| **[API_IMPLEMENTATION_SUMMARY.md](./API_IMPLEMENTATION_SUMMARY.md)** | Implementation details and features |

## 🚀 Quick Start (2 minutes)

### 1. Create API Key
```bash
curl -X POST https://your-domain.com/api/admin/keys \
  -H "Content-Type: application/json" \
  -d '{
    "appName": "My App",
    "rateLimit": 100
  }'
```

### 2. Make API Request
```bash
curl -H "Authorization: Bearer sk_xxx" \
  https://your-domain.com/api/v1/users
```

### 3. Get Data
```json
{
  "users": [
    {"loginId": "user123", "name": "John", "balance": 5000, ...}
  ],
  "pagination": {"limit": 50, "offset": 0, "total": 150, ...}
}
```

## 📊 Available Data

### Users
- List all users with filtering (type, status)
- Get individual user details
- Includes: balance, account type, online status

### Trades
- Browse trade history with pagination
- Filter by status, user, date
- Includes: P&L, entry/exit prices, volume, market

### Market Data
- Available trading symbols
- Market information and categories
- Support for Forex, Crypto, Indices, Commodities

### Analytics
- Platform-wide statistics
- Top traders leaderboard
- Net performance and total volume
- User and balance breakdowns

## 🔐 Authentication

All requests require an API key in the Authorization header:

```
Authorization: Bearer sk_your_api_key_here
```

Keys are:
- ✅ Secure (hashed with SHA-256)
- ✅ Rate-limited (configurable per key)
- ✅ Expirable (automatic expiration)
- ✅ Revocable (immediate deactivation)

## 🔗 API Endpoints

```
PUBLIC ENDPOINTS (v1 API)
GET  /api/v1/users                    List users
GET  /api/v1/users/{loginId}          Get user details
GET  /api/v1/trades                   List trades
GET  /api/v1/trades/{tradeId}         Get trade details
GET  /api/v1/market/symbols           Available symbols
GET  /api/v1/analytics/overview       Platform statistics

ADMIN ENDPOINTS (Key Management)
GET  /api/admin/keys                  List API keys
POST /api/admin/keys                  Create new key
PATCH /api/admin/keys/{keyId}         Update key
DELETE /api/admin/keys/{keyId}        Revoke key
```

## 💡 Use Cases

**Trading Bots**
- Fetch real-time user data and performance
- Monitor trades across multiple accounts
- Integrate with algorithmic strategies

**Analytics Dashboards**
- Display platform-wide statistics
- Show leaderboards and top traders
- Track performance metrics

**CRM Systems**
- Sync user data with customer database
- Pull balance and account information
- Integrate with marketing tools

**Reporting Tools**
- Export trade history and performance
- Generate analytics reports
- Feed data to BI systems

**Third-Party Platforms**
- Bridge AnalysisProfitHub with external services
- Real-time data synchronization
- Custom integrations

## 📦 SDKs & Examples

### JavaScript/TypeScript
```javascript
const api = new AnalysisProfitHubAPI('sk_xxx');
const users = await api.getUsers({ type: 'Real' });
const trades = await api.getTrades({ status: 'closed' });
```

### Python
```python
api = AnalysisProfitHubAPI('sk_xxx')
users = api.get_users(type='Real')
trades = api.get_trades(status='closed')
```

### cURL
```bash
curl -H "Authorization: Bearer sk_xxx" \
  https://your-domain.com/api/v1/users?type=Real
```

See **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** for full examples.

## ⚙️ Getting Started

### Step 1: Database Setup
```sql
-- Run in Supabase SQL Editor
-- See supabase/migrations/create_api_keys_table.sql
```

### Step 2: Generate API Key
```bash
# Via API
curl -X POST https://your-domain.com/api/admin/keys \
  -H "Content-Type: application/json" \
  -d '{
    "appName": "My Integration",
    "scope": ["users:read", "trades:read", "analytics:read"],
    "rateLimit": 500,
    "expiresInDays": 365
  }'
```

### Step 3: Test the API
```bash
curl -H "Authorization: Bearer sk_abcd1234..." \
  https://your-domain.com/api/v1/users?limit=10
```

### Step 4: Integrate with Your App
Use the API key and endpoints in your application code.

For detailed setup, see **[API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md)**

## 📈 Rate Limiting

Each API key has a configurable rate limit:

- **Default**: 100 requests/minute
- **Premium**: Up to 1000 requests/minute
- **Custom**: Configure per application need

When limit is exceeded:
```
Status: 429 Too Many Requests
Retry-After: X seconds
X-RateLimit-Remaining: 0
```

## 🛡️ Security Best Practices

✅ **DO**
- Store keys in environment variables
- Use HTTPS for all requests
- Rotate keys regularly
- Set appropriate rate limits
- Use test keys in development
- Monitor API usage

❌ **DON'T**
- Commit keys to version control
- Share keys via email/chat
- Use same key across apps
- Ignore expiration warnings
- Log keys in error messages

## 📊 Monitoring

Track API usage and health:

```sql
-- View recent API requests
SELECT * FROM api_key_logs 
WHERE timestamp > now() - interval '1 hour'
ORDER BY timestamp DESC;

-- Check key audit trail
SELECT * FROM api_key_audit_logs 
WHERE key_id = 'your-key-id'
ORDER BY timestamp DESC;
```

## 🐛 Troubleshooting

### 401 Unauthorized
- Verify API key is correct
- Check Authorization header format
- Ensure key hasn't expired

### 429 Rate Limited
- Wait for retry-after period
- Reduce request frequency
- Request higher rate limit

### 403 Forbidden
- Verify key has required permissions
- Check scope settings

### 404 Not Found
- Verify resource ID is correct
- Check endpoint path

See **[API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md)** for more troubleshooting.

## 🗺️ Roadmap

**Phase 1 (Complete)** ✅
- REST API endpoints
- API key management
- Rate limiting
- Authentication

**Phase 2 (Planned)**
- Webhook notifications
- WebSocket real-time updates
- OAuth 2.0 support

**Phase 3 (Future)**
- Usage analytics dashboard
- Automatic key rotation
- IP whitelisting
- Advanced scoping

## 💬 Support

Need help?

1. **Read Documentation**: Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
2. **Setup Guide**: See [API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md)
3. **Architecture**: Review [API_ARCHITECTURE.md](./API_ARCHITECTURE.md)
4. **Contact**: Email api-support@analysisprofithub.com

## 📄 License

The AnalysisProfitHub API is provided as part of the platform. By using the API, you agree to our Terms of Service and Privacy Policy.

## 📝 Changelog

### v1.0.0 (June 23, 2024)
- Initial public API release
- Users, Trades, Market, Analytics endpoints
- API key management system
- Rate limiting and authentication
- Comprehensive documentation

---

**Ready to integrate?** Start with [API_QUICK_START.md](./API_QUICK_START.md)
