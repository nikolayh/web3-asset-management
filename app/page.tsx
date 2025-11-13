"use client"

import { useEffect, useState } from "react"
import { useAccount, useDisconnect } from "wagmi"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { WalletButton } from "@/components/auth/wallet-button"
import { TermsDialog } from "@/components/auth/terms-dialog"
import { ArrowRight, Shield, Zap, Lock, LineChart } from "lucide-react"

export default function HomePage() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const router = useRouter()
  const [showTerms, setShowTerms] = useState(false)
  const [sessionToken, setSessionToken] = useState<string | null>(null)

  useEffect(() => {
    if (isConnected && address && !sessionToken) {
      // Check if user has already signed terms
      const storedToken = localStorage.getItem(`session_${address}`)
      if (storedToken) {
        setSessionToken(storedToken)
        router.push("/dashboard")
      } else {
        setShowTerms(true)
      }
    }
  }, [isConnected, address, sessionToken, router])

  const handleAcceptTerms = async (signature: string, timestamp: number) => {
    if (!address) return

    try {
      console.log("[v0] Sending signature for verification:", { address, timestamp })

      const response = await fetch("/api/auth/verify-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          signature,
          timestamp,
        }),
      })

      const data = await response.json()

      if (data.success) {
        console.log("[v0] Signature verified successfully")
        localStorage.setItem(`session_${address}`, data.token)
        setSessionToken(data.token)
        setShowTerms(false)
        router.push("/dashboard")
      } else {
        console.error("[v0] Signature verification failed:", data.error)
        alert(`Authentication failed: ${data.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("[v0] Failed to verify signature:", error)
      alert("Failed to verify signature. Please try again.")
    }
  }

  const handleDeclineTerms = () => {
    setShowTerms(false)
    disconnect()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <LineChart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Vaultify</span>
          </div>

          <WalletButton />
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium">
            <Zap className="h-4 w-4" />
            Powered by Coinbase Smart Accounts
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance">
            Institutional-Grade
            <br />
            <span className="text-primary">Crypto Portfolio</span>
            <br />
            Management
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
            Invest in diversified crypto portfolios with automatic rebalancing. Powered by ERC-4337 smart accounts on
            Base network for secure, gas-efficient transactions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <WalletButton />
            <Button variant="outline" size="lg" className="group bg-transparent">
              Learn More
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card border border-border rounded-xl p-8 space-y-4">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Secure Smart Accounts</h3>
            <p className="text-muted-foreground leading-relaxed">
              Your funds are protected by ERC-4337 smart accounts, providing enhanced security with server-side wallet
              management.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-8 space-y-4">
            <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <Zap className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold">Auto-Rebalancing</h3>
            <p className="text-muted-foreground leading-relaxed">
              Portfolios automatically rebalance on deposits using batched transactions for optimal gas efficiency on
              Base L2.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-8 space-y-4">
            <div className="h-12 w-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
              <Lock className="h-6 w-6 text-chart-2" />
            </div>
            <h3 className="text-xl font-semibold">Full Control</h3>
            <p className="text-muted-foreground leading-relaxed">
              Deposit and withdraw USDC anytime. Disable portfolios to convert all assets back to USDC instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Terms Dialog */}
      <TermsDialog open={showTerms} onAccept={handleAcceptTerms} onDecline={handleDeclineTerms} />
    </div>
  )
}
