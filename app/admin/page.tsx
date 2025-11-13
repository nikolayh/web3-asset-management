"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X, Settings } from "lucide-react"
import { formatPercentage } from "@/lib/utils/format"

interface AssetInput {
  id: string
  symbol: string
  address: string
  weight: number
}

export default function AdminPage() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const [portfolioName, setPortfolioName] = useState("")
  const [assets, setAssets] = useState<AssetInput[]>([{ id: "1", symbol: "", address: "", weight: 0 }])
  const [isCreating, setIsCreating] = useState(false)

  const addAsset = () => {
    setAssets([
      ...assets,
      {
        id: Date.now().toString(),
        symbol: "",
        address: "",
        weight: 0,
      },
    ])
  }

  const removeAsset = (id: string) => {
    if (assets.length > 1) {
      setAssets(assets.filter((a) => a.id !== id))
    }
  }

  const updateAsset = (id: string, field: keyof AssetInput, value: string | number) => {
    setAssets(assets.map((a) => (a.id === id ? { ...a, [field]: value } : a)))
  }

  const totalWeight = assets.reduce((sum, a) => sum + (Number(a.weight) || 0), 0)
  const isValid = portfolioName && assets.every((a) => a.symbol && a.address && a.weight > 0) && totalWeight === 100

  const handleCreate = async () => {
    if (!isValid || !address) return

    setIsCreating(true)
    try {
      const response = await fetch("/api/admin/portfolios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: portfolioName,
          userAddress: address,
          assets: assets.map((a) => ({
            symbol: a.symbol,
            address: a.address,
            weight: Number(a.weight),
          })),
        }),
      })

      if (response.ok) {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("[v0] Failed to create portfolio:", error)
    } finally {
      setIsCreating(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>Please connect your wallet to access admin features</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Admin Portal</h1>
              <p className="text-xs text-muted-foreground font-mono">{address?.slice(0, 10)}...</p>
            </div>
          </div>

          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Create Portfolio Configuration</CardTitle>
            <CardDescription>Define asset allocation for users. Total weight must equal 100%.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Portfolio Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Portfolio Name</Label>
              <Input
                id="name"
                placeholder="e.g., Balanced Growth"
                value={portfolioName}
                onChange={(e) => setPortfolioName(e.target.value)}
              />
            </div>

            {/* Assets Configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Asset Allocation</Label>
                <Button type="button" variant="outline" size="sm" onClick={addAsset}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset
                </Button>
              </div>

              <div className="space-y-3">
                {assets.map((asset, index) => (
                  <div key={asset.id} className="flex gap-3 p-4 bg-muted/30 rounded-lg border border-border">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Symbol</Label>
                          <Input
                            placeholder="ETH"
                            value={asset.symbol}
                            onChange={(e) => updateAsset(asset.id, "symbol", e.target.value.toUpperCase())}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Weight (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="0"
                            value={asset.weight || ""}
                            onChange={(e) => updateAsset(asset.id, "weight", Number.parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Contract Address</Label>
                        <Input
                          placeholder="0x..."
                          className="font-mono text-xs"
                          value={asset.address}
                          onChange={(e) => updateAsset(asset.id, "address", e.target.value)}
                        />
                      </div>
                    </div>

                    {assets.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAsset(asset.id)}
                        className="self-start"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Weight Summary */}
              <div
                className={`p-4 rounded-lg border ${
                  totalWeight === 100
                    ? "bg-accent/10 border-accent text-accent"
                    : "bg-destructive/10 border-destructive text-destructive"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Weight</span>
                  <span className="text-2xl font-bold">{formatPercentage(totalWeight)}</span>
                </div>
                {totalWeight !== 100 && <p className="text-xs mt-1 opacity-80">Must equal 100% to create portfolio</p>}
              </div>
            </div>

            {/* Submit */}
            <Button onClick={handleCreate} disabled={!isValid || isCreating} className="w-full" size="lg">
              {isCreating ? "Creating Portfolio..." : "Create Portfolio"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
