# API Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│               External Trading Platforms                     │
│           (Trading Bot, Dashboard, CRM, etc.)               │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │   HTTPS Request     │
                    │ + API Key (Bearer)  │
                    └─────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Next.js API Layer                           │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ middleware/api-auth.ts                              │   │
│  │ ├─ Extract API Key from header                       │   │
│  │ ├─ Hash and validate against database                │   │
│  │ ├─ Check expiration, active status                   │   │
│  │ ├─ Check rate limit (in-memory cache)                │   │
│  │ └─ Return auth context or error                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ API Routes (/api/v1/*)                              │   │
│  │                                                       │   │
│  │ users/                   trades/                     │   │
│  │ ├─ route.ts             ├─ route.ts                 │   │
│  │ └─ [loginId]/route.ts   └─ [tradeId]/route.ts       │   │
│  │                                                       │   │
│  │ market/                  analytics/                  │   │
│  │ └─ symbols/route.ts     └─ overview/route.ts        │   │
│  │                                                       │   │
│  │ Admin Routes (/api/admin/keys/*)                     │   │
│  │ ├─ route.ts (List, Create)                          │   │
│  │ └─ [keyId]/route.ts (Update, Delete)                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Supabase PostgreSQL Database                    │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   api_keys   │  │ api_key_logs │  │audit_logs    │       │
│  │              │  │              │  │              │       │
│  │ id (UUID)    │  │ id (UUID)    │  │ id (UUID)    │       │
│  │ key_hash     │  │ key_id       │  │ key_id       │       │
│  │ app_name     │  │ endpoint     │  │ action       │       │
│  │ scope        │  │ method       │  │ performed_by │       │
│  │ rate_limit   │  │ status       │  │ timestamp    │       │
│  │ expires_at   │  │ timestamp    │  │              │       │
│  │ is_active    │  │              │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  Plus existing tables: users, trades, etc.                   │
└─────────────────────────────────────────────────────────────┘
```

## Request Flow Diagram

```
1. External App Makes Request
   ↓
   Authorization: Bearer sk_xxx
   GET /api/v1/users?type=Real
   ↓

2. API Auth Middleware
   ├─ Extract key from header: sk_xxx
   ├─ Hash key: SHA256(sk_xxx) = abc123...
   ├─ Query database:
   │  SELECT * FROM api_keys WHERE key_hash = 'abc123...'
   ├─ Verify:
   │  • is_active = true ✓
   │  • expires_at > NOW() ✓
   │  • rate_limit not exceeded ✓
   └─ Return auth context
   ↓

3. Route Handler (/api/v1/users)
   ├─ Check scope: users:read ✓
   ├─ Build query:
   │  SELECT * FROM users WHERE type='Real'
   ├─ Apply pagination (limit, offset)
   └─ Return response with rate-limit headers
   ↓

4. Response to External App
   ├─ Status: 200 OK
   ├─ Headers:
   │  • X-RateLimit-Limit: 100
   │  • X-RateLimit-Remaining: 97
   └─ Body:
      {
        "users": [...],
        "pagination": {...}
      }
```

## Data Flow: Creating an API Key

```
Admin Dashboard
    ↓
  User Input
  └─ App Name: "My Bot"
     Scope: ["users:read", "trades:read"]
     Rate Limit: 500/min
    ↓
POST /api/admin/keys
    ↓
  Backend Generates Key
  └─ crypto.randomBytes(24).toString('hex')
     Result: sk_xyz789abc...
    ↓
  Hash the Key
  └─ SHA256(sk_xyz789abc...)
     Result: abc123def456...
    ↓
  Store in Database
  └─ INSERT INTO api_keys (
       key_hash, app_name, scope, rate_limit, ...
     )
    ↓
  Response
  ├─ Return plaintext key (only once!)
  └─ Show: sk_xyz789abc...
    ↓
Admin Copies Key
    ↓
User Provides to External App
    ↓
External App Uses in Requests
└─ Authorization: Bearer sk_xyz789abc...
```

## Rate Limiting Mechanism

```
Request arrives with API key
    ↓
Check in-memory cache
    ↓
  ┌─ If NOT in cache:
  │  ├─ Initialize: count = 1
  │  └─ Set: resetTime = now + 60s
  │     ↓
  ├─ If IN cache AND within window:
  │  ├─ Increment: count++
  │  └─ Keep: resetTime
  │     ↓
  └─ If IN cache AND window expired:
     ├─ Reset: count = 1
     └─ Set: resetTime = now + 60s
    ↓
Compare count vs limit
    ↓
  ├─ If count ≤ limit:
  │  └─ ALLOWED ✓
  │
  └─ If count > limit:
     ├─ Status: 429 Too Many Requests
     ├─ Retry-After: X seconds
     └─ REJECTED ✗
```

## Scope & Permission System

```
API Key Scopes:
├─ users:read
│  └─ Access to /api/v1/users endpoints
│
├─ trades:read
│  └─ Access to /api/v1/trades endpoints
│
├─ market:read
│  └─ Access to /api/v1/market endpoints
│
├─ analytics:read
│  └─ Access to /api/v1/analytics endpoints
│
└─ * (wildcard)
   └─ Access to ALL endpoints

Check before allowing request:
    ↓
Does API key have required scope?
    ├─ YES: Allow request
    └─ NO: Return 403 Forbidden
```

## File Organization

```
project/
├── app/
│   └── api/
│       ├── v1/                          (Public API)
│       │   ├── users/
│       │   │   ├── route.ts            GET /api/v1/users
│       │   │   └── [loginId]/
│       │   │       └── route.ts        GET /api/v1/users/{id}
│       │   ├── trades/
│       │   │   ├── route.ts            GET /api/v1/trades
│       │   │   └── [tradeId]/
│       │   │       └── route.ts        GET /api/v1/trades/{id}
│       │   ├── market/
│       │   │   └── symbols/
│       │   │       └── route.ts        GET /api/v1/market/symbols
│       │   └── analytics/
│       │       └── overview/
│       │           └── route.ts        GET /api/v1/analytics/overview
│       │
│       └── admin/
│           └── keys/                    (Admin API)
│               ├── route.ts            GET/POST /api/admin/keys
│               └── [keyId]/
│                   └── route.ts        PATCH/DELETE /api/admin/keys/{id}
│
├── lib/
│   ├── api-keys.ts                    (Key utilities)
│   ├── rate-limiter.ts                (Rate limiting)
│   └── supabase.ts                    (DB client)
│
├── middleware/
│   └── api-auth.ts                    (Auth middleware)
│
├── components/
│   └── api-keys-manager.tsx           (Admin UI)
│
├── supabase/
│   └── migrations/
│       └── create_api_keys_table.sql  (DB schema)
│
└── Documentation/
    ├── API_DOCUMENTATION.md           (Full reference)
    ├── API_INTEGRATION_GUIDE.md       (Setup guide)
    ├── API_QUICK_START.md             (5-min start)
    ├── API_IMPLEMENTATION_SUMMARY.md  (Overview)
    └── API_ARCHITECTURE.md            (This file)
```

## Security Layers

```
┌─────────────────────────────────────────┐
│     Layer 1: HTTPS / Transport           │
│  (Encrypts data in transit)              │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│     Layer 2: API Key Validation          │
│  (Hash comparison, DB lookup)            │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│     Layer 3: Key Status Check            │
│  (Active, not expired)                   │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│     Layer 4: Rate Limiting               │
│  (In-memory throttling)                  │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│     Layer 5: Scope / Permission Check    │
│  (Can this key access this endpoint?)    │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│     Layer 6: Route Handler               │
│  (Actually process the request)          │
└─────────────────────────────────────────┘
```

## Integration Points

```
AnalysisProfitHub API
    ↓
    ├─→ Trading Bot
    │   └─ Auto-fetch trades & signals
    │
    ├─→ Analytics Dashboard
    │   └─ Real-time stats & leaderboards
    │
    ├─→ CRM System
    │   └─ Sync user data
    │
    ├─→ Reporting Tool
    │   └─ Pull performance metrics
    │
    └─→ Third-party Platform
        └─ Custom integration
```

## Deployment Checklist

```
☐ Run database migration (create_api_keys_table.sql)
☐ Set environment variables:
  ├─ NEXT_PUBLIC_SUPABASE_URL
  ├─ NEXT_PUBLIC_SUPABASE_ANON_KEY
  └─ SUPABASE_SERVICE_ROLE_KEY
☐ Deploy to Vercel
☐ Test endpoints with sample API key
☐ Create production API key
☐ Document in wiki/docs
☐ Share with partner platforms
☐ Monitor API logs
☐ Set up alerts for errors/rate limits
```

## Future Architecture Improvements

```
Current (v1.0):
  External App → HTTPS → API Key → Rate Limiter → DB

Future (v2.0):
  External App ──┬─→ REST API (current)
                 │
                 ├─→ WebSocket (real-time)
                 │
                 ├─→ OAuth 2.0 (delegated access)
                 │
                 └─→ Webhooks (push notifications)

With:
  • Redis (distributed rate limiting)
  • IP Whitelisting
  • Custom scopes UI
  • Usage analytics dashboard
  • Automatic key rotation
```

---

**For detailed implementation info**, see **API_IMPLEMENTATION_SUMMARY.md**
**For setup instructions**, see **API_INTEGRATION_GUIDE.md**
