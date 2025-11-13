import { type NextRequest, NextResponse } from "next/server"
import {
  getPortfolioById,
  disablePortfolio,
  updateAsset,
  createTransaction,
  updateTransactionStatus,
} from "@/lib/db/portfolios"
import { calculatePortfolioMetrics } from "@/lib/services/portfolio-calculator"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    console.log("[v0] Disabling portfolio:", id)

    const portfolio = await getPortfolioById(id)

    const updatedPortfolio = await calculatePortfolioMetrics(portfolio)
    const finalValue = updatedPortfolio.totalValue

    const transactionId = await createTransaction(id, portfolio.userAddress || "", "disable", finalValue, "pending")

    // In production, this would:
    // 1. Execute sell orders for all non-USDC assets via CDP SDK
    // 2. Convert proceeds to USDC
    // 3. Mark portfolio as inactive in database
    // 4. Update smart account balance

    const trades = updatedPortfolio.assets
      .filter((asset) => asset.amount > 0)
      .map((asset) => ({
        asset: asset.symbol,
        action: "sell" as const,
        amount: asset.amount,
        usdValue: asset.currentValue,
      }))

    for (const asset of updatedPortfolio.assets) {
      await updateAsset(id, asset.symbol, {
        amount: 0,
        currentValue: 0,
      })
    }

    await disablePortfolio(id)

    updatedPortfolio.isActive = false
    updatedPortfolio.assets = updatedPortfolio.assets.map((asset) => ({
      ...asset,
      amount: 0,
      currentValue: 0,
    }))
    updatedPortfolio.totalValue = 0
    updatedPortfolio.change24h = 0
    updatedPortfolio.change24hPercentage = 0
    updatedPortfolio.updatedAt = new Date().toISOString()

    // Simulate disable process delay
    await new Promise((resolve) => setTimeout(resolve, 2500))

    const batchTxHash = `0x${Math.random().toString(16).slice(2)}`

    await updateTransactionStatus(transactionId, "completed", batchTxHash)

    console.log("[v0] Portfolio disabled, converted to", finalValue, "USDC")

    return NextResponse.json({
      success: true,
      message: "Portfolio disabled successfully",
      batchTxHash,
      usdcBalance: finalValue,
      trades,
      portfolio: updatedPortfolio,
    })
  } catch (error) {
    console.error("[v0] Disable portfolio error:", error)
    return NextResponse.json({ success: false, error: "Failed to disable portfolio" }, { status: 500 })
  }
}
