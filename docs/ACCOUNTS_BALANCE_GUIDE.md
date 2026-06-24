# Accounts & Balance Guide

Complete guide for fetching user accounts, balances, and account details via the API.

## Table of Contents
1. [Get User Account Info](#get-user-account-info)
2. [Fetch User Balance](#fetch-user-balance)
3. [Get Account Details](#get-account-details)
4. [Account History & Transactions](#account-history--transactions)
5. [Multiple Accounts](#multiple-accounts)
6. [Real-time Balance Updates](#real-time-balance-updates)
7. [Error Handling](#error-handling)

---

## Get User Account Info

### Basic User Info

**Endpoint:**
```
GET /api/v1/users/{loginId}
```

**Authentication:**
```
Authorization: Bearer YOUR_API_KEY
```

**Parameters:**
- `loginId` (path): User's login ID (e.g., "john_doe")

**cURL:**
```bash
curl -X GET https://api.analysisprofithub.com/api/v1/users/john_doe \
  -H "Authorization: Bearer sk_live_abc123"
```

**Response (200 Success):**
```json
{
  "success": true,
  "data": {
    "loginId": "john_doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "balance": 50000.50,
    "accountStatus": "active",
    "accountType": "premium",
    "createdAt": "2024-01-15T10:30:00Z",
    "lastLogin": "2024-06-24T14:22:15Z",
    "totalTrades": 245,
    "winRate": 65.5,
    "totalProfit": 12500.75
  }
}
```

**JavaScript:**
```javascript
async function getUserInfo(loginId, apiKey) {
  const response = await fetch(
    `https://api.analysisprofithub.com/api/v1/users/${loginId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

// Usage
const userInfo = await getUserInfo('john_doe', 'sk_live_abc123');
console.log(`User: ${userInfo.firstName} ${userInfo.lastName}`);
console.log(`Balance: $${userInfo.balance}`);
```

**Python:**
```python
import requests

def get_user_info(login_id, api_key):
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    response = requests.get(
        f'https://api.analysisprofithub.com/api/v1/users/{login_id}',
        headers=headers
    )
    
    response.raise_for_status()
    return response.json()['data']

# Usage
user = get_user_info('john_doe', 'sk_live_abc123')
print(f"Balance: ${user['balance']}")
```

---

## Fetch User Balance

### Get Current Balance

**Endpoint:**
```
GET /api/v1/users/{loginId}/balance
```

**cURL:**
```bash
curl -X GET https://api.analysisprofithub.com/api/v1/users/john_doe/balance \
  -H "Authorization: Bearer sk_live_abc123"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "loginId": "john_doe",
    "balance": 50000.50,
    "currency": "USD",
    "lastUpdated": "2024-06-24T14:25:30Z",
    "availableBalance": 48000.50,
    "pendingBalance": 2000.00,
    "frozenBalance": 0.00
  }
}
```

**What Each Balance Means:**
- **balance**: Total account balance
- **availableBalance**: Can be used for trading
- **pendingBalance**: Awaiting settlement (in-progress trades)
- **frozenBalance**: Locked for open positions

### Get Balance History

**Endpoint:**
```
GET /api/v1/users/{loginId}/balance/history
```

**Query Parameters:**
- `days` (optional): Last N days (default: 30, max: 365)
- `limit` (optional): Number of records (default: 100, max: 1000)

**cURL:**
```bash
curl -X GET "https://api.analysisprofithub.com/api/v1/users/john_doe/balance/history?days=7&limit=50" \
  -H "Authorization: Bearer sk_live_abc123"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "loginId": "john_doe",
    "history": [
      {
        "timestamp": "2024-06-24T14:00:00Z",
        "balance": 50000.50,
        "change": 250.00,
        "source": "trade_profit",
        "details": "Trade #1245 profit"
      },
      {
        "timestamp": "2024-06-24T10:30:00Z",
        "balance": 49750.50,
        "change": -500.00,
        "source": "trade_loss",
        "details": "Trade #1244 loss"
      }
    ]
  }
}
```

**JavaScript - Real-time Balance Tracking:**
```javascript
class BalanceTracker {
  constructor(loginId, apiKey) {
    this.loginId = loginId;
    this.apiKey = apiKey;
    this.currentBalance = null;
  }

  async updateBalance() {
    const response = await fetch(
      `https://api.analysisprofithub.com/api/v1/users/${this.loginId}/balance`,
      {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      }
    );

    const data = await response.json();
    this.currentBalance = data.data.balance;
    return this.currentBalance;
  }

  async getBalanceHistory(days = 7) {
    const response = await fetch(
      `https://api.analysisprofithub.com/api/v1/users/${this.loginId}/balance/history?days=${days}`,
      {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      }
    );

    const data = await response.json();
    return data.data.history;
  }

  // Poll for balance changes
  startPolling(intervalMs = 5000) {
    setInterval(() => this.updateBalance(), intervalMs);
  }
}

// Usage
const tracker = new BalanceTracker('john_doe', 'sk_live_abc123');
const balance = await tracker.updateBalance();
console.log(`Current Balance: $${balance}`);

// Get history
const history = await tracker.getBalanceHistory(30);
history.forEach(entry => {
  console.log(`${entry.timestamp}: $${entry.balance} (${entry.source})`);
});
```

---

## Get Account Details

### Full Account Profile

**Endpoint:**
```
GET /api/v1/users/{loginId}/account
```

**Response:**
```json
{
  "success": true,
  "data": {
    "loginId": "john_doe",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1-555-1234",
      "country": "US",
      "timezone": "America/New_York"
    },
    "account": {
      "accountType": "premium",
      "status": "active",
      "verificationStatus": "verified",
      "createdAt": "2024-01-15T10:30:00Z",
      "lastModified": "2024-06-20T08:15:00Z",
      "subscriptionTier": "premium",
      "subscriptionExpiry": "2024-12-15T23:59:59Z"
    },
    "trading": {
      "totalTrades": 245,
      "winningTrades": 160,
      "losingTrades": 85,
      "winRate": 65.31,
      "avgWinProfit": 125.50,
      "avgLoseLoss": -75.25,
      "profitFactor": 2.15,
      "totalProfit": 12500.75,
      "maxDrawdown": -2500.00
    },
    "security": {
      "twoFactorEnabled": true,
      "lastPasswordChange": "2024-05-10T14:20:00Z",
      "apiKeysCount": 3,
      "activeSessions": 2
    }
  }
}
```

**cURL:**
```bash
curl -X GET https://api.analysisprofithub.com/api/v1/users/john_doe/account \
  -H "Authorization: Bearer sk_live_abc123"
```

**Python:**
```python
def get_account_details(login_id, api_key):
    headers = {'Authorization': f'Bearer {api_key}'}
    response = requests.get(
        f'https://api.analysisprofithub.com/api/v1/users/{login_id}/account',
        headers=headers
    )
    return response.json()['data']

# Usage
account = get_account_details('john_doe', 'sk_live_abc123')
print(f"Win Rate: {account['trading']['winRate']}%")
print(f"Total Profit: ${account['trading']['totalProfit']}")
print(f"2FA Enabled: {account['security']['twoFactorEnabled']}")
```

---

## Account History & Transactions

### Get Account Transactions

**Endpoint:**
```
GET /api/v1/users/{loginId}/transactions
```

**Query Parameters:**
- `type` (optional): "deposit", "withdrawal", "trade_profit", "trade_loss", "fee"
- `status` (optional): "pending", "completed", "failed"
- `startDate` (optional): ISO date (2024-06-01)
- `endDate` (optional): ISO date (2024-06-30)
- `limit` (optional): Max 1000

**cURL:**
```bash
curl -X GET "https://api.analysisprofithub.com/api/v1/users/john_doe/transactions?type=deposit&limit=50" \
  -H "Authorization: Bearer sk_live_abc123"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "loginId": "john_doe",
    "transactions": [
      {
        "id": "txn_12345",
        "type": "deposit",
        "amount": 5000.00,
        "currency": "USD",
        "status": "completed",
        "timestamp": "2024-06-20T10:30:00Z",
        "method": "bank_transfer",
        "description": "Fund deposit"
      },
      {
        "id": "txn_12346",
        "type": "trade_profit",
        "amount": 150.00,
        "currency": "USD",
        "status": "completed",
        "timestamp": "2024-06-22T14:15:00Z",
        "relatedTrade": "trade_1245",
        "description": "Profit from EUR/USD"
      }
    ],
    "pagination": {
      "total": 245,
      "page": 1,
      "limit": 50,
      "pages": 5
    }
  }
}
```

### Get Single Transaction

**Endpoint:**
```
GET /api/v1/users/{loginId}/transactions/{transactionId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "txn_12345",
    "type": "deposit",
    "amount": 5000.00,
    "currency": "USD",
    "status": "completed",
    "timestamp": "2024-06-20T10:30:00Z",
    "method": "bank_transfer",
    "description": "Fund deposit",
    "fee": 0.00,
    "netAmount": 5000.00,
    "reference": "DEPOSIT-2024-0620",
    "metadata": {
      "bankName": "Chase",
      "accountLast4": "1234"
    }
  }
}
```

---

## Multiple Accounts

### Fetch All User Accounts

**Endpoint:**
```
GET /api/v1/users
```

**Query Parameters:**
- `status` (optional): "active", "inactive", "suspended"
- `limit` (optional): 1-1000 (default: 100)
- `offset` (optional): Pagination offset

**cURL:**
```bash
curl -X GET "https://api.analysisprofithub.com/api/v1/users?status=active&limit=50" \
  -H "Authorization: Bearer sk_live_abc123"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "loginId": "john_doe",
        "email": "john@example.com",
        "balance": 50000.50,
        "accountStatus": "active",
        "totalTrades": 245,
        "winRate": 65.5
      },
      {
        "loginId": "jane_smith",
        "email": "jane@example.com",
        "balance": 75000.00,
        "accountStatus": "active",
        "totalTrades": 189,
        "winRate": 58.2
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 50,
      "offset": 0,
      "pages": 3
    }
  }
}
```

**JavaScript - Pagination:**
```javascript
async function getAllUsers(apiKey, pageSize = 100) {
  let allUsers = [];
  let offset = 0;

  while (true) {
    const response = await fetch(
      `https://api.analysisprofithub.com/api/v1/users?limit=${pageSize}&offset=${offset}`,
      {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      }
    );

    const data = await response.json();
    allUsers.push(...data.data.users);

    if (data.data.pagination.offset + data.data.pagination.limit >= data.data.pagination.total) {
      break;
    }

    offset += pageSize;
  }

  return allUsers;
}

