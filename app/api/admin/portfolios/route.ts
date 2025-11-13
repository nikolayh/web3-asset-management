import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createPortfolio } from "@/lib/db/portfolios"
import { getUserWallet, createUserWallet } from "@/lib/db/wallets"
import { generateMockAddress, validateAddress } from "@/lib/utils/address"

const assetSchema = z.object({
  symbol: z.string().min(1),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  weight: z.number().min(0).max(100),
})

const createPortfolioSchema = z.object({
  name: z.string().min(1),
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  assets: z.array(assetSchema).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createPortfolioSchema.parse(body)

    // Validate total weight equals 100%
    const totalWeight = data.assets.reduce((sum, a) => sum + a.weight, 0)
    if (Math.abs(totalWeight - 100) > 0.01) {
      return NextResponse.json({ success: false, error: "Total weight must equal 100%" }, { status: 400 })
    }

    const validatedUserAddress = validateAddress(data.userAddress)
    console.log("[v0] Creating portfolio for:", validatedUserAddress)

    let userWallet = await getUserWallet(validatedUserAddress)

    if (!userWallet) {
      console.log("[v0] User wallet not found, creating new wallet entry for:", validatedUserAddress)

      // Generate sub-wallet details for the user
      const subWalletAddress = generateMockAddress()
      const subWalletId = `sub-wallet-${Date.now()}-${Math.random().toString(36).substring(7)}`

      userWallet = await createUserWallet(validatedUserAddress, subWalletAddress, subWalletId)

      console.log("[v0] Created user wallet:", userWallet)
    } else {
      console.log("[v0] Using existing user wallet:", userWallet)
    }

    const smartAccountAddress = generateMockAddress()
    console.log("[v0] Generated smart account address:", smartAccountAddress)

    const assetsWithNames = data.assets.map((a) => ({
      symbol: a.symbol,
      name: a.symbol, // In production, fetch full name from token registry
      address: a.address,
      weight: a.weight,
    }))

    const portfolio = await createPortfolio(validatedUserAddress, data.name, smartAccountAddress, assetsWithNames)

    return NextResponse.json({
      success: true,
      portfolio,
    })
  } catch (error) {
    console.error("[v0] Create portfolio error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create portfolio"
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
