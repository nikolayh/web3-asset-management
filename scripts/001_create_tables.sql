-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Wallets Table
-- Links Web3 wallet addresses to server-managed sub-wallets
CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL UNIQUE,
  sub_wallet_address TEXT NOT NULL UNIQUE,
  sub_wallet_id TEXT NOT NULL,
  encrypted_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Portfolios Table
-- Stores portfolio configurations created by admins
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  smart_account_address TEXT NOT NULL,
  total_value NUMERIC(20, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  user_address TEXT NOT NULL,
  change_24h NUMERIC(20, 2) DEFAULT 0,
  change_24h_percentage NUMERIC(10, 4) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user_wallet FOREIGN KEY (user_address) REFERENCES user_wallets(user_address) ON DELETE CASCADE
);

-- Assets Table
-- Individual assets within portfolios
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  weight NUMERIC(5, 2) NOT NULL CHECK (weight > 0 AND weight <= 100),
  current_value NUMERIC(20, 2) NOT NULL DEFAULT 0,
  amount NUMERIC(30, 18) NOT NULL DEFAULT 0,
  price_usd NUMERIC(20, 8) NOT NULL DEFAULT 0,
  change_24h NUMERIC(20, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
);

-- Transactions Table
-- Audit trail for all portfolio operations
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL,
  user_address TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'rebalance', 'disable')),
  amount NUMERIC(20, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  tx_hash TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_portfolio_tx FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_wallet_tx FOREIGN KEY (user_address) REFERENCES user_wallets(user_address) ON DELETE CASCADE
);

-- Price History Table (optional, for tracking price changes)
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT NOT NULL,
  price_usd NUMERIC(20, 8) NOT NULL,
  change_24h NUMERIC(20, 2),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_address ON portfolios(user_address);
CREATE INDEX IF NOT EXISTS idx_portfolios_active ON portfolios(is_active);
CREATE INDEX IF NOT EXISTS idx_assets_portfolio_id ON assets(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_id ON transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_address ON transactions(user_address);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_price_history_symbol ON price_history(symbol, recorded_at DESC);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
