# Web3 Investment Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com)

A production-ready Web3 investment platform built with Next.js, integrating Coinbase Server Wallets (ERC-4337) and Supabase for managing crypto portfolios with USDC deposits, automatic rebalancing, and real-time price tracking.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Usage Examples](#usage-examples)
- [Security Considerations](#security-considerations)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

- **Web3 Authentication**: MetaMask/WalletConnect integration with EIP-712 signature-based terms acceptance
- **Portfolio Management**: Admin-created portfolios with custom asset allocations
- **Smart Account Integration**: Automatic sub-wallet creation linked to user addresses via Coinbase CDP
- **USDC Deposits**: Direct deposits to user-specific smart accounts with automatic rebalancing
- **Real-Time Price Tracking**: Dynamic price fetching with 24-hour change calculations
- **Database-Backed Storage**: PostgreSQL (Supabase) with Row Level Security
- **Transaction Management**: Complete audit trail of all deposits, withdrawals, and rebalances
- **Dark Theme UI**: Professional trading platform aesthetic with Tailwind CSS v4

---

## Tech Stack

### Frontend

- **Framework**: Next.js 16.0 with App Router & Turbopack
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Web3**: wagmi + viem + ConnectKit
- **State Management**: SWR for data fetching & caching
- **Forms**: React Hook Form + Zod validation

### Backend

- **Database**: PostgreSQL via Supabase
- **Authentication**: EIP-712 signature verification
- **Blockchain**: Base Network (L2) for low-fee transactions
- **Smart Accounts**: ERC-4337 via Coinbase CDP SDK
- **Price APIs**: CoinGecko/CoinMarketCap integration ready

### Infrastructure

- **Hosting**: Vercel
- **Database**: Supabase (PostgreSQL)
- **CI/CD**: GitHub Actions

---

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account
- WalletConnect Project ID
- MetaMask or compatible Web3 wallet

### Installation

1. **Clone the repository**

   \`\`\`bash
   git clone https://github.com/yourusername/web3-investment-platform.git
   cd web3-investment-platform
   \`\`\`

2. **Install dependencies**

   \`\`\`bash
   pnpm install
   \`\`\`

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   \`\`\`env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # WalletConnect
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

   # Price API (Optional - falls back to mock data)
   PRICE_API_KEY=your_coingecko_api_key
   PRICE_CACHE_DURATION=300000

   # Coinbase CDP (Production - Optional)
   COINBASE_API_KEY_NAME=your_api_key_name
   COINBASE_PRIVATE_KEY=your_private_key
   \`\`\`

4. **Initialize the database**

   Run the SQL migration scripts in your Supabase dashboard:
   - Execute `scripts/001_create_tables.sql`
   - Execute `scripts/002_enable_rls.sql`

5. **Start the development server**

   \`\`\`bash
   pnpm dev
   \`\`\`

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

---

## Project Structure

\`\`\`
.
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes
│   │   ├── admin/                # Admin-only endpoints
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── portfolios/           # Portfolio CRUD operations
│   │   └── wallets/              # Wallet management
│   ├── admin/                    # Admin dashboard page
│   ├── dashboard/                # User dashboard page
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── auth/                     # Authentication components
│   ├── dashboard/                # Dashboard components
│   ├── modals/                   # Modal dialogs
│   ├── providers/                # Context providers
│   └── ui/                       # shadcn/ui components
├── lib/                          # Utility libraries
│   ├── api/                      # API client functions
│   ├── db/                       # Database helper functions
│   ├── services/                 # Business logic services
│   ├── supabase/                 # Supabase client setup
│   └── utils/                    # Utility functions
├── scripts/                      # Database migration scripts
│   ├── 001_create_tables.sql    # Initial schema
│   └── 002_enable_rls.sql       # Security policies
└── public/                       # Static assets
\`\`\`

---

## Database Schema

The application uses a normalized PostgreSQL schema with five main tables:

- **user_wallets**: Stores user wallet addresses and linked sub-wallet addresses
- **portfolios**: Portfolio configurations with user associations
- **assets**: Individual assets within portfolios (weights, allocations)
- **transactions**: Complete audit trail of all operations
- **price_history**: Historical price data for analytics

See `scripts/001_create_tables.sql` for the complete schema definition.

---

## API Documentation

### Authentication

**POST** `/api/auth/verify-signature`

- Verifies EIP-712 signature for terms acceptance
- Returns JWT session token

### Portfolios

**GET** `/api/portfolios`

- Fetches all portfolios for authenticated user
- Includes real-time asset values and 24h changes

**POST** `/api/admin/portfolios`

- Admin-only: Creates new portfolio
- Auto-creates user wallet if needed

**POST** `/api/portfolios/[id]/rebalance`

- Triggers manual portfolio rebalancing
- Executes trades to match target weights

**POST** `/api/portfolios/[id]/disable`

- Disables portfolio and sells all assets to USDC

**POST** `/api/portfolios/[id]/withdraw`

- Withdraws USDC from smart account to user wallet

### Wallets

**GET** `/api/wallets/sub-wallet`

- Fetches or creates user's sub-wallet address

---

## Usage Examples

### Connecting a Wallet

\`\`\`typescript
import { useAccount, useConnect } from 'wagmi';

function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  return (
    <button onClick={() => connect({ connector: connectors[0] })}>
      {isConnected ? address : 'Connect Wallet'}
    </button>
  );
}
\`\`\`

### Fetching Portfolios

\`\`\`typescript
import useSWR from 'swr';

function Portfolio() {
  const { data, error } = useSWR('/api/portfolios', fetcher);
  
  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading...</div>;
  
  return <PortfolioList portfolios={data.portfolios} />;
}
\`\`\`

---

## Security Considerations

- **Row Level Security (RLS)**: All database tables have RLS policies enabled
- **Signature Verification**: EIP-712 signatures prevent unauthorized access
- **Timestamp Validation**: 5-minute expiry window for signature freshness
- **Foreign Key Constraints**: Database integrity enforced at schema level
- **Environment Variables**: Sensitive keys never exposed to client
- **Input Validation**: Zod schemas validate all user inputs
- **Address Checksumming**: EIP-55 checksum validation on all addresses

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

---

## Troubleshooting

### Common Issues

**WalletConnect Connection Errors**

- These are expected in iframe/preview environments
- Use MetaMask browser extension as an alternative
- Errors are safely suppressed and don't affect functionality

**Database Foreign Key Violations**

- Ensure `scripts/001_create_tables.sql` is executed first
- Check that user wallet exists before creating portfolios
- Admin API auto-creates wallets if missing

**Price API Rate Limits**

- Application falls back to cached/mock data
- Configure `PRICE_CACHE_DURATION` to reduce API calls
- Consider upgrading to paid CoinGecko plan

---

## Performance Optimization

- SWR caching reduces API calls
- Price data cached for 5 minutes by default
- Database indexes on frequently queried columns
- Optimistic UI updates for better UX

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Coinbase CDP](https://docs.cdp.coinbase.com/) - Smart wallet infrastructure
- [Supabase](https://supabase.com/) - Database and authentication
- [wagmi](https://wagmi.sh/) - React hooks for Ethereum
- [shadcn/ui](https://ui.shadcn.com/) - Component library

---

## Roadmap

- [ ] Multi-chain support (Ethereum, Polygon, Arbitrum)
- [ ] Advanced portfolio strategies (DCA, rebalancing algorithms)
- [ ] Mobile app (React Native)
- [ ] Portfolio analytics and reporting
- [ ] Social trading features
- [ ] Integration with more DEXes
- [ ] Advanced charting and technical analysis
- [ ] Automated tax reporting

---

**Made with ❤️ 
