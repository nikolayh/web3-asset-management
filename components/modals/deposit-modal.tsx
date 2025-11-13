"use client"

import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance } from "wagmi"
import { parseUnits } from "viem"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Portfolio } from "@/lib/types"
import { formatUSD, formatToken } from "@/lib/utils/format"
import { getUSDCAddress } from "@/lib/contract-addresses"
import { validateAddress } from "@/lib/utils/address"
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DepositModalProps {
  open: boolean
  onClose: () => void
  portfolio: Portfolio
  onSuccess: () => void
}

const ERC20_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

export function DepositModal({ open, onClose, portfolio, onSuccess }: DepositModalProps) {
  const { address, chainId } = useAccount()
  const [amount, setAmount] = useState("")
  const [error, setError] = useState("")
  const [isRebalancing, setIsRebalancing] = useState(false)
  const [subWalletAddress, setSubWalletAddress] = useState<string>("")

  const usdcAddress = getUSDCAddress(chainId || 8453)

  const { data: usdcBalance } = useBalance({
    address: address,
    token: usdcAddress as `0x${string}`,
  })

  useEffect(() => {
    if (open && address) {
      fetchSubWallet()
    }
  }, [open, address])

  const fetchSubWallet = async () => {
    if (!address) return

    try {
      console.log("[v0] Fetching sub-wallet for:", address)
      const response = await fetch(`/api/wallets/sub-wallet?address=${address}`)
      const data = await response.json()

      console.log("[v0] Sub-wallet API response:", data)

      if (data.success && data.data?.subWalletAddress) {
        setSubWalletAddress(data.data.subWalletAddress)
        console.log("[v0] User sub-wallet set:", data.data.subWalletAddress)
      } else {
        console.error("[v0] Sub-wallet error:", data.error)
        setError(data.error || "Sub-wallet not found. Please try logging in again.")
      }
    } catch (err) {
      console.error("[v0] Fetch sub-wallet error:", err)
      setError("Failed to load wallet information")
    }
  }

  const { writeContract, data: hash, isPending: isTransferring, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const handleDeposit = async () => {
    if (!address || !amount || !subWalletAddress) return

    const amountValue = Number.parseFloat(amount)
    if (isNaN(amountValue) || amountValue <= 0) {
      setError("Please enter a valid amount")
      return
    }

    const balance = usdcBalance ? Number.parseFloat(usdcBalance.formatted) : 0
    if (amountValue > balance) {
      setError("Insufficient USDC balance")
      return
    }

    setError("")

    try {
      const validatedSubWallet = validateAddress(subWalletAddress)
      console.log("[v0] Depositing to user sub-wallet:", validatedSubWallet)

      writeContract({
        address: usdcAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [
          validatedSubWallet,
          parseUnits(amount, 6), // USDC has 6 decimals
        ],
      })
    } catch (err: any) {
      console.error("[v0] Transfer error:", err)
      setError(err.message || "Transfer failed")
    }
  }

  const handleRebalance = async () => {
    setIsRebalancing(true)

    try {
      const response = await fetch(`/api/portfolios/${portfolio.id}/rebalance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: hash }),
      })

      const data = await response.json()

      if (data.success) {
        onSuccess()
        handleClose()
      } else {
        setError("Rebalancing failed")
      }
    } catch (err) {
      console.error("[v0] Rebalance error:", err)
      setError("Rebalancing failed")
    } finally {
      setIsRebalancing(false)
    }
  }

  const handleClose = () => {
    setAmount("")
    setError("")
    reset()
    onClose()
  }

  const currentBalance = usdcBalance ? Number.parseFloat(usdcBalance.formatted) : 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit USDC</DialogTitle>
          <DialogDescription>
            Deposit USDC to your secure sub-wallet. Portfolio will automatically rebalance after deposit.
          </DialogDescription>
        </DialogHeader>

        {!isConfirmed ? (
          <div className="space-y-4 py-4">
            {subWalletAddress && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-xs text-muted-foreground mb-1">Your Sub-Wallet</div>
                <div className="font-mono text-xs">
                  {subWalletAddress.slice(0, 6)}...{subWalletAddress.slice(-4)}
                </div>
              </div>
            )}

            <div className="p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Available USDC</span>
                <span className="font-mono font-medium">{formatToken(currentBalance)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Deposit Amount</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-16"
                  min="0"
                  step="0.01"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setAmount(currentBalance.toString())}
                  >
                    MAX
                  </Button>
                  <span className="text-sm text-muted-foreground">USDC</span>
                </div>
              </div>
            </div>

            {amount && Number.parseFloat(amount) > 0 && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Portfolio Value</span>
                    <span className="font-medium">{formatUSD(portfolio.totalValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deposit Amount</span>
                    <span className="font-medium">{formatUSD(Number.parseFloat(amount))}</span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between">
                    <span className="font-medium">New Portfolio Value</span>
                    <span className="font-bold text-primary">
                      {formatUSD(portfolio.totalValue + Number.parseFloat(amount))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-8">
            {isRebalancing ? (
              <div className="text-center space-y-3">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <div>
                  <p className="font-medium">Rebalancing Portfolio</p>
                  <p className="text-sm text-muted-foreground">Executing trades to match target allocation...</p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-accent mx-auto" />
                <div>
                  <p className="font-medium">Deposit Confirmed!</p>
                  <p className="text-sm text-muted-foreground">
                    {formatUSD(Number.parseFloat(amount))} deposited successfully
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!isConfirmed ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleDeposit}
                disabled={!amount || Number.parseFloat(amount) <= 0 || isTransferring || isConfirming}
              >
                {isTransferring || isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isTransferring ? "Transferring..." : "Confirming..."}
                  </>
                ) : (
                  "Deposit USDC"
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleRebalance} disabled={isRebalancing} className="w-full">
              {isRebalancing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rebalancing...
                </>
              ) : (
                <>
                  Start Rebalance
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
