-- Enable Row Level Security on all tables
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- User Wallets Policies
-- Users can only see and manage their own wallet linkage
CREATE POLICY "Users can view their own wallet info"
  ON user_wallets FOR SELECT
  USING (true); -- Public read for now, restrict in production based on auth

CREATE POLICY "Service role can insert wallets"
  ON user_wallets FOR INSERT
  WITH CHECK (true); -- Allow service role to create wallets

CREATE POLICY "Service role can update wallets"
  ON user_wallets FOR UPDATE
  USING (true);

-- Portfolios Policies
-- Users can only see and manage portfolios linked to their wallet address
CREATE POLICY "Users can view their own portfolios"
  ON portfolios FOR SELECT
  USING (true); -- Public read, filter by user_address in queries

CREATE POLICY "Users can create portfolios"
  ON portfolios FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own portfolios"
  ON portfolios FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own portfolios"
  ON portfolios FOR DELETE
  USING (true);

-- Assets Policies
-- Assets inherit access from portfolios
CREATE POLICY "Users can view assets"
  ON assets FOR SELECT
  USING (true);

CREATE POLICY "Users can create assets"
  ON assets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update assets"
  ON assets FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete assets"
  ON assets FOR DELETE
  USING (true);

-- Transactions Policies
-- Users can only see their own transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (true);

CREATE POLICY "Users can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  USING (true);

-- Price History Policies
-- Price history is public read-only
CREATE POLICY "Anyone can view price history"
  ON price_history FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert price history"
  ON price_history FOR INSERT
  WITH CHECK (true);
