import { createClient } from "@/lib/supabase/server"
import type { UserWalletInfo } from "@/lib/types"

export async function getUserWallet(userAddress: string): Promise<UserWalletInfo | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("user_wallets")
    .select("*")
    .eq("user_address", userAddress)
    .eq("is_active", true)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null
    }
    console.error("[v0] Error fetching user wallet:", error)
    throw new Error("Failed to fetch user wallet")
  }

  return {
    userAddress: data.user_address,
    subWalletAddress: data.sub_wallet_address,
    subWalletId: data.sub_wallet_id,
    createdAt: data.created_at,
    lastUsed: data.last_used,
  }
}

export async function createUserWallet(
  userAddress: string,
  subWalletAddress: string,
  subWalletId: string,
  encryptedKey?: string,
): Promise<UserWalletInfo> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("user_wallets")
    .insert({
      user_address: userAddress,
      sub_wallet_address: subWalletAddress,
      sub_wallet_id: subWalletId,
      encrypted_key: encryptedKey,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating user wallet:", error)
    throw new Error("Failed to create user wallet")
  }

  return {
    userAddress: data.user_address,
    subWalletAddress: data.sub_wallet_address,
    subWalletId: data.sub_wallet_id,
    createdAt: data.created_at,
    lastUsed: data.last_used,
  }
}

export async function updateWalletLastUsed(userAddress: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("user_wallets")
    .update({ last_used: new Date().toISOString() })
    .eq("user_address", userAddress)

  if (error) {
    console.error("[v0] Error updating wallet last used:", error)
  }
}
