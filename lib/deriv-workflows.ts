// Deriv Workflows Documentation Reference
// Based on: https://developers.deriv.com/docs/workflows/

export const DERIV_WORKFLOWS = {
  DOCUMENTATION: 'https://developers.deriv.com/docs/workflows/',
  
  // Supported Markets (v1 update)
  SUPPORTED_MARKETS: {
    VOLATILITY_INDICES: [
      { symbol: '1HZ10V', name: 'Volatility 10 Index' },
      { symbol: '1HZ25V', name: 'Volatility 25 Index' },
      { symbol: '1HZ50V', name: 'Volatility 50 Index' },
      { symbol: '1HZ75V', name: 'Volatility 75 Index' },
      { symbol: '1HZ100V', name: 'Volatility 100 Index' },
      { symbol: '1HZ150V', name: 'Volatility 150 Index' },
      { symbol: '1HZ200V', name: 'Volatility 200 Index' },
    ],
    SYNTHETIC_INDICES: [
      { symbol: 'R_25', name: 'Synthetic Index 25' },
      { symbol: 'R_50', name: 'Synthetic Index 50' },
      { symbol: 'R_100', name: 'Synthetic Index 100' },
    ],
    FOREX: [
      { symbol: 'frxEUGBP', name: 'EUR/GBP' },
      { symbol: 'frxEUUSD', name: 'EUR/USD' },
      { symbol: 'frxGBPUSD', name: 'GBP/USD' },
      { symbol: 'frxUSDJPY', name: 'USD/JPY' },
    ],
  },

  // Contract Types Supported
  CONTRACT_TYPES: {
    BINARY: [
      'DIGITOVER',  // Over/Under
      'DIGITMATCH', // Matches/Differs
      'DIGITEVEN',  // Even/Odd
      'DIGITODD',   // Odd/Even
    ],
    RISE_FALL: [
      'CALL',   // Rise/UP
      'PUT',    // Fall/DOWN
    ],
  },

  // Timeframes (remove 1s, 31s, 151s, 901s as unsupported)
  VALID_TIMEFRAMES: [
    '5s',   // 5 seconds
    '10s',  // 10 seconds
    '30s',  // 30 seconds
    '1m',   // 1 minute
    '5m',   // 5 minutes
    '15m',  // 15 minutes
    '30m',  // 30 minutes
    '1h',   // 1 hour
  ],

  INVALID_TIMEFRAMES: [
    '1s',    // Removed: Too fast for reliable data
    '31s',   // Removed: Unsupported tick duration
    '151s',  // Removed: Unsupported tick duration
    '901s',  // Removed: Unsupported tick duration
  ],

  // API Response Codes (for error handling)
  ERROR_CODES: {
    INVALID_SYMBOL: 'InvalidSymbol',
    INVALID_DURATION: 'InvalidDuration',
    INVALID_STAKE: 'InvalidStake',
    INSUFFICIENT_BALANCE: 'InsufficientBalance',
    MAINTENANCE: 'Maintenance',
    MARKET_CLOSED: 'MarketClosed',
  },

  // Last Digit Extraction Rules
  DIGIT_EXTRACTION: {
    VOLATILITY_INDICES: {
      '1HZ10V': 2,   // Take digits at position 2
      '1HZ25V': 2,
      '1HZ50V': 2,
      '1HZ75V': 2,
      '1HZ100V': 2,
      '1HZ150V': 4,  // Take digits at position 4
      '1HZ200V': 3,  // Take digits at position 3
    },
    SYNTHETIC_INDICES: {
      'R_25': 2,
      'R_50': 2,
      'R_100': 2,
    },
  },

  // Deriv API Configuration
  API_CONFIG: {
    APP_ID: process.env.NEXT_PUBLIC_DERIV_APP_ID || '1089',
    SERVER: process.env.NEXT_PUBLIC_DERIV_SERVER || 'green.derivws.com',
    WS_URL: 'wss://green.derivws.com/websockets/v3',
  },

  // DTrader Integration
  DTRADER: {
    URL: 'https://deriv-dtrader.vercel.app',
    DESCRIPTION: 'Web-based trading platform for Deriv accounts',
    FEATURES: [
      'Real-time market data',
      'Live price charts',
      'One-click trading',
      'Trade history',
      'Account management',
      'Cookie-based authentication',
    ],
  },

  // Trading Rules
  TRADING_RULES: {
    MIN_STAKE: 1,
    MAX_STAKE: 50000,
    MIN_DURATION: 5,  // 5 seconds
    MAX_DURATION: 86400,  // 1 day in seconds
    PAYOUT_RANGE: [0.5, 5],  // Min 0.5x, Max 5x
  },

  // Get all valid markets for dropdowns
  getAllMarkets(): string[] {
    return [
      ...this.SUPPORTED_MARKETS.VOLATILITY_INDICES.map(m => m.symbol),
      ...this.SUPPORTED_MARKETS.SYNTHETIC_INDICES.map(m => m.symbol),
      ...this.SUPPORTED_MARKETS.FOREX.map(m => m.symbol),
    ]
  },

  // Check if market is supported
  isMarketSupported(symbol: string): boolean {
    return this.getAllMarkets().includes(symbol)
  },

  // Check if timeframe is valid
  isValidTimeframe(timeframe: string): boolean {
    return this.VALID_TIMEFRAMES.includes(timeframe)
  },

  // Get market name
  getMarketName(symbol: string): string {
    for (const category of Object.values(this.SUPPORTED_MARKETS)) {
      const market = Array.isArray(category) 
        ? category.find(m => m.symbol === symbol)
        : null
      if (market) return market.name
    }
    return symbol
  },
}

export default DERIV_WORKFLOWS
