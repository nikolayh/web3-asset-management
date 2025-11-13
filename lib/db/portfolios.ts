import { createClient } from "@/lib/supabase/server"
import type { Portfolio, Asset, Transaction } from "@/lib/types"

export async function getPortfoliosByUserAddress(userAddress: string): Promise<Portfolio[]> {
  const supabase = await createClient()

  // Get portfolios with their assets
  const { data: portfolios, error: portfoliosError } = await supabase
    .from("portfolios")
    .select(`
      *,
      assets (*)
    `)
    .eq("user_address", userAddress)
    .order("created_at", { ascending: false })

  if (portfoliosError) {
    console.error("[v0] Error fetching portfolios:", portfoliosError)
    throw new Error("Failed to fetch portfolios")
  }

  return (portfolios || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    smartAccountAddress: p.smart_account_address,
    totalValue: Number.parseFloat(p.total_value || 0),
    isActive: p.is_active,
    userAddress: p.user_address,
    change24h: Number.parseFloat(p.change_24h || 0),
    change24hPercentage: Number.parseFloat(p.change_24h_percentage || 0),
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    assets: (p.assets || []).map((a: any) => ({
      symbol: a.symbol,
      name: a.name,
      address: a.address,
      weight: Number.parseFloat(a.weight),
      currentValue: Number.parseFloat(a.current_value || 0),
      amount: Number.parseFloat(a.amount || 0),
      priceUSD: Number.parseFloat(a.price_usd || 0),
      change24h: Number.parseFloat(a.change_24h || 0),
    })),
  }))
}

export async function createPortfolio(
  userAddress: string,
  name: string,
  smartAccountAddress: string,
  assets: Omit<Asset, "currentValue" | "amount" | "priceUSD" | "change24h">[],
): Promise<Portfolio> {
  const supabase = await createClient()

  // Validate weights sum to 100
  const totalWeight = assets.reduce((sum, a) => sum + a.weight, 0)
  if (Math.abs(totalWeight - 100) > 0.01) {
    throw new Error("Asset weights must sum to 100%")
  }

  // Insert portfolio
  const { data: portfolio, error: portfolioError } = await supabase
    .from("portfolios")
    .insert({
      name,
      smart_account_address: smartAccountAddress,
      user_address: userAddress,
      total_value: 0,
      is_active: true,
    })
    .select()
    .single()

  if (portfolioError) {
    console.error("[v0] Error creating portfolio:", portfolioError)
    throw new Error("Failed to create portfolio")
  }

  // Insert assets
  const assetsToInsert = assets.map((a) => ({
    portfolio_id: portfolio.id,
    symbol: a.symbol,
    name: a.name,
    address: a.address,
    weight: a.weight,
    current_value: 0,
    amount: 0,
    price_usd: 0,
  }))

  const { error: assetsError } = await supabase.from("assets").insert(assetsToInsert)

  if (assetsError) {
    console.error("[v0] Error creating assets:", assetsError)
    // Rollback portfolio creation
    await supabase.from("portfolios").delete().eq("id", portfolio.id)
    throw new Error("Failed to create portfolio assets")
  }

  // Return the created portfolio with assets
  return getPortfolioById(portfolio.id)
}

export async function getPortfolioById(portfolioId: string): Promise<Portfolio> {
  const supabase = await createClient()

  const { data: portfolio, error } = await supabase
    .from("portfolios")
    .select(`
      *,
      assets (*)
    `)
    .eq("id", portfolioId)
    .single()

  if (error) {
    console.error("[v0] Error fetching portfolio:", error)
    throw new Error("Portfolio not found")
  }

  return {
    id: portfolio.id,
    name: portfolio.name,
    smartAccountAddress: portfolio.smart_account_address,
    totalValue: Number.parseFloat(portfolio.total_value || 0),
    isActive: portfolio.is_active,
    userAddress: portfolio.user_address,
    change24h: Number.parseFloat(portfolio.change_24h || 0),
    change24hPercentage: Number.parseFloat(portfolio.change_24h_percentage || 0),
    createdAt: portfolio.created_at,
    updatedAt: portfolio.updated_at,
    assets: (portfolio.assets || []).map((a: any) => ({
      symbol: a.symbol,
      name: a.name,
      address: a.address,
      weight: Number.parseFloat(a.weight),
      currentValue: Number.parseFloat(a.current_value || 0),
      amount: Number.parseFloat(a.amount || 0),
      priceUSD: Number.parseFloat(a.price_usd || 0),
      change24h: Number.parseFloat(a.change_24h || 0),
    })),
  }
}

export async function updatePortfolioValue(
  portfolioId: string,
  totalValue: number,
  change24h: number,
  change24hPercentage: number,
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("portfolios")
    .update({
      total_value: totalValue,
      change_24h: change24h,
      change_24h_percentage: change24hPercentage,
    })
    .eq("id", portfolioId)

  if (error) {
    console.error("[v0] Error updating portfolio value:", error)
    throw new Error("Failed to update portfolio value")
  }
}

export async function updateAsset(
  portfolioId: string,
  symbol: string,
  updates: Partial<Pick<Asset, "currentValue" | "amount" | "priceUSD" | "change24h">>,
): Promise<void> {
  const supabase = await createClient()

  const updateData: any = {}
  if (updates.currentValue !== undefined) updateData.current_value = updates.currentValue
  if (updates.amount !== undefined) updateData.amount = updates.amount
  if (updates.priceUSD !== undefined) updateData.price_usd = updates.priceUSD
  if (updates.change24h !== undefined) updateData.change_24h = updates.change24h

  const { error } = await supabase
    .from("assets")
    .update(updateData)
    .eq("portfolio_id", portfolioId)
    .eq("symbol", symbol)

  if (error) {
    console.error("[v0] Error updating asset:", error)
    throw new Error("Failed to update asset")
  }
}

export async function disablePortfolio(portfolioId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from("portfolios").update({ is_active: false }).eq("id", portfolioId)

  if (error) {
    console.error("[v0] Error disabling portfolio:", error)
    throw new Error("Failed to disable portfolio")
  }
}

export async function createTransaction(
  portfolioId: string,
  userAddress: string,
  type: Transaction["type"],
  amount: number,
  status: Transaction["status"] = "pending",
  txHash?: string,
): Promise<string> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      portfolio_id: portfolioId,
      user_address: userAddress,
      type,
      amount,
      status,
      tx_hash: txHash,
    })
    .select("id")
    .single()

  if (error) {
    console.error("[v0] Error creating transaction:", error)
    throw new Error("Failed to create transaction")
  }

  return data.id
}

export async function updateTransactionStatus(
  transactionId: string,
  status: Transaction["status"],
  txHash?: string,
  errorMessage?: string,
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("transactions")
    .update({
      status,
      tx_hash: txHash,
      error_message: errorMessage,
    })
    .eq("id", transactionId)

  if (error) {
    console.error("[v0] Error updating transaction:", error)
    throw new Error("Failed to update transaction")
  }
}
