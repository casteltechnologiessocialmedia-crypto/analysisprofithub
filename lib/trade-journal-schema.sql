-- Trade Journal Database Schema
-- Comprehensive schema for storing trading data, performance analytics, and trade history

-- Users table (if not already exists)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE,
  deriv_user_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trading Accounts table
CREATE TABLE IF NOT EXISTS trading_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_name VARCHAR(255),
  account_type VARCHAR(50), -- 'real' or 'demo'
  currency VARCHAR(10),
  initial_balance DECIMAL(15, 2),
  current_balance DECIMAL(15, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, deriv_user_id),
  
  CHECK (current_balance >= 0)
);

-- Trading Sessions table
CREATE TABLE IF NOT EXISTS trading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  session_name VARCHAR(255),
  strategy VARCHAR(100), -- e.g., 'manual', 'autobot_even_odd', 'signals'
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,
  starting_balance DECIMAL(15, 2),
  ending_balance DECIMAL(15, 2),
  total_profit_loss DECIMAL(15, 2),
  total_profit_loss_percent DECIMAL(8, 2),
  total_trades INT DEFAULT 0,
  winning_trades INT DEFAULT 0,
  losing_trades INT DEFAULT 0,
  win_rate DECIMAL(8, 2),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  
  CHECK (winning_trades + losing_trades = total_trades OR total_trades = 0)
);

-- Individual Trades table (main)
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES trading_sessions(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  
  -- Trade identification
  contract_id BIGINT UNIQUE,
  trade_number INT,
  
  -- Market & Contract details
  symbol VARCHAR(50) NOT NULL, -- e.g., '1s', 'R_100'
  market_type VARCHAR(100), -- e.g., 'DIGITS', 'RISE_FALL', 'HIGHER_LOWER'
  contract_type VARCHAR(100) NOT NULL, -- e.g., 'DIGITOVER', 'CALL', 'CALLE'
  
  -- Entry details
  entry_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  entry_spot DECIMAL(12, 4),
  entry_price DECIMAL(15, 2),
  barrier VARCHAR(100), -- barrier level(s) for contract
  prediction VARCHAR(100), -- prediction made (for digit/match contracts)
  
  -- Exit details
  exit_time TIMESTAMP,
  exit_spot DECIMAL(12, 4),
  exit_price DECIMAL(15, 2),
  
  -- Trade parameters
  stake DECIMAL(15, 2) NOT NULL,
  payout DECIMAL(15, 2),
  profit_loss DECIMAL(15, 2),
  profit_loss_percent DECIMAL(8, 2),
  
  -- Trade status
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'closed', 'expired', 'cancelled'
  result VARCHAR(20), -- 'win', 'loss', 'neutral'
  is_win BOOLEAN,
  
  -- Risk management
  martingale_level INT DEFAULT 1,
  original_stake DECIMAL(15, 2), -- stake before martingale
  
  -- Duration & Expiry
  duration INT,
  duration_unit VARCHAR(10), -- 't', 's', 'm', 'h', 'd'
  expiry_time TIMESTAMP,
  
  -- Take Profit / Stop Loss
  take_profit_amount DECIMAL(15, 2),
  stop_loss_amount DECIMAL(15, 2),
  tp_triggered BOOLEAN DEFAULT false,
  sl_triggered BOOLEAN DEFAULT false,
  
  -- Notes & Tags
  notes TEXT,
  tags VARCHAR(255), -- comma-separated tags for filtering
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_duration CHECK (duration > 0),
  CONSTRAINT valid_stake CHECK (stake > 0),
  CONSTRAINT valid_payout CHECK (payout IS NULL OR payout >= 0)
);

