import { type NextRequest, NextResponse } from "next/server"
import { getPortfoliosByUserAddress } from "@/lib/db/portfolios"
import { calculateAggregateStats } from "@/lib/services/portfolio-calculator"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get("address")

    if (!address) {
      return NextResponse.json({ success: false, error: "Address required" }, { status: 400 })
    }

    console.log("[v0] Fetching portfolios for:", address)

    const userPortfolios = await getPortfoliosByUserAddress(address.toLowerCase())

    const { portfolios, stats } = await calculateAggregateStats(userPortfolios)

    console.log("[v0] Calculated stats:", stats)

    return NextResponse.json({
      success: true,
      portfolios,
      stats,
    })
  } catch (error) {
    console.error("[v0] Fetch portfolios error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch portfolios" }, { status: 500 })
  }
}
