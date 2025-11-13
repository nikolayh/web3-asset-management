export interface Portfolio {
  id: string
  name: string
  smartAccountAddress: string
  totalValue: number
  assets: Asset[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  userAddress?: string
  change24h?: number
  change24hPercentage?: number
}

export interface Asset {
  symbol: string
  name: string
  address: string
  weight: number
  currentValue: number
  amount: number
  priceUSD: number
  change24h?: number
}

export interface Transaction {
  id: string
  type: "deposit" | "withdraw" | "rebalance" | "disable"
  amount: number
  status: "pending" | "completed" | "failed"
  txHash?: string
  timestamp: string
}

export interface UserSession {
  address: string
  signedTerms: boolean
  sessionToken: string
}

// Added error types for better Web3 error handling
export interface WalletError extends Error {
  code?: number
  data?: any
}

export interface SignatureError extends WalletError {
  shortMessage?: string
}

export interface UserWalletInfo {
  userAddress: string
  subWalletAddress: string
  subWalletId: string
  createdAt: string
  lastUsed: string
}
