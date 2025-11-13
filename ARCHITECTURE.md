# Architecture Documentation

## Table of Contents

- [System Overview](#system-overview)
- [High-Level Architecture](#high-level-architecture)
- [Component Architecture](#component-architecture)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Scalability Considerations](#scalability-considerations)
- [Error Handling](#error-handling)
- [Monitoring & Observability](#monitoring--observability)
- [Deployment Architecture](#deployment-architecture)
- [Future Enhancements](#future-enhancements)

---

## System Overview

The Web3 Investment Platform is a full-stack application that combines traditional web technologies with blockchain integration to provide a seamless crypto portfolio management experience.

---

## High-Level Architecture

\`\`\`
┌─────────────────┐
│   User Wallet   │ (MetaMask/WalletConnect)
└────────┬────────┘
         │ Web3 Connection
         ↓
┌─────────────────────────────────────┐
│         Next.js Frontend             │
│  ┌──────────┐      ┌──────────┐    │
│  │  React   │      │  wagmi   │    │
│  │Components│◄─────┤  Hooks   │    │
│  └──────────┘      └──────────┘    │
│         │                           │
│         ↓                           │
│  ┌──────────────┐                  │
│  │     SWR      │ (State)          │
│  └──────────────┘                  │
└────────┬────────────────────────────┘
         │ HTTPS/API
         ↓
┌─────────────────────────────────────┐
│      Next.js API Routes              │
│  ┌──────────────────────────────┐   │
│  │   Business Logic Services    │   │
│  │  • Portfolio Calculator      │   │
│  │  • Price Service             │   │
│  │  • Wallet Service            │   │
│  └──────────────────────────────┘   │
└────┬─────────────────────┬──────────┘
     │                     │
     │                     │
     ↓                     ↓
┌──────────────┐    ┌──────────────┐
│   Supabase   │    │ Coinbase CDP │
│  PostgreSQL  │    │ Smart Wallets│
└──────────────┘    └──────────────┘
                           │
                           ↓
                    ┌─────────────┐
                    │Base Network │
                    │   (L2 EVM)  │
                    └─────────────┘
\`\`\`

---

## Component Architecture

### Frontend Layer

**Technology Stack:**

- Next.js 16 (App Router)
- React 19.2
- TypeScript 5
- Tailwind CSS v4
- shadcn/ui components

**Key Responsibilities:**

- User interface rendering
- Web3 wallet connection management
- Client-side state management with SWR
- Form validation with React Hook Form + Zod
- Real-time data updates

### API Layer

**Technology Stack:**

- Next.js API Routes
- Server-side TypeScript
- Supabase client (SSR)

**Key Responsibilities:**

- Authentication & authorization
- Business logic execution
- Database operations
- External API integration
- Error handling & logging

### Data Layer

**Supabase (PostgreSQL):**

- User wallet mappings
- Portfolio configurations
- Asset allocations
- Transaction history
- Price history

**Row Level Security:**

- User-scoped data access
- Admin-only operations
- Automatic policy enforcement

### Blockchain Layer

**Coinbase CDP SDK:**

- ERC-4337 smart account creation
- Batch transaction execution
- Gas sponsorship (paymaster)
- Wallet infrastructure management

**Base Network:**

- Low-cost L2 transactions
- EVM compatibility
- Fast finality

---

## Data Flow

### User Authentication Flow

\`\`\`
1. User connects wallet (MetaMask/WalletConnect)
2. Frontend requests terms signature (EIP-712)
3. User signs message in wallet
4. Frontend sends signature + timestamp to /api/auth/verify-signature
5. Backend verifies signature using viem
6. Backend checks timestamp freshness (5min window)
7. Backend returns session token
8. Frontend stores session and redirects to dashboard
\`\`\`

### Portfolio Creation Flow (Admin)

\`\`\`
1. Admin submits portfolio form
2. Frontend validates with Zod schema
3. API receives portfolio data
4. Check if user wallet exists in DB
5. If not, create user_wallet record
6. Create portfolio record
7. Create asset records (batch insert)
8. Return portfolio ID
9. Frontend refetches portfolios via SWR
\`\`\`

### Deposit Flow

\`\`\`
1. User clicks "Deposit" button
2. Frontend fetches user's sub-wallet address
3. Modal displays amount input + sub-wallet address
4. User enters USDC amount
5. User approves USDC spend (if needed)
6. User transfers USDC to sub-wallet
7. Transaction is confirmed on-chain
8. Frontend calls /api/portfolios/[id]/rebalance
9. Backend fetches current prices
10. Backend calculates target allocations
11. Backend records transaction
12. Frontend shows success + updated balances
\`\`\`

---

## Security Architecture

### Authentication

- **EIP-712 Signatures**: Typed structured data signing
- **Timestamp Validation**: 5-minute expiry window
- **Signature Verification**: Server-side using viem
- **No Password Storage**: Wallet-based authentication

### Authorization

- **Row Level Security**: Database-level access control
- **Session Management**: JWT tokens (optional)
- **Admin Routes**: Separate API endpoints
- **Wallet-Based Permissions**: Address-based authorization

### Data Protection

- **SQL Injection**: Parameterized queries via Supabase
- **XSS Prevention**: React's built-in escaping
- **CSRF Protection**: SameSite cookies
- **Input Validation**: Zod schemas on all inputs
- **Address Validation**: EIP-55 checksum verification

---

## Scalability Considerations

### Database

- **Indexes**: On foreign keys and frequently queried columns
- **Connection Pooling**: Via Supabase connection pooler
- **Query Optimization**: Selective field fetching
- **Caching**: Price data cached for 5 minutes

### API

- **Edge Functions**: Deployed on Vercel Edge
- **Static Generation**: Pre-rendered pages where possible
- **API Rate Limiting**: (Recommended to add)
- **Response Caching**: SWR on client side

### Blockchain

- **Batch Transactions**: ERC-4337 userOperations
- **Gas Optimization**: Smart account features
- **L2 Network**: Base for low fees
- **RPC Caching**: (Recommended to add)

---

## Error Handling

### Client-Side

- **Toast Notifications**: User-friendly error messages
- **Retry Logic**: Automatic retry for transient failures
- **Fallback UI**: Loading and error states
- **Debug Logging**: Console logs with context

### Server-Side

- **Try-Catch Blocks**: Around all async operations
- **Error Logging**: Console.error with context
- **HTTP Status Codes**: Proper REST semantics
- **Error Messages**: Detailed for debugging, sanitized for users

---

## Monitoring & Observability

### Recommended Additions

- **Application Monitoring**: Vercel Analytics
- **Error Tracking**: Sentry integration
- **Database Monitoring**: Supabase metrics
- **RPC Monitoring**: Chain RPC latency tracking
- **User Analytics**: PostHog or Mixpanel

---

## Deployment Architecture

\`\`\`
GitHub Repository
      ↓
GitHub Actions CI/CD
      ↓
Vercel Deployment
   ├── Next.js SSR/SSG
   ├── Edge Functions
   ├── Static Assets (CDN)
   └── Environment Variables
      ↓
Production URLs
\`\`\`

---

## Future Enhancements

1. **Multi-Chain Support**: Extend to Ethereum, Polygon, Arbitrum
2. **WebSocket Updates**: Real-time price and portfolio updates
3. **Advanced Analytics**: Performance charts and metrics
4. **Mobile App**: React Native implementation
5. **Automated Testing**: Unit, integration, and E2E tests
6. **CI/CD Pipeline**: Automated testing and deployment
7. **Rate Limiting**: API throttling and abuse prevention
8. **Audit Logging**: Enhanced security event tracking

---

**Last Updated**: January 2025