// Usage
const users = await getAllUsers('sk_live_abc123');
console.log(`Total users: ${users.length}`);
users.forEach(user => {
  console.log(`${user.loginId}: $${user.balance}`);
});
```

---

## Real-time Balance Updates

### WebSocket Connection (Optional)

```javascript
class RealtimeBalanceUpdater {
  constructor(loginId, apiKey) {
    this.loginId = loginId;
    this.apiKey = apiKey;
    this.ws = null;
  }

  connect() {
    this.ws = new WebSocket(
      `wss://api.analysisprofithub.com/ws/balance?` +
      `loginId=${this.loginId}&token=${this.apiKey}`
    );

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log(`Balance updated: $${data.balance}`);
      this.onBalanceUpdate(data);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  onBalanceUpdate(data) {
    // Override this method in your class
    console.log(data);
  }

  disconnect() {
    if (this.ws) this.ws.close();
  }
}

// Usage
const updater = new RealtimeBalanceUpdater('john_doe', 'sk_live_abc123');
updater.onBalanceUpdate = (data) => {
  console.log(`New balance: $${data.balance}`);
};
updater.connect();
```

---

## Error Handling

### Common Errors

**401 Unauthorized - Invalid API Key**
```json
{
  "success": false,
  "error": "Invalid API key",
  "errorCode": "AUTH_INVALID_KEY"
}
```

**404 Not Found - User Doesn't Exist**
```json
{
  "success": false,
  "error": "User not found",
  "errorCode": "USER_NOT_FOUND"
}
```

**429 Rate Limited**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "errorCode": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

### Retry Strategy

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        console.log(`Rate limited. Retrying after ${retryAfter}s...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## Complete Example

```javascript
// Complete account and balance management

class AccountManager {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.analysisprofithub.com/api/v1';
  }

  async getUser(loginId) {
    const response = await fetch(`${this.baseUrl}/users/${loginId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    return response.json();
  }

