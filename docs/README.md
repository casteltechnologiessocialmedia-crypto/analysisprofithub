# AnalysisProfitHub API Documentation

Complete documentation for the AnalysisProfitHub API system.

---

## 📚 Documentation Map

### Getting Started
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Print-friendly cheat sheet with essential endpoints
- **[INDEX.md](./INDEX.md)** - Task-based navigation hub

### Core Guides
1. **[AUTH_GUIDE.md](./AUTH_GUIDE.md)** - Authentication methods (API Keys, OAuth, Sessions)
2. **[ACCOUNTS_BALANCE_GUIDE.md](./ACCOUNTS_BALANCE_GUIDE.md)** - User profiles, balance, transactions
3. **[EXAMPLES.md](./EXAMPLES.md)** - Code examples in JavaScript, Python, cURL

### Developer Workflow
4. **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Setup, development, common tasks, deployment
5. **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Manual testing, Postman, Jest, Python testing
6. **[BEST_PRACTICES.md](./BEST_PRACTICES.md)** - Security, performance, reliability standards

---

## 🚀 Quick Start (5 Minutes)

### 1. Get an API Key
```bash
curl -X POST http://localhost:3000/api/admin/keys \
  -H "Authorization: Bearer test-admin-token" \
  -d '{
    "name": "My App",
    "scopes": ["users", "trades", "market", "analytics"],
    "rate_limit": 1000
  }'
```

### 2. Use the API
```bash
curl -H "Authorization: Bearer YOUR_KEY" \
  http://localhost:3000/api/v1/users
```

### 3. Read Full Docs
- Start with [AUTH_GUIDE.md](./AUTH_GUIDE.md) for authentication
- Move to [ACCOUNTS_BALANCE_GUIDE.md](./ACCOUNTS_BALANCE_GUIDE.md) for data fetching
- See [EXAMPLES.md](./EXAMPLES.md) for code

---

## 📖 By Role

### I'm a Developer
1. Start: [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
2. Setup your environment
3. Read [EXAMPLES.md](./EXAMPLES.md)
4. Test with [TESTING_GUIDE.md](./TESTING_GUIDE.md)
5. Follow [BEST_PRACTICES.md](./BEST_PRACTICES.md)

### I'm Integrating an External Platform
1. Start: [AUTH_GUIDE.md](./AUTH_GUIDE.md)
2. Get API key for your platform
3. Read [ACCOUNTS_BALANCE_GUIDE.md](./ACCOUNTS_BALANCE_GUIDE.md)
4. Copy code from [EXAMPLES.md](./EXAMPLES.md)
5. Deploy and monitor

### I'm an Admin/DevOps
1. Setup: [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) Part 1-3
2. Management: See admin endpoints
3. Monitoring: [BEST_PRACTICES.md](./BEST_PRACTICES.md) Section 5

---

## 📋 All Endpoints

### Users (`/api/v1/users`)
```
GET /api/v1/users                 - List all users
GET /api/v1/users/{loginId}       - Get user details
```

### Trades (`/api/v1/trades`)
```
GET /api/v1/trades                - List all trades
GET /api/v1/trades/{tradeId}      - Get trade details
```

### Market (`/api/v1/market`)
```
GET /api/v1/market/symbols        - Available symbols and signals
```

### Analytics (`/api/v1/analytics`)
```
GET /api/v1/analytics/overview    - Platform statistics
```

### Admin Keys (`/api/admin/keys`)
```
GET    /api/admin/keys            - List API keys
POST   /api/admin/keys            - Create new key
PATCH  /api/admin/keys/{keyId}    - Update key settings
DELETE /api/admin/keys/{keyId}    - Revoke key
```

---

## 🔐 Authentication

### API Key Authentication (Recommended for Integrations)
```bash
curl -H "Authorization: Bearer sk_live_abc123..." http://api.url/v1/users
```

### OAuth 2.0 (For User Delegation)
See [AUTH_GUIDE.md](./AUTH_GUIDE.md) for full OAuth flow

### Session Authentication (For Web Apps)
See [AUTH_GUIDE.md](./AUTH_GUIDE.md) for session setup

---

## 📊 Responses

### Success (200)
```json
{
  "data": [...],
  "total": 100,
  "limit": 10,
  "offset": 0
}
```

### Errors
```json
{
  "error": "Error message",
  "status": 400
}
```

### Rate Limited (429)
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

---

## ⏱️ Rate Limits

| Plan | Requests/Min | Requests/Hour |
|------|-------------|---------------|
| Free | 100 | 5,000 |
| Pro | 500 | 25,000 |
| Enterprise | Custom | Custom |

Check headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

---

## 🛠️ Common Tasks

### Fetch User Balance
→ See [ACCOUNTS_BALANCE_GUIDE.md](./ACCOUNTS_BALANCE_GUIDE.md)

### Get Trade History
→ See [EXAMPLES.md](./EXAMPLES.md) - Trades section

### Monitor Platform Activity
→ See [EXAMPLES.md](./EXAMPLES.md) - Monitoring scenario

### Setup Automated Reports
→ See [EXAMPLES.md](./EXAMPLES.md) - Analytics export

### Handle Errors Gracefully
→ See [BEST_PRACTICES.md](./BEST_PRACTICES.md) - Error handling

---

## 🧪 Testing

### Quick Test
```bash
# Check if API is working
curl -H "Authorization: Bearer YOUR_KEY" \
  http://localhost:3000/api/v1/users
```

### Full Test Suite
See [TESTING_GUIDE.md](./TESTING_GUIDE.md)

### Automated Tests
```bash
npm test
```

---

## 🐛 Troubleshooting

### 401 Unauthorized
- Check API key in Authorization header
- Verify key is not expired
- Ensure key has required scopes

### 429 Too Many Requests
- Rate limit exceeded
- Wait before retrying (see `retryAfter` header)
- Use exponential backoff

### 500 Internal Server Error
- Server-side error
- Check server logs
- Verify database connection

See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) Part 6 for more debugging tips.

