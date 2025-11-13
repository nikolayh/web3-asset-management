"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
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
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface WithdrawModalProps {
  open: boolean
  onClose: () => void
  portfolio: Portfolio
  onSuccess: () => void
}

export function WithdrawModal({ open, onClose, portfolio, onSuccess }: WithdrawModalProps) {
  const { address } = useAccount()
  const [amount, setAmount] = useState("")
  const [error, setError] = useState("")
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  // Calculate available USDC in portfolio
  const usdcAsset = portfolio.assets.find((a) => a.symbol === "USDC")
  const availableUSDC = usdcAsset?.amount || 0

  const handleWithdraw = async () => {
    if (!address || !amount) return

    const amountValue = Number.parseFloat(amount)
    if (isNaN(amountValue) || amountValue <= 0) {
      setError("Please enter a valid amount")
      return
    }

    if (amountValue > availableUSDC) {
      setError("Insufficient USDC balance in portfolio")
      return
    }

    setError("")
    setIsWithdrawing(true)

    try {
      // Call backend API to execute withdrawal from smart account
      const response = await fetch(`/api/portfolios/${portfolio.id}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountValue,
          recipient: address,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setIsComplete(true)
        setTimeout(() => {
          onSuccess()
          handleClose()
        }, 2000)
      } else {
        setError(data.error || "Withdrawal failed")
      }
    } catch (err: any) {
      console.error("[v0] Withdraw error:", err)
      setError(err.message || "Withdrawal failed")
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleClose = () => {
    setAmount("")
    setError("")
    setIsComplete(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw USDC</DialogTitle>
          <DialogDescription>Withdraw USDC from {portfolio.name} to your wallet</DialogDescription>
        </DialogHeader>

        {!isComplete ? (
          <div className="space-y-4 py-4">
            {/* Available Balance */}
            <div className="p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Available USDC</span>
                <span className="font-mono font-medium">{formatToken(availableUSDC)}</span>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Withdraw Amount</Label>
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
                    onClick={() => setAmount(availableUSDC.toString())}
                  >
                    MAX
                  </Button>
                  <span className="text-sm text-muted-foreground">USDC</span>
                </div>
              </div>
            </div>

            {/* Recipient */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipient</span>
                  <span className="font-mono text-xs">{address?.slice(0, 16)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Withdrawal Amount</span>
                  <span className="font-medium">{amount ? formatUSD(Number.parseFloat(amount)) : "$0.00"}</span>
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-8">
            <div className="text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-accent mx-auto" />
              <div>
                <p className="font-medium">Withdrawal Complete!</p>
                <p className="text-sm text-muted-foreground">
                  {formatUSD(Number.parseFloat(amount))} sent to your wallet
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {!isComplete && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleWithdraw} disabled={!amount || Number.parseFloat(amount) <= 0 || isWithdrawing}>
                {isWithdrawing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Withdrawing...
                  </>
                ) : (
                  "Withdraw USDC"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