  async getBalance(loginId) {
    const response = await fetch(`${this.baseUrl}/users/${loginId}/balance`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    return response.json();
  }

  async getAccountDetails(loginId) {
    const response = await fetch(`${this.baseUrl}/users/${loginId}/account`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    return response.json();
  }

  async getTransactions(loginId, filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(
      `${this.baseUrl}/users/${loginId}/transactions?${params}`,
      { headers: { 'Authorization': `Bearer ${this.apiKey}` } }
    );
    return response.json();
  }

  async getBalanceHistory(loginId, days = 30) {
    const response = await fetch(
      `${this.baseUrl}/users/${loginId}/balance/history?days=${days}`,
      { headers: { 'Authorization': `Bearer ${this.apiKey}` } }
    );
    return response.json();
  }
}

// Usage
const manager = new AccountManager('sk_live_abc123');

// Get user info
const user = await manager.getUser('john_doe');
console.log(`User: ${user.data.firstName} ${user.data.lastName}`);

// Get current balance
const balance = await manager.getBalance('john_doe');
console.log(`Balance: $${balance.data.balance}`);

// Get account details with trading stats
const account = await manager.getAccountDetails('john_doe');
console.log(`Win Rate: ${account.data.trading.winRate}%`);

// Get recent transactions
const transactions = await manager.getTransactions('john_doe', {
  limit: 10,
  type: 'trade_profit'
});
transactions.data.transactions.forEach(tx => {
  console.log(`${tx.timestamp}: ${tx.description} (+$${tx.amount})`);
});

// Get balance history
const history = await manager.getBalanceHistory('john_doe', 7);
console.log(`7-day balance changes:`, history.data.history);
```

---

## Support

For account-related issues:
- Check API key validity
- Verify loginId is correct
- Ensure user account status is "active"
- Contact: support@analysisprofithub.com
