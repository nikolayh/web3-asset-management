"use client"

import type React from "react"

import { WagmiProvider, createConfig, http } from "wagmi"
import { base, baseSepolia } from "wagmi/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ConnectKitProvider, getDefaultConfig } from "connectkit"
import { useState, useEffect } from "react"

const config = createConfig(
  getDefaultConfig({
    chains: [base, baseSepolia],
    transports: {
      [base.id]: http(),
      [baseSepolia.id]: http(),
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    appName: "Vaultify",
    appDescription: "Web3 Investment Platform",
    appUrl: "https://vaultify.app",
    appIcon: "https://vaultify.app/icon.png",
  }),
)

const queryClientConfig = {
  defaultOptions: {
    queries: {
      retry: (failureCount: number, error: any) => {
        // Don't retry on user rejection or connection errors
        if (error?.code === 4001 || error?.message?.includes("User rejected")) {
          return false
        }
        // Retry up to 2 times for network errors
        return failureCount < 2
      },
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 5000),
      staleTime: 10000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
      onError: (error: any) => {
        if (!error?.message?.includes("Connection interrupted") && !error?.message?.includes("not been authorized")) {
          console.error("[v0] Mutation error:", error)
        }
      },
    },
  },
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient(queryClientConfig))

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || String(event.reason)

      // Suppress WalletConnect-specific errors that occur in preview/iframe environments
      const isWalletConnectError =
        errorMessage.includes("Connection interrupted") ||
        errorMessage.includes("not been authorized") ||
        errorMessage.includes("WalletConnect") ||
        errorMessage.includes("WebSocket") ||
        errorMessage.includes("Failed to subscribe") ||
        errorMessage.includes("jsonrpc")

      if (isWalletConnectError) {
        event.preventDefault()
        // Silent suppression - these are expected in preview environment
        return
      }

      // Log other unhandled rejections for debugging
      console.error("[v0] Unhandled promise rejection:", event.reason)
    }

    const originalConsoleError = console.error
    console.error = (...args: any[]) => {
      const errorStr = args.join(" ")
      if (
        errorStr.includes("Connection interrupted") ||
        errorStr.includes("not been authorized") ||
        errorStr.includes("WalletConnect")
      ) {
        // Suppress WalletConnect errors in console
        return
      }
      originalConsoleError.apply(console, args)
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
      console.error = originalConsoleError
    }
  }, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="midnight"
          mode="dark"
          options={{
            disclaimer: (
              <div className="text-xs text-muted-foreground text-center">
                By connecting, you agree to the Terms & Conditions
              </div>
            ),
            embedGoogleFonts: true,
            hideNoWalletCTA: false,
            hideQuestionMarkCTA: false,
            avoidLayoutShift: true,
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
