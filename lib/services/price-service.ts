/**
 * Price Service - Handles real-time cryptocurrency price fetching
 * In production, integrate with CoinGecko, CoinMarketCap, or other price APIs
 */

export interface PriceData {
  priceUSD: number
  change24h: number
  lastUpdated: number
}

export interface PriceServiceConfig {
  apiKey?: string
  useCache?: boolean
  cacheDuration?: number
}

class PriceService {
  private cache: Map<string, { data: PriceData; timestamp: number }> = new Map()
  private config: PriceServiceConfig

  constructor(config: PriceServiceConfig = {}) {
    this.config = {
      useCache: true,
      cacheDuration: 60000, // 1 minute default
      ...config,
    }
  }

  /**
   * Fetch price data for a symbol
   * In production, this would call external APIs like:
   * - CoinGecko API
   * - CoinMarketCap API
   * - Binance API
   * - Or use Chainlink Price Feeds on-chain
   */
  async getPriceData(symbol: string): Promise<PriceData> {
    console.log("[v0] Fetching price for:", symbol)

    // Check cache first
    if (this.config.useCache) {
      const cached = this.cache.get(symbol)
      if (cached && Date.now() - cached.timestamp < (this.config.cacheDuration || 60000)) {
        console.log("[v0] Using cached price for:", symbol)
        return cached.data
      }
    }

    // In production, replace with actual API calls
    // Example: await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd&include_24hr_change=true`)

    const priceData = await this.fetchPriceFromSource(symbol)

    // Cache the result
    if (this.config.useCache) {
      this.cache.set(symbol, {
        data: priceData,
        timestamp: Date.now(),
      })
    }

    return priceData
  }

  /**
   * Fetch multiple prices in parallel
   */
  async getBatchPriceData(symbols: string[]): Promise<Map<string, PriceData>> {
    console.log("[v0] Fetching batch prices for:", symbols)

    const prices = await Promise.all(
      symbols.map(async (symbol) => ({
        symbol,
        data: await this.getPriceData(symbol),
      })),
    )

    return new Map(prices.map((p) => [p.symbol, p.data]))
  }

  /**
   * Internal method to fetch from price source
   * In production, implement actual API integration here
   */
  private async fetchPriceFromSource(symbol: string): Promise<PriceData> {
    // For development/demo: use dynamic mock data based on time to simulate price changes
    const baseTime = Date.now()
    const randomFactor = Math.sin(baseTime / 10000) * 0.05 // ±5% variation based on time

    const basePrices: Record<string, number> = {
      ETH: 1900,
      BTC: 38000,
      SOL: 100,
      UNI: 10,
      AAVE: 125,
      USDC: 1,
      USDT: 1,
      DAI: 1,
      MATIC: 0.8,
      LINK: 15,
      ARB: 1.2,
    }

    const basePrice = basePrices[symbol] || 1
    const priceUSD = basePrice * (1 + randomFactor)
    const change24h = Math.sin(baseTime / 20000 + symbol.length) * 10 // ±10% variation

    return {
      priceUSD,
      change24h,
      lastUpdated: Date.now(),
    }
  }

  /**
   * Clear cache - useful for testing or manual refresh
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    }
  }
}

// Export singleton instance
export const priceService = new PriceService({
  useCache: true,
  cacheDuration: Number.parseInt(process.env.PRICE_CACHE_DURATION || "60000"),
  apiKey: process.env.PRICE_API_KEY,
})

// Export class for testing or custom instances
export { PriceService }
