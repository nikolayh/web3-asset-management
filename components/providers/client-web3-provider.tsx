"use client"

import dynamic from "next/dynamic"
import type React from "react"

const Web3ProviderInternal = dynamic(() => import("./web3-provider").then((mod) => ({ default: mod.Web3Provider })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Initializing Web3...</p>
      </div>
    </div>
  ),
})

export function ClientWeb3Provider({ children }: { children: React.ReactNode }) {
  return <Web3ProviderInternal>{children}</Web3ProviderInternal>
}
