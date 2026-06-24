# API Usage Examples

Quick copy-paste examples for common tasks.

## Table of Contents
1. [JavaScript/Node.js](#javascriptnodejs)
2. [Python](#python)
3. [cURL](#curl)
4. [Real-world Scenarios](#real-world-scenarios)

---

## JavaScript/Node.js

### Setup

```javascript
// Basic setup
const API_KEY = 'sk_live_your_api_key_here';
const BASE_URL = 'https://api.analysisprofithub.com/api/v1';

async function request(method, path, body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${path}`, options);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
```

### Get User Info

```javascript
// Get user information
async function getUserInfo(loginId) {
  try {
    const result = await request('GET', `/users/${loginId}`);
    return result.data;
  } catch (error) {
    console.error('Error fetching user:', error);
  }
}

// Usage
const user = await getUserInfo('john_doe');
console.log(`Name: ${user.firstName} ${user.lastName}`);
console.log(`Balance: $${user.balance}`);
console.log(`Win Rate: ${user.winRate}%`);
```

### Fetch Balance

```javascript
// Get current balance
async function getBalance(loginId) {
  try {
    const result = await request('GET', `/users/${loginId}/balance`);
    const balance = result.data;
    console.log(`Available: $${balance.availableBalance}`);
    console.log(`Pending: $${balance.pendingBalance}`);
    console.log(`Total: $${balance.balance}`);
    return balance;
  } catch (error) {
    console.error('Error fetching balance:', error);
  }
}

// Usage
await getBalance('john_doe');
```

### Get All Trades

```javascript
// Fetch all trades for a user
async function getTrades(loginId, limit = 100) {
  try {
    const result = await request('GET', `/trades?loginId=${loginId}&limit=${limit}`);
    return result.data.trades;
  } catch (error) {
    console.error('Error fetching trades:', error);
  }
}

// Usage
const trades = await getTrades('john_doe', 50);
trades.forEach(trade => {
  console.log(`${trade.symbol}: ${trade.type} @${trade.entryPrice}`);
});
```

### Get Balance History

```javascript
// Get balance changes over time
async function getBalanceHistory(loginId, days = 7) {
  try {
    const result = await request(
      'GET',
      `/users/${loginId}/balance/history?days=${days}&limit=100`
    );
    return result.data.history;
  } catch (error) {
    console.error('Error fetching history:', error);
  }
}

// Usage
const history = await getBalanceHistory('john_doe', 30);
history.forEach(entry => {
  console.log(`${entry.timestamp}: $${entry.balance}`);
});
```

### Get Account Details

```javascript
// Full account information
async function getAccountDetails(loginId) {
  try {
    const result = await request('GET', `/users/${loginId}/account`);
    const account = result.data;

    console.log('Profile:');
    console.log(`  Email: ${account.profile.email}`);
    console.log(`  Country: ${account.profile.country}`);

    console.log('\nTrading Stats:');
    console.log(`  Total Trades: ${account.trading.totalTrades}`);
    console.log(`  Win Rate: ${account.trading.winRate}%`);
    console.log(`  Total Profit: $${account.trading.totalProfit}`);

    console.log('\nSecurity:');
    console.log(`  2FA Enabled: ${account.security.twoFactorEnabled}`);
    console.log(`  Active Sessions: ${account.security.activeSessions}`);

    return account;
  } catch (error) {
    console.error('Error fetching account:', error);
  }
}

// Usage
await getAccountDetails('john_doe');
```

### Dashboard Summary

```javascript
// Create a dashboard summary
async function getDashboardSummary(loginId) {
  try {
    const [user, balance, account] = await Promise.all([
      request('GET', `/users/${loginId}`),
      request('GET', `/users/${loginId}/balance`),
      request('GET', `/users/${loginId}/account`)
    ]);

    return {
      user: user.data,
      balance: balance.data,
      stats: account.data.trading
    };
  } catch (error) {
    console.error('Error fetching dashboard:', error);
  }
}

// Usage
const summary = await getDashboardSummary('john_doe');
console.log(summary);
```

---

## Python

### Setup

```python
import requests
import json
from datetime import datetime

API_KEY = 'sk_live_your_api_key_here'
BASE_URL = 'https://api.analysisprofithub.com/api/v1'

class AnalysisAPI:
    def __init__(self, api_key):
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })

    def request(self, method, path, **kwargs):
        url = f'{BASE_URL}{path}'
        response = self.session.request(method, url, **kwargs)
        response.raise_for_status()
        return response.json()
```

### Get User Info

```python
def get_user(api, login_id):
    result = api.request('GET', f'/users/{login_id}')
    user = result['data']
    print(f"Name: {user['firstName']} {user['lastName']}")
    print(f"Balance: ${user['balance']}")
    print(f"Total Trades: {user['totalTrades']}")
    print(f"Win Rate: {user['winRate']}%")
    return user

# Usage
api = AnalysisAPI(API_KEY)
user = get_user(api, 'john_doe')
```

### Fetch Balance

```python
def get_balance(api, login_id):
    result = api.request('GET', f'/users/{login_id}/balance')
    balance = result['data']
    print(f"Total Balance: ${balance['balance']}")
    print(f"Available: ${balance['availableBalance']}")
    print(f"Pending: ${balance['pendingBalance']}")
    print(f"Frozen: ${balance['frozenBalance']}")
    return balance

# Usage
balance = get_balance(api, 'john_doe')
```

### Get All Trades

```python
def get_trades(api, login_id, limit=100):
    result = api.request('GET', f'/trades?loginId={login_id}&limit={limit}')
    trades = result['data']['trades']
    
    print(f"Total trades: {len(trades)}")
    for trade in trades:
        print(f"{trade['symbol']}: {trade['type']} @ {trade['entryPrice']}")
    
    return trades

# Usage
trades = get_trades(api, 'john_doe', 50)
```

### Get Balance History

```python
def get_balance_history(api, login_id, days=7):
    result = api.request(
        'GET',
        f'/users/{login_id}/balance/history?days={days}&limit=100'
    )
    history = result['data']['history']
    
    print(f"Balance history (last {days} days):")
    for entry in history:
        print(f"{entry['timestamp']}: ${entry['balance']} ({entry['source']})")
    
    return history

# Usage
history = get_balance_history(api, 'john_doe', 30)
```

### Get Account Transactions

```python
def get_transactions(api, login_id, tx_type=None, limit=100):
    params = f'?limit={limit}'
    if tx_type:
        params += f'&type={tx_type}'
    
    result = api.request('GET', f'/users/{login_id}/transactions{params}')
    transactions = result['data']['transactions']
    
    print(f"Total transactions: {len(transactions)}")
    for tx in transactions:
        print(f"{tx['timestamp']}: {tx['type']} ${tx['amount']}")
    
    return transactions

# Usage
# Get all deposits
deposits = get_transactions(api, 'john_doe', 'deposit', 50)

# Get all trades
trade_txs = get_transactions(api, 'john_doe', 'trade_profit', 50)
```

### Get Account Details

```python
def get_account_details(api, login_id):
    result = api.request('GET', f'/users/{login_id}/account')
    account = result['data']
    
    print("=== Account Profile ===")
    print(f"Email: {account['profile']['email']}")
    print(f"Country: {account['profile']['country']}")
    print(f"Status: {account['account']['status']}")
    
    print("\n=== Trading Stats ===")
    trading = account['trading']
    print(f"Total Trades: {trading['totalTrades']}")
    print(f"Winning: {trading['winningTrades']}")
    print(f"Losing: {trading['losingTrades']}")
    print(f"Win Rate: {trading['winRate']}%")
    print(f"Total Profit: ${trading['totalProfit']}")
    print(f"Max Drawdown: ${trading['maxDrawdown']}")
    
    print("\n=== Security ===")
    security = account['security']
    print(f"2FA Enabled: {security['twoFactorEnabled']}")
    print(f"Active Sessions: {security['activeSessions']}")
    
    return account

# Usage
account = get_account_details(api, 'john_doe')
```

### Dashboard Summary

```python
def get_dashboard(api, login_id):
    user = api.request('GET', f'/users/{login_id}')['data']
    balance = api.request('GET', f'/users/{login_id}/balance')['data']
    account = api.request('GET', f'/users/{login_id}/account')['data']
    
    return {
        'user': user,
        'balance': balance,
        'trading': account['trading'],
        'security': account['security']
    }

# Usage
dashboard = get_dashboard(api, 'john_doe')
print(json.dumps(dashboard, indent=2))
```

---

## cURL

### Get User Info

```bash
curl -X GET https://api.analysisprofithub.com/api/v1/users/john_doe \
  -H "Authorization: Bearer sk_live_your_api_key_here" \
  -H "Content-Type: application/json"
```

### Fetch Balance

```bash
curl -X GET https://api.analysisprofithub.com/api/v1/users/john_doe/balance \
  -H "Authorization: Bearer sk_live_your_api_key_here"
```

### Get Trades (with limit)

```bash
curl -X GET "https://api.analysisprofithub.com/api/v1/trades?loginId=john_doe&limit=50" \
  -H "Authorization: Bearer sk_live_your_api_key_here"
```

### Get Balance History (last 7 days)

```bash
curl -X GET "https://api.analysisprofithub.com/api/v1/users/john_doe/balance/history?days=7&limit=100" \
  -H "Authorization: Bearer sk_live_your_api_key_here"
```

### Get Account Details

```bash
curl -X GET https://api.analysisprofithub.com/api/v1/users/john_doe/account \
  -H "Authorization: Bearer sk_live_your_api_key_here"
```

### Get Transactions

```bash
curl -X GET "https://api.analysisprofithub.com/api/v1/users/john_doe/transactions?limit=50" \
  -H "Authorization: Bearer sk_live_your_api_key_here"
```

### Save Response to File

```bash
curl -X GET https://api.analysisprofithub.com/api/v1/users/john_doe \
  -H "Authorization: Bearer sk_live_your_api_key_here" \
  -o user_data.json
```

### Pretty Print JSON Response

```bash
curl -X GET https://api.analysisprofithub.com/api/v1/users/john_doe \
  -H "Authorization: Bearer sk_live_your_api_key_here" | jq
```

---

## Real-world Scenarios

### Scenario 1: Monitor User Balance Changes

```javascript
// Alert when balance changes significantly
async function monitorBalance(loginId, checkInterval = 5000) {
  let lastBalance = null;

  setInterval(async () => {
    try {
      const result = await request('GET', `/users/${loginId}/balance`);
      const currentBalance = result.data.balance;

      if (lastBalance === null) {
        lastBalance = currentBalance;
        return;
      }

      const change = currentBalance - lastBalance;
      const changePercent = (change / lastBalance * 100).toFixed(2);

      if (Math.abs(change) > 100) {
        console.log(
          `⚠️ Balance changed: $${change} (${changePercent}%)`
        );
        console.log(`Previous: $${lastBalance} → Current: $${currentBalance}`);
      }

      lastBalance = currentBalance;
    } catch (error) {
      console.error('Monitor error:', error);
    }
  }, checkInterval);
}

// Usage
monitorBalance('john_doe', 10000); // Check every 10 seconds
```

### Scenario 2: Export Monthly Report

```python
def generate_monthly_report(api, login_id, month, year):
    """Generate trading report for a specific month"""
    
    # Get account details
    account = api.request('GET', f'/users/{login_id}/account')['data']
    user = api.request('GET', f'/users/{login_id}')['data']
    
    # Get transactions for the month
    start_date = f'{year}-{month:02d}-01'
    end_date = f'{year}-{month:02d}-28'
    
    txns = api.request(
        'GET',
        f'/users/{login_id}/transactions?startDate={start_date}&endDate={end_date}&limit=1000'
    )['data']['transactions']
    
    # Calculate totals
    deposits = sum(t['amount'] for t in txns if t['type'] == 'deposit')
    profits = sum(t['amount'] for t in txns if t['type'] == 'trade_profit')
    losses = sum(t['amount'] for t in txns if t['type'] == 'trade_loss')
    
    # Generate report
    report = f"""
    ===== MONTHLY TRADING REPORT =====
    User: {user['firstName']} {user['lastName']}
    Period: {month}/{year}
    
    Account Balance: ${user['balance']}
    
    Transactions:
      Deposits: ${deposits}
      Profits: ${profits}
      Losses: ${losses}
      Net: ${deposits + profits - abs(losses)}
    
    Trading Stats:
      Total Trades: {account['trading']['totalTrades']}
      Win Rate: {account['trading']['winRate']}%
      Total Profit (lifetime): ${account['trading']['totalProfit']}
      Max Drawdown: ${account['trading']['maxDrawdown']}
    """
    
    return report

# Usage
report = generate_monthly_report(api, 'john_doe', 6, 2024)
print(report)
```

### Scenario 3: Batch User Export

```python
def export_all_users_summary(api, limit=1000):
    """Export summary for all users"""
    
    # Get all users
    result = api.request('GET', f'/users?limit={limit}')
    users = result['data']['users']
    
    print("LoginID,Email,Balance,Total Trades,Win Rate,Total Profit")
    
    for user in users:
        try:
            account = api.request('GET', f'/users/{user["loginId"]}/account')['data']
            trading = account['trading']
            
            print(
                f'{user["loginId"]},'
                f'{user["email"]},'
                f'${user["balance"]},'
                f'{trading["totalTrades"]},'
                f'{trading["winRate"]}%,'
                f'${trading["totalProfit"]}'
            )
        except Exception as e:
            print(f'Error processing {user["loginId"]}: {e}')

# Usage
export_all_users_summary(api)
```

### Scenario 4: Calculate Win/Loss Statistics

```javascript
async function calculateTradeStats(loginId) {
  try {
    const tradesResult = await request('GET', `/trades?loginId=${loginId}&limit=1000`);
    const trades = tradesResult.data.trades;

    const stats = {
      total: trades.length,
      wins: 0,
      losses: 0,
      breakeven: 0,
      totalProfit: 0,
      totalLoss: 0,
      avgProfit: 0,
      avgLoss: 0,
      largestWin: 0,
      largestLoss: 0
    };

    trades.forEach(trade => {
      const profit = trade.exitPrice - trade.entryPrice;

      if (profit > 0) {
        stats.wins++;
        stats.totalProfit += profit;
        stats.largestWin = Math.max(stats.largestWin, profit);
      } else if (profit < 0) {
        stats.losses++;
        stats.totalLoss += Math.abs(profit);
        stats.largestLoss = Math.max(stats.largestLoss, Math.abs(profit));
      } else {
        stats.breakeven++;
      }
    });

    stats.avgProfit = stats.wins > 0 ? stats.totalProfit / stats.wins : 0;
    stats.avgLoss = stats.losses > 0 ? stats.totalLoss / stats.losses : 0;
    stats.winRate = ((stats.wins / stats.total) * 100).toFixed(2);

    console.log('Trade Statistics:');
    console.log(`  Total Trades: ${stats.total}`);
    console.log(`  Wins: ${stats.wins} (${stats.winRate}%)`);
    console.log(`  Losses: ${stats.losses}`);
    console.log(`  Break-even: ${stats.breakeven}`);
    console.log(`  Total Profit: $${stats.totalProfit.toFixed(2)}`);
    console.log(`  Total Loss: $${stats.totalLoss.toFixed(2)}`);
    console.log(`  Avg Profit/Trade: $${stats.avgProfit.toFixed(2)}`);
    console.log(`  Avg Loss/Trade: $${stats.avgLoss.toFixed(2)}`);
    console.log(`  Largest Win: $${stats.largestWin.toFixed(2)}`);
    console.log(`  Largest Loss: $${stats.largestLoss.toFixed(2)}`);

    return stats;
  } catch (error) {
    console.error('Error calculating stats:', error);
  }
}

// Usage
await calculateTradeStats('john_doe');
```

---

## Error Handling Template

```javascript
async function apiCall(path, method = 'GET', body = null) {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : null
    });

    if (response.status === 429) {
      console.error('Rate limited. Retrying...');
      await new Promise(r => setTimeout(r, 5000));
      return apiCall(path, method, body);
    }

    if (response.status === 401) {
      console.error('Unauthorized. Check API key.');
      return null;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    return response.json();
  } catch (error) {
    console.error(`API Error: ${error.message}`);
    return null;
  }
}
```

---

For more examples and help, visit the documentation hub or contact support.
