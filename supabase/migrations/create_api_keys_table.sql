-- Create api_keys table for storing API key metadata
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  app_name VARCHAR(255) NOT NULL,
  scope TEXT[] DEFAULT ARRAY['users:read', 'trades:read', 'market:read', 'analytics:read'],
  rate_limit INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  is_test BOOLEAN DEFAULT false,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_by VARCHAR(255),
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster key lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_at ON api_keys(created_at);

-- Create api_key_logs table for tracking API usage
CREATE TABLE IF NOT EXISTS api_key_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status INTEGER,
  response_time_ms INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address VARCHAR(45)
);

-- Create index for faster log queries
CREATE INDEX IF NOT EXISTS idx_api_key_logs_key_id ON api_key_logs(key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_logs_timestamp ON api_key_logs(timestamp);

-- Create audit_logs table for tracking key operations
CREATE TABLE IF NOT EXISTS api_key_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'revoked', 'rotated'
  changes JSONB,
  performed_by VARCHAR(255),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for audit logs
CREATE INDEX IF NOT EXISTS idx_api_key_audit_logs_key_id ON api_key_audit_logs(key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_audit_logs_action ON api_key_audit_logs(action);

-- Grant appropriate permissions (adjust as needed for your setup)
-- GRANT SELECT ON api_keys TO anon;
-- GRANT SELECT ON api_keys TO authenticated;
