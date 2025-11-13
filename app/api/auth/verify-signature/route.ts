import { type NextRequest, NextResponse } from "next/server"
import { verifyTypedData } from "viem"
import { z } from "zod"
import { getOrCreateUserSubWallet } from "@/lib/services/coinbase-wallet-service"

const schema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  signature: z.string(),
  timestamp: z.number().int().positive(),
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    console.log("[v0] Signature verification request:", {
      address: body.address,
      timestamp: body.timestamp,
      hasSignature: !!body.signature,
    })

    const { address, signature, timestamp } = schema.parse(body)

    const now = Math.floor(Date.now() / 1000)
    const timeDiff = now - timestamp

    if (timeDiff > 300) {
      console.error("[v0] Signature expired:", { timeDiff, timestamp, now })
      return NextResponse.json({ success: false, error: "Signature expired. Please try again." }, { status: 401 })
    }

    if (timeDiff < -60) {
      console.error("[v0] Signature timestamp in future:", { timeDiff, timestamp, now })
      return NextResponse.json(
        { success: false, error: "Invalid timestamp. Please check your system clock." },
        { status: 401 },
      )
    }

    const domain = {
      name: "Vaultify",
      version: "1",
      chainId: 8453,
    }

    const types = {
      Terms: [
        { name: "user", type: "address" },
        { name: "agreement", type: "string" },
        { name: "timestamp", type: "uint256" },
      ],
    }

    const message = {
      user: address,
      agreement: "I accept the Terms & Conditions and understand the risks of Web3 investment",
      timestamp: BigInt(timestamp),
    }

    console.log("[v0] Verifying signature with message:", message)

    // Verify signature with the exact message that was signed
    const valid = await verifyTypedData({
      address: address as `0x${string}`,
      domain,
      types,
      primaryType: "Terms",
      message,
      signature: signature as `0x${string}`,
    })

    const elapsed = Date.now() - startTime

    if (!valid) {
      console.error("[v0] Signature verification failed:", {
        address,
        timestamp,
        elapsed: `${elapsed}ms`,
      })
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 })
    }

    console.log("[v0] Signature verified successfully:", {
      address,
      elapsed: `${elapsed}ms`,
    })

    try {
      const subWallet = await getOrCreateUserSubWallet(address as `0x${string}`)
      console.log("[v0] Sub-wallet ready:", {
        user: address,
        subWallet: subWallet.subWalletAddress,
      })
    } catch (error) {
      console.error("[v0] Sub-wallet creation error:", error)
      // Don't fail authentication if sub-wallet creation fails
      // It can be retried later
    }

    // Generate session token (in production, use JWT with proper signing)
    const sessionToken = Buffer.from(`${address}:${Date.now()}`).toString("base64")

    return NextResponse.json({
      success: true,
      token: sessionToken,
    })
  } catch (error) {
    const elapsed = Date.now() - startTime
    console.error("[v0] Signature verification error:", error, `(${elapsed}ms)`)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid request format" }, { status: 400 })
    }

    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 })
  }
}
