"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { DashboardHeader } from "@/components/dashboard/header"
import { PortfolioCard } from "@/components/dashboard/portfolio-card"
import { StatsCard } from "@/components/dashboard/stats-card"
import { DepositModal } from "@/components/modals/deposit-modal"
import { WithdrawModal } from "@/components/modals/withdraw-modal"
import { RebalanceModal } from "@/components/modals/rebalance-modal"
import { DisableModal } from "@/components/modals/disable-modal"
import { Button } from "@/components/ui/button"
import type { Portfolio } from "@/lib/types"
import { formatUSD } from "@/lib/utils/format"
import { Wallet, TrendingUp, Activity, Plus } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showRebalanceModal, setShowRebalanceModal] = useState(false)
  const [showDisableModal, setShowDisableModal] = useState(false)

  const { data, error, isLoading, mutate } = useSWR(address ? `/api/portfolios?address=${address}` : null, fetcher, {
    refreshInterval: 10000,
  })

  useEffect(() => {
    if (!isConnected) {
      router.push("/")
    }
  }, [isConnected, router])

  const handleDeposit = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio)
    setShowDepositModal(true)
  }

  const handleWithdraw = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio)
    setShowWithdrawModal(true)
  }

  const handleRebalance = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio)
    setShowRebalanceModal(true)
  }

  const handleDisable = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio)
    setShowDisableModal(true)
  }

  const handleSuccess = () => {
    mutate()
  }

  if (!isConnected || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !data?.success) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-destructive">Failed to load portfolios</p>
        </div>
      </div>
    )
  }

  const portfolios: Portfolio[] = data.portfolios || []
  const stats = data.stats || {
    totalValue: 0,
    change24h: 0,
    change24hPercentage: 0,
    activePortfolios: 0,
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Total Portfolio Value"
            value={formatUSD(stats.totalValue)}
            icon={Wallet}
            trend={{
              value: `${stats.change24hPercentage >= 0 ? "+" : ""}${stats.change24hPercentage.toFixed(2)}%`,
              positive: stats.change24hPercentage >= 0,
            }}
          />
          <StatsCard title="Active Portfolios" value={stats.activePortfolios.toString()} icon={Activity} />
          <StatsCard
            title="24h Change"
            value={`${stats.change24h >= 0 ? "+" : ""}${formatUSD(Math.abs(stats.change24h))}`}
            icon={TrendingUp}
            trend={{
              value: `${stats.change24hPercentage >= 0 ? "+" : ""}${stats.change24hPercentage.toFixed(1)}%`,
              positive: stats.change24hPercentage >= 0,
            }}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Portfolios</h2>
            <Button onClick={() => router.push("/admin")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Portfolio
            </Button>
          </div>

          {portfolios.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-lg">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Portfolios Yet</h3>
              <p className="text-muted-foreground mb-6">Create your first portfolio to start investing</p>
              <Button onClick={() => router.push("/admin")}>Create Portfolio</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {portfolios.map((portfolio) => (
                <PortfolioCard
                  key={portfolio.id}
                  portfolio={portfolio}
                  onDeposit={() => handleDeposit(portfolio)}
                  onWithdraw={() => handleWithdraw(portfolio)}
                  onRebalance={() => handleRebalance(portfolio)}
                  onDisable={() => handleDisable(portfolio)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedPortfolio && (
        <>
          <DepositModal
            open={showDepositModal}
            onClose={() => setShowDepositModal(false)}
            portfolio={selectedPortfolio}
            onSuccess={handleSuccess}
          />
          <WithdrawModal
            open={showWithdrawModal}
            onClose={() => setShowWithdrawModal(false)}
            portfolio={selectedPortfolio}
            onSuccess={handleSuccess}
          />
          <RebalanceModal
            open={showRebalanceModal}
            onClose={() => setShowRebalanceModal(false)}
            portfolio={selectedPortfolio}
            onSuccess={handleSuccess}
          />
          <DisableModal
            open={showDisableModal}
            onClose={() => setShowDisableModal(false)}
            portfolio={selectedPortfolio}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </div>
  )
}
