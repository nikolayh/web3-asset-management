"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Portfolio } from "@/lib/types"
import { formatPercentage, formatUSD } from "@/lib/utils/format"
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface RebalanceModalProps {
  open: boolean
  onClose: () => void
  portfolio: Portfolio
  onSuccess: () => void
}

export function RebalanceModal({ open, onClose, portfolio, onSuccess }: RebalanceModalProps) {
  const [error, setError] = useState("")
  const [isRebalancing, setIsRebalancing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const handleRebalance = async () => {
    setError("")
    setIsRebalancing(true)

    try {
      const response = await fetch(`/api/portfolios/${portfolio.id}/rebalance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (data.success) {
        setIsComplete(true)
        setTimeout(() => {
          onSuccess()
          handleClose()
        }, 2000)
      } else {
        setError(data.error || "Rebalancing failed")
      }
    } catch (err: any) {
      console.error("[v0] Rebalance error:", err)
      setError(err.message || "Rebalancing failed")
    } finally {
      setIsRebalancing(false)
    }
  }

  const handleClose = () => {
    setError("")
    setIsComplete(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manual Rebalance</DialogTitle>
          <DialogDescription>Rebalance {portfolio.name} to match target allocation weights</DialogDescription>
        </DialogHeader>

        {!isComplete ? (
          <div className="space-y-4 py-4">
            {/* Current Allocation */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Target Allocation</p>
              {portfolio.assets.map((asset) => (
                <div key={asset.symbol} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="font-bold text-primary text-xs">{asset.symbol[0]}</span>
                    </div>
                    <span className="font-medium">{asset.symbol}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium">{formatPercentage(asset.weight)}</p>
                    <p className="text-xs text-muted-foreground">{formatUSD(asset.currentValue)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Info */}
            <Alert>
              <RefreshCw className="h-4 w-4" />
              <AlertDescription>
                This will execute trades to rebalance your portfolio to match the target allocation. Transaction fees
                will apply.
              </AlertDescription>
            </Alert>

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
                <p className="font-medium">Rebalance Complete!</p>
                <p className="text-sm text-muted-foreground">Portfolio rebalanced to target allocation</p>
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
              <Button onClick={handleRebalance} disabled={isRebalancing}>
                {isRebalancing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rebalancing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Start Rebalance
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
