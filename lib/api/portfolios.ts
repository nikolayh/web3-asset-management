"use client"

export async function getPortfolios(address: string) {
  const response = await fetch(`/api/portfolios?address=${address}`)
  if (!response.ok) throw new Error("Failed to fetch portfolios")
  return response.json()
}

export async function createPortfolio(data: {
  name: string
  assets: Array<{ symbol: string; weight: number; address: string }>
  userAddress: string
}) {
  const response = await fetch("/api/admin/portfolios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error("Failed to create portfolio")
  return response.json()
}

export async function updatePortfolioWeights(portfolioId: string, assets: Array<{ symbol: string; weight: number }>) {
  const response = await fetch(`/api/admin/portfolios/${portfolioId}/weights`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assets }),
  })
  if (!response.ok) throw new Error("Failed to update weights")
  return response.json()
}
