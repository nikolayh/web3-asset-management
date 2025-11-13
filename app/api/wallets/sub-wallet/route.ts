import { type NextRequest, NextResponse } from "next/server"
import { getUserWallet, createUserWallet, updateWalletLastUsed } from "@/lib/db/wallets"
import { generateMockAddress } from "@/lib/utils/address"
import { z } from "zod"
import { isAddress } from "viem"

const schema = z.object({
  address: z.string().refine((addr) => isAddress(addr), {
    message: "Invalid Ethereum address",
  }),
})

/**
 * GET /api/wallets/sub-wallet?address=0x...
 * Retrieve or create user's sub-wallet address
 *
 * This endpoint manages the secure linkage between:
 * - User's web3 wallet (their login address)
 * - Coinbase-managed sub-wallet (where funds are deposited)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get("address")

    console.log("[v0] Sub-wallet request for:", address)

    if (!address) {
      return NextResponse.json({ success: false, error: "Address parameter required" }, { status: 400 })
    }

    // Validate address format
    const validation = schema.safeParse({ address })
    if (!validation.success) {
      return NextResponse.json({ success: false, error: "Invalid address format" }, { status: 400 })
    }

    const validatedAddress = validation.data.address as `0x${string}`

    let walletInfo = await getUserWallet(validatedAddress)

    if (!walletInfo) {
      console.log("[v0] Creating new sub-wallet in database for:", validatedAddress)
      const subWalletAddress = generateMockAddress()
      const subWalletId = `wallet_${Date.now()}`

      walletInfo = await createUserWallet(validatedAddress, subWalletAddress, subWalletId)
    } else {
      // Update last used timestamp
      await updateWalletLastUsed(validatedAddress)
    }

    const responseTime = Date.now() - startTime
    console.log(`[v0] Sub-wallet retrieved in ${responseTime}ms`)

    return NextResponse.json({
      success: true,
      data: {
        userAddress: walletInfo.userAddress,
        subWalletAddress: walletInfo.subWalletAddress,
        subWalletId: walletInfo.subWalletId,
        createdAt: walletInfo.createdAt,
      },
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error(`[v0] Sub-wallet error (${responseTime}ms):`, error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to retrieve sub-wallet",
      },
      { status: 500 },
    )
  }
}
