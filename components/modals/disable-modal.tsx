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
import { formatUSD } from "@/lib/utils/format"
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DisableModalProps {
  open: boolean
  onClose: () => void
  portfolio: Portfolio
  onSuccess: () => void
}

export function DisableModal({ open, onClose, portfolio, onSuccess }: DisableModalProps) {
  const [error, setError] = useState("")
  const [isDisabling, setIsDisabling] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const handleDisable = async () => {
    setError("")
    setIsDisabling(true)

    try {
      const response = await fetch(`/api/portfolios/${portfolio.id}/disable`, {
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
        setError(data.error || "Failed to disable portfolio")
      }
    } catch (err: any) {
      console.error("[v0] Disable error:", err)
      setError(err.message || "Failed to disable portfolio")
    } finally {
      setIsDisabling(false)
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
          <DialogTitle>Disable Portfolio</DialogTitle>
          <DialogDescription>This will sell all assets in {portfolio.name} and convert to USDC</DialogDescription>
        </DialogHeader>

        {!isComplete ? (
          <div className="space-y-4 py-4">
            {/* Warning */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">This action cannot be undone</p>
                <p className="text-sm">
                  All assets will be sold at market price and converted to USDC. You can withdraw the USDC after this
                  operation completes.
                </p>
              </AlertDescription>
            </Alert>

            {/* Assets to Sell */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Assets to be sold:</p>
              {portfolio.assets
                .filter((a) => a.symbol !== "USDC")
                .map((asset) => (
                  <div key={asset.symbol} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-destructive/10 rounded-full flex items-center justify-center">
                        <span className="font-bold text-destructive text-xs">{asset.symbol[0]}</span>
                      </div>
                      <span className="font-medium">{asset.symbol}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatUSD(asset.currentValue)}</p>
                      <p className="text-xs text-muted-foreground">
                        {asset.amount.toFixed(4)} {asset.symbol}
                      </p>
                    </div>
                  </div>
                ))}
            </div>

            {/* Expected USDC */}
            <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Expected USDC</span>
                <span className="text-xl font-bold text-accent">{formatUSD(portfolio.totalValue)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Actual amount may vary based on market conditions</p>
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
                <p className="font-medium">Portfolio Disabled!</p>
                <p className="text-sm text-muted-foreground">All assets converted to USDC</p>
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
              <Button variant="destructive" onClick={handleDisable} disabled={isDisabling}>
                {isDisabling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Disabling...
                  </>
                ) : (
                  "Disable Portfolio"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
