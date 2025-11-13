"use client"

import { ConnectKitButton } from "connectkit"
import { Button } from "@/components/ui/button"

export function WalletButton() {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show, truncatedAddress }) => {
        return (
          <Button onClick={show} variant={isConnected ? "secondary" : "default"} size="lg" className="font-mono">
            {isConnected ? truncatedAddress : "Connect Wallet"}
          </Button>
        )
      }}
    </ConnectKitButton.Custom>
  )
}
