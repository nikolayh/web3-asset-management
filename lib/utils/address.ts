import { isAddress, getAddress } from "viem"

/**
 * Generates a valid mock Ethereum address for testing/development
 * In production, this would be replaced by actual Coinbase CDP SDK smart account creation
 */
export function generateMockAddress(): `0x${string}` {
  // Generate 40 random hex characters (20 bytes)
  const hex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")

  const address = `0x${hex}` as `0x${string}`

  // Validate and return checksummed address
  if (!isAddress(address)) {
    throw new Error("Failed to generate valid address")
  }

  return getAddress(address)
}

/**
 * Validates and formats an Ethereum address
 * Returns checksummed address or throws error
 */
export function validateAddress(address: string): `0x${string}` {
  if (!address) {
    throw new Error("Address is required")
  }

  if (!isAddress(address)) {
    throw new Error(`Invalid Ethereum address: ${address}. Must be a 20-byte hex value (40 hex characters).`)
  }

  // Return checksummed address
  return getAddress(address)
}

/**
 * Safely checks if a string is a valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  try {
    return isAddress(address)
  } catch {
    return false
  }
}
