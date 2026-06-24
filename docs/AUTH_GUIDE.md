# Authentication Guide

Complete guide for authenticating with AnalysisProfitHub API using API Keys and OAuth.

## Table of Contents
1. [API Key Authentication](#api-key-authentication)
2. [OAuth 2.0 Authentication](#oauth-20-authentication)
3. [User Login](#user-login)
4. [Session Management](#session-management)
5. [Error Handling](#error-handling)
6. [Security Best Practices](#security-best-practices)

---

## API Key Authentication

### Overview
API Key authentication is the simplest method for server-to-server communication. Each API key is stateless and includes rate limiting.

### Step 1: Generate an API Key

In the admin dashboard, navigate to **Integrations > API Keys** and click **Create New Key**.

Fill in:
- **Name**: Your integration name (e.g., "Trading Bot A")
- **Rate Limit**: Requests per minute (default: 100, max: 1000)
- **Scopes**: Select permissions:
  - `users:read` - Access user data
  - `trades:read` - Access trade history
  - `market:read` - Access market data
  - `analytics:read` - Access platform analytics
- **Expiry**: Set expiration (optional, default: 90 days)

Click **Generate Key** → Copy and store securely (shown only once!)

### Step 2: Use API Key in Requests

Add the key to the `Authorization` header:

```bash
curl -X GET http://api.analysisprofithub.com/api/v1/users \
  -H "Authorization: Bearer sk_live_abcd1234efgh5678"
```

**cURL Example:**
```bash
curl -X GET https://api.analysisprofithub.com/api/v1/users/john_doe \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"
```

**JavaScript/Node.js:**
```javascript
const apiKey = 'sk_live_YOUR_API_KEY';

fetch('https://api.analysisprofithub.com/api/v1/users/john_doe', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

**Python:**
```python
import requests

api_key = 'sk_live_YOUR_API_KEY'
headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.analysisprofithub.com/api/v1/users/john_doe',
    headers=headers
)
print(response.json())
```

### Step 3: Handle API Responses

Success (200):
```json
{
  "success": true,
  "data": {
    "loginId": "john_doe",
    "email": "john@example.com",
    "balance": 50000.50
  }
}
```

Rate Limited (429):
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

Unauthorized (401):
```json
{
  "success": false,
  "error": "Invalid or expired API key"
}
```

---

## OAuth 2.0 Authentication

### Overview
OAuth 2.0 is used for user-delegated access. Users grant permission for your app to access their data.

### Step 1: Register Your Application

1. Go to Admin Dashboard → **OAuth Applications**
2. Click **Create New Application**
3. Fill in:
   - **App Name**: Your application name
   - **Redirect URI**: Where users return after auth (e.g., `https://yourapp.com/auth/callback`)
   - **Scopes**: Select permissions needed
4. Save and get:
   - **Client ID** (public)
   - **Client Secret** (keep secret!)

### Step 2: Redirect User to Login

Create a login button that redirects to:

```
https://api.analysisprofithub.com/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=YOUR_REDIRECT_URI&
  response_type=code&
  scope=users:read%20trades:read%20balance:read&
  state=RANDOM_STRING_FOR_SECURITY
```

**URL Parameters:**
- `client_id`: Your app's client ID
- `redirect_uri`: Must match registered URI exactly
- `response_type`: Always `code` (authorization code flow)
- `scope`: Space-separated permissions
- `state`: Random string to prevent CSRF (verify it matches on callback!)

### Step 3: Handle the Callback

User authorizes → redirected to:
```
https://yourapp.com/auth/callback?code=AUTH_CODE&state=RANDOM_STRING
```

**Important**: Verify `state` parameter matches what you sent!

### Step 4: Exchange Code for Token

On your backend, POST to exchange the code:

```bash
curl -X POST https://api.analysisprofithub.com/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "code": "AUTH_CODE",
    "redirect_uri": "YOUR_REDIRECT_URI",
    "grant_type": "authorization_code"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "refresh_token_xyz",
  "expires_in": 3600,
  "token_type": "Bearer",
  "scope": "users:read trades:read balance:read"
}
```

**Node.js:**
```javascript
const exchangeCodeForToken = async (code) => {
  const response = await fetch('https://api.analysisprofithub.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET,
      code: code,
      redirect_uri: process.env.OAUTH_REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  });
  
  return response.json();
};
```

### Step 5: Use Access Token

Make API calls with the access token:

```bash
curl -X GET https://api.analysisprofithub.com/api/v1/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Step 6: Refresh Token (Optional)

Access tokens expire. Use refresh token to get a new one:

```bash
curl -X POST https://api.analysisprofithub.com/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "refresh_token": "refresh_token_xyz",
    "grant_type": "refresh_token"
  }'
```

---

## User Login

### Standard User Login (Web/App)

Users log in directly to the platform:

**Endpoint:**
```
POST /api/auth/login
```

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "user": {
    "loginId": "john_doe",
    "email": "john@example.com",
    "name": "John Doe",
    "balance": 50000.50,
    "accountStatus": "active"
  },
  "sessionToken": "sess_abc123xyz",
  "expiresIn": 86400
}
```

**Response (Invalid Credentials 401):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

**cURL:**
```bash
curl -X POST https://api.analysisprofithub.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }' \
  -c cookies.txt
```

**JavaScript (Front-end):**
```javascript
async function login(email, password) {
  const response = await fetch('https://api.analysisprofithub.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Send cookies
    body: JSON.stringify({ email, password })
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('sessionToken', data.sessionToken);
    // Redirect to dashboard
    window.location.href = '/dashboard';
  } else {
    const error = await response.json();
    console.error(error.error);
  }
}
```

---

## Session Management

### Get Current Session

```bash
curl -X GET https://api.analysisprofithub.com/api/auth/me \
  -H "Authorization: Bearer sessionToken_or_accessToken"
```

**Response:**
```json
{
  "success": true,
  "user": {
    "loginId": "john_doe",
    "email": "john@example.com",
    "balance": 50000.50,
    "lastLogin": "2024-06-24T10:30:00Z",
    "accountStatus": "active"
  }
}
```

### Logout

```bash
curl -X POST https://api.analysisprofithub.com/api/auth/logout \
  -H "Authorization: Bearer sessionToken"
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Refresh Session Token

```bash
curl -X POST https://api.analysisprofithub.com/api/auth/refresh \
  -H "Authorization: Bearer sessionToken"
```

**Response:**
```json
{
  "success": true,
  "sessionToken": "new_session_token",
  "expiresIn": 86400
}
```

---

## Error Handling

### Common Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request | Check parameters |
| 401 | Unauthorized | Invalid/expired credentials |
| 403 | Forbidden | Insufficient permissions |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Contact support |

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "errorCode": "AUTH_INVALID_CREDENTIALS",
  "details": {
    "field": "email",
    "message": "Email format invalid"
  }
}
```

### Retry Logic

```javascript
async function callApiWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 60;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
      
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

---

## Security Best Practices

### Do's ✅
- **Store secrets securely** - Use environment variables, not in code
- **Use HTTPS only** - All API calls must be over HTTPS
- **Rotate keys regularly** - Every 90 days minimum
- **Validate state parameter** - Prevents CSRF attacks
- **Use strong passwords** - Minimum 12 characters
- **Enable 2FA** - For admin accounts
- **Log API calls** - Track usage for security
- **Set expiration dates** - Keys should expire
- **Use minimal scopes** - Request only needed permissions

### Don'ts ❌
- **Never commit API keys** - Use .env files
- **Never share client secret** - Keep server-side only
- **Never use HTTP** - Always use HTTPS
- **Never hardcode credentials** - Use environment variables
- **Never expose tokens in URLs** - Use headers instead
- **Never log sensitive data** - Never print tokens
- **Never trust client input** - Always validate server-side
- **Never reuse tokens** - Generate new ones per session

### Secure Storage

**Node.js - dotenv:**
```
# .env
API_KEY=sk_live_abc123
OAUTH_CLIENT_SECRET=secret_xyz
```

```javascript
require('dotenv').config();
const apiKey = process.env.API_KEY;
```

**Python:**
```python
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('API_KEY')
```

---

## Complete Example: Full Authentication Flow

```javascript
// Full OAuth + API call example

class AnalysisProfitAPI {
  constructor(clientId, clientSecret, redirectUri) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.accessToken = null;
  }

  // Step 1: Generate login URL
  getLoginUrl() {
    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem('oauthState', state);
    
    return `https://api.analysisprofithub.com/oauth/authorize?` +
      `client_id=${this.clientId}&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `response_type=code&` +
      `scope=users:read%20trades:read%20balance:read&` +
      `state=${state}`;
  }

  // Step 2: Handle callback
  async handleCallback(code, state) {
    // Verify state
    const savedState = sessionStorage.getItem('oauthState');
    if (state !== savedState) throw new Error('Invalid state');

    // Exchange code for token
    const response = await fetch('https://api.analysisprofithub.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const data = await response.json();
    this.accessToken = data.access_token;
    sessionStorage.setItem('accessToken', this.accessToken);
    return data;
  }

  // Step 3: Call API
  async getUser(loginId) {
    const response = await fetch(
      `https://api.analysisprofithub.com/api/v1/users/${loginId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      }
    );

    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  }

  // Step 4: Get user balance
  async getBalance(loginId) {
    const user = await this.getUser(loginId);
    return user.data.balance;
  }
}

// Usage
const api = new AnalysisProfitAPI(
  process.env.OAUTH_CLIENT_ID,
  process.env.OAUTH_CLIENT_SECRET,
  'https://yourapp.com/auth/callback'
);

// Redirect user to login
const loginUrl = api.getLoginUrl();
window.location.href = loginUrl;

// After redirect back...
const urlParams = new URLSearchParams(window.location.search);
await api.handleCallback(urlParams.get('code'), urlParams.get('state'));

// Fetch user data
const balance = await api.getBalance('john_doe');
console.log(`Balance: $${balance}`);
```

---

## Support

For authentication issues:
1. Check error code in response
2. Verify API key/token is valid and not expired
3. Ensure all parameters match exactly
4. Contact support: support@analysisprofithub.com
