# Profithub DTrader Integration & Market Updates

## Overview
Complete integration of Deriv DTrader platform with removal of unsupported markets and timeframes.

## Changes Made

### 1. DTrader Integration
- **Location**: `components/tabs/profit-plus-rebuild.tsx` (Header section)
- **Feature**: Orange gradient button "Open DTrader" in the top right
- **Functionality**: Opens https://deriv-dtrader.vercel.app in a new tab
- **Authentication**: Uses login cookies from current session
- **Visibility**: Always visible in the header for quick access to live trading

### 2. Market & Timeframe Updates

#### Supported Timeframes
✓ 5s, 10s, 30s, 1m, 5m, 15m, 30m, 1h

#### Removed Unsupported Timeframes
- ✗ **1s** - Too fast for reliable data processing
- ✗ **31s** - Not supported by Deriv API
- ✗ **151s** - Not supported by Deriv API
- ✗ **901s** - Not supported by Deriv API

**Default Market**: Changed from 1s to 5s for reliability

### 3. Supported Markets (Per Deriv API v3)

#### Volatility Indices
- 1HZ10V, 1HZ25V, 1HZ50V, 1HZ75V, 1HZ100V, 1HZ150V, 1HZ200V

#### Synthetic Indices
- R_25, R_50, R_100

#### Forex Pairs
- EUR/GBP (frxEUGBP)
- EUR/USD (frxEUUSD)
- GBP/USD (frxGBPUSD)
- USD/JPY (frxUSDJPY)

### 4. New Components

#### `deriv-workflows.ts`
Complete reference implementation for Deriv API workflows:
```typescript
DERIV_WORKFLOWS.DOCUMENTATION     // Link to official docs
DERIV_WORKFLOWS.SUPPORTED_MARKETS // All active markets
DERIV_WORKFLOWS.VALID_TIMEFRAMES  // Supported durations
DERIV_WORKFLOWS.INVALID_TIMEFRAMES // Removed unsupported
DERIV_WORKFLOWS.CONTRACT_TYPES    // Available contracts
DERIV_WORKFLOWS.TRADING_RULES     // Min/max stakes
```

**Reference**: https://developers.deriv.com/docs/workflows/

#### `deriv-info-panel.tsx`
Interactive info panel integrated into ProfitPlus showing:
- Official Deriv documentation link
- Supported vs removed timeframes
- All supported markets by category
- DTrader platform information
- Trading limits (min/max stake, duration, payout range)
- Expandable/collapsible UI

### 5. File Structure

```
components/
├── tabs/
│   └── profit-plus-rebuild.tsx    (Updated with DTrader button & info panel)
├── deriv-info-panel.tsx           (NEW - Deriv info display)
└── ...

lib/
├── deriv-workflows.ts             (NEW - API reference)
└── ...
```

## How to Use

### 1. Access DTrader
- Click "Open DTrader" button in the ProfitPlus header
- Opens DTrader platform in a new tab
- Uses same login session (cookie-based auth)

### 2. View Supported Markets
- Toggle the "Deriv Trading Guide" info panel on the right sidebar
- Scroll through supported markets and timeframes
- Reference official documentation links

### 3. Execute Trades
- Select a timeframe (5s minimum)
- Configure trading parameters
- Click "Execute Trade"
- All trades execute with supported markets only

## API Configuration

**Location**: Environment variables referenced in `deriv-workflows.ts`

```
NEXT_PUBLIC_DERIV_APP_ID    = "1089" (default)
NEXT_PUBLIC_DERIV_SERVER    = "green.derivws.com" (default)
WS_URL                      = "wss://green.derivws.com/websockets/v3"
```

## Trading Rules

- **Min Stake**: $1
- **Max Stake**: $50,000
- **Min Duration**: 5 seconds
- **Max Duration**: 1 day (86,400 seconds)
- **Payout Range**: 0.5x - 5x

## Testing Checklist

- [x] DTrader button visible and clickable
- [x] Opens correct URL in new tab
- [x] Market selection shows only supported timeframes (5s, 10s, 30s, 1m, 5m)
- [x] Info panel displays correctly with all documentation
- [x] No 1s, 31s, 151s, 901s timeframes available
- [x] Default market is 5s
- [x] All components properly imported and integrated

## References

- **Official Deriv Workflows**: https://developers.deriv.com/docs/workflows/
- **DTrader Platform**: https://deriv-dtrader.vercel.app
- **Deriv WebSocket API**: wss://green.derivws.com/websockets/v3

## Next Steps

1. Deploy changes to production
2. Monitor DTrader integration for session management
3. Update market list if Deriv adds/removes markets
4. Consider adding more forex pairs based on user feedback
5. Implement real-time market status indicator
