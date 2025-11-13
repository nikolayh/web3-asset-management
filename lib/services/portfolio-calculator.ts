/**
 * Portfolio Calculator - Handles all portfolio value calculations dynamically
 */

import { priceService } from "./price-service"
import type { Portfolio, Asset } from "../types"

export interface PortfolioMetrics {
  totalValue: number
  change24h: number
  change24hPercentage: number
  assets: Asset[]
}

/**
 * Calculate real-time portfolio metrics based on current prices
 */
export async function calculatePortfolioMetrics(portfolio: Portfolio): Promise<Portfolio> {
  console.log("[v0] Calculating metrics for portfolio:", portfolio.id)

  let totalValue = 0
  let totalChange24h = 0

  // Fetch all prices in parallel for better performance
  const symbols = portfolio.assets.map((a) => a.symbol)
  const priceMap = await priceService.getBatchPriceData(symbols)

  const updatedAssets = portfolio.assets.map((asset) => {
    const priceData = priceMap.get(asset.symbol)

    if (!priceData) {
      console.warn("[v0] No price data for:", asset.symbol)
      return {
        ...asset,
        currentValue: 0,
        priceUSD: 0,
        change24h: 0,
      }
    }

    const currentValue = asset.amount * priceData.priceUSD
    const change24hValue = currentValue * (priceData.change24h / 100)

    totalValue += currentValue
    totalChange24h += change24hValue

    return {
      ...asset,
      currentValue,
      priceUSD: priceData.priceUSD,
      change24h: priceData.change24h,
    }
  })

  const change24hPercentage = totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0

  return {
    ...portfolio,
    totalValue,
    change24h: totalChange24h,
    change24hPercentage,
    assets: updatedAssets,
  }
}

/**
 * Calculate aggregated stats across multiple portfolios
 */
export async function calculateAggregateStats(portfolios: Portfolio[]) {
  console.log("[v0] Calculating aggregate stats for", portfolios.length, "portfolios")

  const portfoliosWithMetrics = await Promise.all(portfolios.map((p) => calculatePortfolioMetrics(p)))

  const totalValue = portfoliosWithMetrics.reduce((sum, p) => sum + p.totalValue, 0)
  const totalChange24h = portfoliosWithMetrics.reduce((sum, p) => sum + (p.change24h || 0), 0)
  const totalChange24hPercentage = totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0

  return {
    portfolios: portfoliosWithMetrics,
    stats: {
      totalValue,
      change24h: totalChange24h,
      change24hPercentage: totalChange24hPercentage,
      activePortfolios: portfoliosWithMetrics.filter((p) => p.isActive).length,
      totalPortfolios: portfoliosWithMetrics.length,
    },
  }
}

/**
 * Calculate target allocation amounts based on total value and weights
 */
export function calculateTargetAllocation(totalValue: number, assets: Asset[]): Asset[] {
  return assets.map((asset) => ({
    ...asset,
    currentValue: totalValue * (asset.weight / 100),
    amount: asset.priceUSD > 0 ? (totalValue * (asset.weight / 100)) / asset.priceUSD : 0,
  }))
}