---

## 📚 Related Documentation

- **API Implementation**: See root `/API_*.md` files
- **Architecture**: `API_ARCHITECTURE.md`
- **Quick Start**: `API_QUICK_START.md`

---

## 🚦 Development Workflow

1. **Setup** → [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) Part 1
2. **Create Key** → [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) Part 2
3. **Test Locally** → [TESTING_GUIDE.md](./TESTING_GUIDE.md) Section 1
4. **Build Features** → [EXAMPLES.md](./EXAMPLES.md)
5. **Follow Standards** → [BEST_PRACTICES.md](./BEST_PRACTICES.md)
6. **Deploy** → [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) Part 7

---

## 📞 Support

### Common Questions
See [INDEX.md](./INDEX.md) FAQ section

### Getting Help
- Check [BEST_PRACTICES.md](./BEST_PRACTICES.md) - Common pitfalls
- Review [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Debugging
- See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) Part 6 - Debugging tips

---

## 📋 Feature Matrix

| Feature | API Keys | OAuth 2.0 | Sessions |
|---------|----------|----------|----------|
| Integrations | ✅ | ✅ | ❌ |
| Rate Limiting | ✅ | ✅ | ✅ |
| Scopes | ✅ | ✅ | ❌ |
| User Consent | ❌ | ✅ | ✅ |
| Stateless | ✅ | ✅ | ❌ |

---

## 🎯 Production Checklist

Before deploying to production, review:
- [ ] [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) Part 7 - Production deployment
- [ ] [BEST_PRACTICES.md](./BEST_PRACTICES.md) - Production checklist
- [ ] All environment variables set in Vercel
- [ ] Database migrations applied
- [ ] Security review completed
- [ ] Monitoring configured

---

## 📝 Document Index

| Document | Lines | Purpose |
|----------|-------|---------|
| QUICK_REFERENCE.md | 350+ | Quick copy-paste guide |
| INDEX.md | 340+ | Task-based navigation |
| AUTH_GUIDE.md | 570+ | Authentication methods |
| ACCOUNTS_BALANCE_GUIDE.md | 710+ | User data and balance |
| EXAMPLES.md | 650+ | Code examples |
| DEVELOPER_GUIDE.md | 450+ | Development workflow |
| TESTING_GUIDE.md | 650+ | Testing frameworks |
| BEST_PRACTICES.md | 570+ | Standards and patterns |
| **README.md** | 350+ | **This file** |

---

## 🔄 Staying Updated

All guides are maintained in the `/docs` directory. Subscribe to updates or check the repository regularly.

---

**Last Updated:** January 2025
**API Version:** v1
**Status:** Production Ready
