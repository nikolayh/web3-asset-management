"use client"

import { useState } from "react"
import { useAccount, useSignTypedData } from "wagmi"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Shield, AlertCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface TermsDialogProps {
  open: boolean
  onAccept: (signature: string, timestamp: number) => void
  onDecline: () => void
}

export function TermsDialog({ open, onAccept, onDecline }: TermsDialogProps) {
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const { address, isConnected } = useAccount()

  const { signTypedDataAsync, isPending, isError } = useSignTypedData({
    mutation: {
      onError: (error) => {
        console.error("[v0] Sign typed data error:", error)

        // Handle specific error types
        if (
          error.message.includes("Connection interrupted") ||
          error.message.includes("User rejected") ||
          error.message.includes("not been authorized")
        ) {
          setError(
            error.message.includes("User rejected")
              ? "You declined the signature request. Please try again to accept the terms."
              : "Connection to your wallet was interrupted. Please ensure your wallet is open and try again.",
          )
        } else {
          setError("Failed to sign the terms. Please check your wallet connection and try again.")
        }
      },
    },
  })

  const handleSign = async () => {
    if (!address || !accepted) return

    if (!isConnected) {
      setError("Wallet disconnected. Please reconnect your wallet and try again.")
      return
    }

    // Clear previous errors
    setError(null)

    try {
      console.log("[v0] Starting signature request for address:", address)

      const timestamp = Math.floor(Date.now() / 1000)

      const domain = {
        name: "Vaultify",
        version: "1",
        chainId: 8453, // Base mainnet
      }

      const types = {
        Terms: [
          { name: "user", type: "address" },
          { name: "agreement", type: "string" },
          { name: "timestamp", type: "uint256" },
        ],
      }

      const value = {
        user: address,
        agreement: "I accept the Terms & Conditions and understand the risks of Web3 investment",
        timestamp: BigInt(timestamp),
      }

      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: "Terms",
        message: value,
      })

      console.log("[v0] Signature received successfully, timestamp:", timestamp)
      setRetryCount(0) // Reset retry count on success
      onAccept(signature, timestamp)
    } catch (err: any) {
      console.error("[v0] Failed to sign terms:", err)

      if (err?.message?.includes("User rejected") || err?.code === 4001) {
        setError("You declined the signature request. Click 'Try Again' to proceed.")
      } else if (err?.message?.includes("Connection interrupted") || err?.message?.includes("WalletConnect")) {
        setError("Wallet connection was interrupted. Please check your wallet and try again.")
      } else if (!isConnected) {
        setError("Wallet disconnected during signing. Please reconnect and try again.")
      } else {
        setError("Unable to complete signature. Please try again or reconnect your wallet.")
      }

      setRetryCount((prev) => prev + 1)
    }
  }

  const handleRetry = () => {
    setError(null)
    handleSign()
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onDecline()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl">Terms & Conditions</DialogTitle>
          </div>
          <DialogDescription>Please review and accept the terms to access the platform</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Signature Failed</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              {retryCount > 0 && retryCount < 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isPending}
                  className="ml-2 bg-transparent"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Try Again
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <ScrollArea className="h-[400px] rounded-md border border-border p-6 bg-muted/30">
          <div className="space-y-4 text-sm text-foreground leading-relaxed">
            <h3 className="font-semibold text-base">Investment Platform Agreement</h3>

            <p>
              By signing this agreement, you acknowledge and accept the following terms and conditions for using the
              Vaultify Web3 Investment Platform:
            </p>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-1">1. Risk Acknowledgment</h4>
                <p className="text-muted-foreground">
                  Cryptocurrency investments involve substantial risk. You may lose some or all of your invested
                  capital. Past performance does not guarantee future results.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1">2. Smart Account Usage</h4>
                <p className="text-muted-foreground">
                  Your funds are managed through Coinbase Server Wallets using ERC-4337 smart accounts. You maintain
                  control over deposits and withdrawals, while the platform executes rebalancing operations.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1">3. Transaction Fees</h4>
                <p className="text-muted-foreground">
                  All blockchain transactions incur network fees (gas). These fees are paid from your smart account
                  balance and vary based on network conditions.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1">4. Portfolio Allocation</h4>
                <p className="text-muted-foreground">
                  Portfolio allocations are determined by the platform administrator. Users cannot modify asset weights
                  but can deposit, withdraw, or disable portfolios at any time.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1">5. Security</h4>
                <p className="text-muted-foreground">
                  You are responsible for securing your wallet private keys. Never share your seed phrase or private
                  keys with anyone, including platform staff.
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground pt-4">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </ScrollArea>

        <div className="flex items-center space-x-2 py-2">
          <Checkbox id="terms" checked={accepted} onCheckedChange={(checked) => setAccepted(checked as boolean)} />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I have read and accept the Terms & Conditions
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onDecline}>
            Decline
          </Button>
          <Button onClick={handleSign} disabled={!accepted || isPending || !isConnected} className="min-w-32">
            {isPending ? "Signing..." : "Sign & Accept"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
