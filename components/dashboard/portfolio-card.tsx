"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Portfolio } from "@/lib/types"
import { formatUSD, formatAddress, formatPercentage } from "@/lib/utils/format"
import { TrendingUp, TrendingDown, ArrowUpRight, Wallet, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface PortfolioCardProps {
  portfolio: Portfolio
  onDeposit: () => void
  onWithdraw: () => void
  onRebalance: () => void
  onDisable: () => void
}

export function PortfolioCard({ portfolio, onDeposit, onWithdraw, onRebalance, onDisable }: PortfolioCardProps) {
  const portfolioChange = portfolio.change24hPercentage || 0
  const isPositive = portfolioChange >= 0

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {portfolio.name}
              {portfolio.isActive ? (
                <Badge variant="default" className="bg-accent">
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </CardTitle>
            <CardDescription className="font-mono text-xs">
              {formatAddress(portfolio.smartAccountAddress)}
            </CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDeposit}>Deposit</DropdownMenuItem>
              <DropdownMenuItem onClick={onWithdraw}>Withdraw</DropdownMenuItem>
              <DropdownMenuItem onClick={onRebalance}>Rebalance</DropdownMenuItem>
              <DropdownMenuItem onClick={onDisable} className="text-destructive">
                Disable Portfolio
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{formatUSD(portfolio.totalValue)}</span>
          {portfolio.totalValue > 0 && (
            <div className={`flex items-center text-sm ${isPositive ? "text-accent" : "text-destructive"}`}>
              {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              <span>
                {isPositive ? "+" : ""}
                {portfolioChange.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {/* Assets List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Asset</span>
            <div className="flex gap-8">
              <span className="w-16 text-right">Weight</span>
              <span className="w-24 text-right">Value</span>
            </div>
          </div>

          {portfolio.assets.map((asset) => (
            <div key={asset.symbol} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="font-bold text-primary text-sm">{asset.symbol[0]}</span>
                </div>
                <div>
                  <p className="font-medium">{asset.symbol}</p>
                  <p className="text-xs text-muted-foreground">
                    {asset.name}
                    {asset.change24h !== undefined && asset.change24h !== 0 && (
                      <span className={`ml-2 ${asset.change24h >= 0 ? "text-accent" : "text-destructive"}`}>
                        {asset.change24h >= 0 ? "+" : ""}
                        {asset.change24h.toFixed(1)}%
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-8 items-center">
                <span className="w-16 text-right font-mono text-sm">{formatPercentage(asset.weight)}</span>
                <span className="w-24 text-right font-medium">{formatUSD(asset.currentValue)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button onClick={onDeposit} className="flex-1" size="lg">
            <Wallet className="h-4 w-4 mr-2" />
            Deposit
          </Button>
          <Button onClick={onWithdraw} variant="outline" className="flex-1 bg-transparent" size="lg">
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Withdraw
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
