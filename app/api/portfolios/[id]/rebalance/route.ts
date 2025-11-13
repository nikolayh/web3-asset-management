import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getPortfolioById, updateAsset, createTransaction, updateTransactionStatus } from "@/lib/db/portfolios"
import { calculatePortfolioMetrics } from "@/lib/services/portfolio-calculator"

const rebalanceSchema = z.object({
  txHash: z.string().optional(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { txHash } = rebalanceSchema.parse(body)

    console.log("[v0] Starting rebalance for portfolio:", id)
    console.log("[v0] Deposit transaction:", txHash)

    const portfolio = await getPortfolioById(id)

    const updatedPortfolio = await calculatePortfolioMetrics(portfolio)

    const transactionId = await createTransaction(
      id,
      portfolio.userAddress || "",
      "rebalance",
      updatedPortfolio.totalValue,
      "pending",
      txHash,
    )

    // In production, this would:
    // 1. Verify the deposit transaction on-chain
    // 2. Calculate new asset amounts based on portfolio weights
    // 3. Execute trades via Coinbase CDP SDK using ERC-4337 batched userOperations
    // 4. Update portfolio state in database

    const totalValue = updatedPortfolio.totalValue

    const rebalancedAssets = updatedPortfolio.assets.map((asset) => ({
      ...asset,
      currentValue: totalValue * (asset.weight / 100),
      amount: asset.priceUSD > 0 ? (totalValue * (asset.weight / 100)) / asset.priceUSD : 0,
    }))

    for (const asset of rebalancedAssets) {
      await updateAsset(id, asset.symbol, {
        currentValue: asset.currentValue,
        amount: asset.amount,
      })
    }

    updatedPortfolio.assets = rebalancedAssets
    updatedPortfolio.updatedAt = new Date().toISOString()

    // Simulate rebalancing delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const batchTxHash = `0x${Math.random().toString(16).slice(2)}`

    await updateTransactionStatus(transactionId, "completed", batchTxHash)

    const trades = rebalancedAssets
      .filter((asset) => asset.currentValue > 0)
      .map((asset) => ({
        asset: asset.symbol,
        action: "buy" as const,
        amount: asset.amount,
        usdValue: asset.currentValue,
      }))

    console.log("[v0] Portfolio rebalanced successfully with", trades.length, "trades")

    return NextResponse.json({
      success: true,
      message: "Portfolio rebalanced successfully",
      batchTxHash,
      trades,
      portfolio: updatedPortfolio,
    })
  } catch (error) {
    console.error("[v0] Rebalance error:", error)
    return NextResponse.json({ success: false, error: "Rebalancing failed" }, { status: 500 })
  }
}
