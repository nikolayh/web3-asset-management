import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  getPortfolioById,
  updateAsset,
  updatePortfolioValue,
  createTransaction,
  updateTransactionStatus,
} from "@/lib/db/portfolios"
import { calculatePortfolioMetrics } from "@/lib/services/portfolio-calculator"

const withdrawSchema = z.object({
  amount: z.number().min(0),
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { amount, recipient } = withdrawSchema.parse(body)

    console.log("[v0] Withdrawing from portfolio:", id)
    console.log("[v0] Amount:", amount, "Recipient:", recipient)

    const portfolio = await getPortfolioById(id)

    const updatedPortfolio = await calculatePortfolioMetrics(portfolio)

    if (amount > updatedPortfolio.totalValue) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient balance. Available: ${updatedPortfolio.totalValue.toFixed(2)} USDC`,
        },
        { status: 400 },
      )
    }

    const transactionId = await createTransaction(id, portfolio.userAddress || "", "withdraw", amount, "pending")

    // In production, this would:
    // 1. Execute USDC transfer from smart account to recipient via CDP SDK
    // 2. Update portfolio balance in database
    // 3. Create transaction record

    const withdrawalRatio = amount / updatedPortfolio.totalValue

    const newAssets = updatedPortfolio.assets.map((asset) => ({
      ...asset,
      amount: asset.amount * (1 - withdrawalRatio),
      currentValue: asset.currentValue * (1 - withdrawalRatio),
    }))

    for (const asset of newAssets) {
      await updateAsset(id, asset.symbol, {
        amount: asset.amount,
        currentValue: asset.currentValue,
      })
    }

    updatedPortfolio.assets = newAssets
    updatedPortfolio.totalValue -= amount

    await updatePortfolioValue(
      id,
      updatedPortfolio.totalValue,
      updatedPortfolio.change24h || 0,
      updatedPortfolio.change24hPercentage || 0,
    )

    updatedPortfolio.updatedAt = new Date().toISOString()

    // Simulate withdrawal delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const withdrawTxHash = `0x${Math.random().toString(16).slice(2)}`

    await updateTransactionStatus(transactionId, "completed", withdrawTxHash)

    console.log("[v0] Withdrawal successful, remaining balance:", updatedPortfolio.totalValue)

    return NextResponse.json({
      success: true,
      message: "Withdrawal successful",
      txHash: withdrawTxHash,
      amount,
      recipient,
      portfolio: updatedPortfolio,
    })
  } catch (error) {
    console.error("[v0] Withdraw error:", error)
    return NextResponse.json({ success: false, error: "Withdrawal failed" }, { status: 500 })
  }
}