-- Trade Performance Metrics table
CREATE TABLE IF NOT EXISTS trade_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  
  -- Time period
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  period_type VARCHAR(20), -- 'daily', 'weekly', 'monthly', 'all_time'
  
  -- Statistics
  total_trades INT,
  winning_trades INT,
  losing_trades INT,
  win_rate DECIMAL(8, 2),
  
  -- Financial metrics
  total_stake DECIMAL(15, 2),
  total_payout DECIMAL(15, 2),
  total_profit_loss DECIMAL(15, 2),
  average_profit_per_trade DECIMAL(15, 2),
  average_loss_per_trade DECIMAL(15, 2),
  
  -- Risk metrics
  max_loss_in_session DECIMAL(15, 2),
  max_consecutive_losses INT,
  max_consecutive_wins INT,
  
  -- Contract type breakdown
  contract_type_stats JSONB, -- { "DIGITOVER": { "count": 10, "wins": 7, "loss": 3 } }
  
  -- Symbol performance
  symbol_performance JSONB, -- { "1s": { "total": 100, "profit": 50 } }
  
  -- Calculated fields
  roi DECIMAL(8, 2),
  profit_factor DECIMAL(8, 2), -- total_profit / total_loss
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trading Strategies table
CREATE TABLE IF NOT EXISTS trading_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  strategy_type VARCHAR(100), -- 'manual', 'autobot', 'signals'
  
  -- Configuration
  config JSONB NOT NULL, -- stores all strategy parameters
  
  -- Performance tracking
  total_trades INT DEFAULT 0,
  winning_trades INT DEFAULT 0,
  total_profit_loss DECIMAL(15, 2) DEFAULT 0,
  win_rate DECIMAL(8, 2),
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Signal History table
CREATE TABLE IF NOT EXISTS signals_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  
  symbol VARCHAR(50) NOT NULL,
  signal_type VARCHAR(100), -- 'even_odd', 'over_under', 'differs', etc.
  signal_status VARCHAR(50), -- 'TRADE_NOW', 'WAIT', 'NEUTRAL'
  
  probability DECIMAL(8, 2),
  confidence DECIMAL(8, 2),
  recommendation TEXT,
  
  -- Trade taken based on signal
  trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
  trade_successful BOOLEAN,
  profit_loss DECIMAL(15, 2),
  
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Portfolio State Snapshots table (for performance tracking)
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  
  balance DECIMAL(15, 2),
  equity DECIMAL(15, 2),
  open_positions INT,
  used_margin DECIMAL(15, 2),
  available_margin DECIMAL(15, 2),
  margin_level DECIMAL(8, 2),
  
  unrealized_profit_loss DECIMAL(15, 2),
  realized_profit_loss DECIMAL(15, 2),
  
  captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Error Log table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  
  error_type VARCHAR(100),
  error_message TEXT,
  error_severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  
  context JSONB, -- additional context data
  stack_trace TEXT,
  
  is_resolved BOOLEAN DEFAULT false,
  resolution_notes TEXT,
  
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trades_account_id ON trades(account_id);
CREATE INDEX IF NOT EXISTS idx_trades_session_id ON trades(session_id);
CREATE INDEX IF NOT EXISTS idx_trades_entry_time ON trades(entry_time DESC);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_contract_type ON trades(contract_type);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);

CREATE INDEX IF NOT EXISTS idx_sessions_account_id ON trading_sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON trading_sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_strategy ON trading_sessions(strategy);

CREATE INDEX IF NOT EXISTS idx_metrics_account_id ON trade_metrics(account_id);
CREATE INDEX IF NOT EXISTS idx_metrics_period_type ON trade_metrics(period_type);

CREATE INDEX IF NOT EXISTS idx_signals_account_id ON signals_history(account_id);
CREATE INDEX IF NOT EXISTS idx_signals_symbol ON signals_history(symbol);
CREATE INDEX IF NOT EXISTS idx_signals_generated_at ON signals_history(generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_snapshots_account_id ON portfolio_snapshots(account_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_captured_at ON portfolio_snapshots(captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_errors_account_id ON error_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_errors_logged_at ON error_logs(logged_at DESC);

-- Views for common queries

-- Daily Performance Summary
CREATE OR REPLACE VIEW daily_performance AS
SELECT
  account_id,
  DATE(entry_time) as trade_date,
  COUNT(*) as total_trades,
  SUM(CASE WHEN is_win THEN 1 ELSE 0 END) as winning_trades,
  COUNT(*) - SUM(CASE WHEN is_win THEN 1 ELSE 0 END) as losing_trades,
  ROUND(SUM(CASE WHEN is_win THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100, 2) as win_rate,
  SUM(stake) as total_stake,
  SUM(profit_loss) as total_profit_loss,
  MIN(entry_spot) as day_low,
  MAX(entry_spot) as day_high
FROM trades
WHERE status = 'closed'
GROUP BY account_id, DATE(entry_time)
ORDER BY trade_date DESC;

-- Strategy Performance Summary
CREATE OR REPLACE VIEW strategy_performance AS
SELECT
  session_id,
  strategy,
  COUNT(*) as total_trades,
  SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as winning_trades,
  SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losing_trades,
  ROUND(SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100, 2) as win_rate,
  SUM(profit_loss) as total_profit_loss,
  AVG(profit_loss) as avg_profit_loss
FROM trades t
JOIN trading_sessions s ON t.session_id = s.id
WHERE t.status = 'closed'
GROUP BY session_id, strategy;

-- Contract Type Performance
CREATE OR REPLACE VIEW contract_type_performance AS
SELECT
  account_id,
  contract_type,
  COUNT(*) as total_trades,
  SUM(CASE WHEN is_win THEN 1 ELSE 0 END) as winning_trades,
  ROUND(SUM(CASE WHEN is_win THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100, 2) as win_rate,
  SUM(profit_loss) as total_profit_loss,
  AVG(stake) as avg_stake,
  AVG(profit_loss) as avg_profit_loss
FROM trades
WHERE status = 'closed'
GROUP BY account_id, contract_type
ORDER BY total_trades DESC;
