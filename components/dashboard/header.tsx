"use client"

import { useAccount, useBalance, useDisconnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatAddress, formatToken } from "@/lib/utils/format"
import { getUSDCAddress } from "@/lib/contract-addresses"
import { LogOut, SettingsIcon, LineChart } from "lucide-react"
import { useRouter } from "next/navigation"

export function DashboardHeader() {
  const { address, chainId } = useAccount()
  const { disconnect } = useDisconnect()
  const router = useRouter()

  const { data: usdcBalance } = useBalance({
    address: address,
    token: getUSDCAddress(chainId || 8453) as `0x${string}`,
  })

  const handleLogout = () => {
    disconnect()
    localStorage.removeItem(`session_${address}`)
    router.push("/")
  }

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <LineChart className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Vaultify</h1>
            <p className="text-xs text-muted-foreground">Portfolio Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* USDC Balance */}
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-lg">
            <div className="h-6 w-6 bg-accent rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-accent-foreground">$</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">USDC Balance</p>
              <p className="font-mono font-medium">
                {usdcBalance ? formatToken(Number(usdcBalance.formatted)) : "0.00"}
              </p>
            </div>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {address ? address.slice(2, 4).toUpperCase() : "UN"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">My Account</p>
                  <p className="text-xs font-mono text-muted-foreground">{address && formatAddress(address)}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/admin")}>
                <SettingsIcon className="mr-2 h-4 w-4" />
                Admin Portal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
