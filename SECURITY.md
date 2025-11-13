# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

Please report (suspected) security vulnerabilities to **security@yourproject.com**. You will receive a response from us within 48 hours. If the issue is confirmed, we will release a patch as soon as possible depending on complexity.

### What to Include

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Our Commitment

- We will respond to your report within 48 hours
- We will keep you informed about the progress
- We will credit you in the security advisory (unless you prefer to remain anonymous)

## Known Security Considerations

### Smart Contract Interactions

- Always verify smart contract addresses before interaction
- Use hardware wallets for large amounts
- Double-check transaction details before signing

### Private Key Management

- Never commit private keys to version control
- Use environment variables for sensitive data
- Rotate API keys regularly

### Database Security

- Row Level Security (RLS) is enabled on all tables
- Service role key should never be exposed to client
- Regular security audits recommended

### Web3 Authentication

- EIP-712 signatures have 5-minute expiry
- Timestamp validation prevents replay attacks
- Always verify signature on server-side

## Security Best Practices

### For Users

1. Use a hardware wallet for large amounts
2. Verify all transaction details before signing
3. Keep your wallet software updated
4. Never share your seed phrase
5. Be cautious of phishing attempts

### For Developers

1. Never expose private keys or service role keys
2. Validate all user inputs
3. Use parameterized queries
4. Keep dependencies updated
5. Follow the principle of least privilege
6. Enable 2FA on all accounts
7. Review code changes carefully
8. Use environment variables for secrets

## Vulnerability Disclosure Timeline

- Day 0: Security issue reported
- Day 1: Issue acknowledged and investigation begins
- Day 3: Issue confirmed and patch development starts
- Day 7: Patch tested and prepared for release
- Day 10: Patch released and security advisory published

## Bug Bounty Program

We currently do not have a formal bug bounty program, but we appreciate security researchers who responsibly disclose vulnerabilities to us. We will acknowledge your contribution in our security advisories.

## Third-Party Security

This project relies on several third-party services:

- **Supabase**: Database and authentication
- **Coinbase CDP**: Smart wallet infrastructure
- **Vercel**: Hosting and deployment
- **WalletConnect**: Wallet connection protocol

Please refer to their respective security policies for information about their security practices.
