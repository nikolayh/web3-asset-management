export const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
export const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"

export const getUSDCAddress = (chainId: number) => {
  switch (chainId) {
    case 8453: // Base mainnet
      return USDC_BASE
    case 84532: // Base Sepolia
      return USDC_BASE_SEPOLIA
    default:
      return USDC_BASE_SEPOLIA
  }
}
