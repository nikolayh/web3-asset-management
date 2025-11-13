# Contributing to Web3 Investment Platform

First off, thank you for considering contributing to the Web3 Investment Platform! It's people like you that make this project such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** to demonstrate the steps
- **Describe the behavior you observed** and what behavior you expected
- **Include screenshots** if possible
- **Include your environment details** (OS, browser, wallet version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful**
- **List some examples** of how it would be used

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Install dependencies**: `pnpm install`
3. **Make your changes**
4. **Test your changes** thoroughly
5. **Update documentation** if needed
6. **Ensure the code follows** the existing style
7. **Write clear commit messages**
8. **Open a pull request**

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm package manager
- Supabase account
- WalletConnect Project ID

### Local Development

\`\`\`bash
# Clone your fork
git clone https://github.com/your-username/web3-investment-platform.git

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Start development server
pnpm dev
\`\`\`

### Running Tests

\`\`\`bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
\`\`\`

## Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Prefer interfaces over types for object shapes
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

\`\`\`typescript
/**
 * Fetches portfolio data for a given user address
 * @param userAddress - The Ethereum address of the user
 * @returns Promise resolving to portfolio data
 */
export async function getPortfolio(userAddress: string): Promise<Portfolio> {
  // Implementation
}
\`\`\`

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper TypeScript types for props

\`\`\`typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', onClick, children }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}
\`\`\`

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation changes
- `style:` formatting changes
- `refactor:` code refactoring
- `test:` adding tests
- `chore:` maintenance tasks

Examples:
\`\`\`
feat: add portfolio rebalancing API endpoint
fix: resolve signature verification timeout
docs: update installation instructions
\`\`\`

### File Organization

- Place new components in appropriate directories
- Keep related files together
- Use index files for cleaner imports
- Follow the existing folder structure

\`\`\`
components/
  feature-name/
    FeatureComponent.tsx
    FeatureComponent.test.tsx
    useFeatureHook.ts
    index.ts
\`\`\`

## Database Changes

### Migration Scripts

When modifying the database schema:

1. Create a new numbered SQL file in `scripts/`
2. Include both `UP` and `DOWN` migrations
3. Test the migration thoroughly
4. Document any data implications

\`\`\`sql
-- scripts/003_add_portfolio_tags.sql

-- UP Migration
ALTER TABLE portfolios ADD COLUMN tags TEXT[] DEFAULT '{}';
CREATE INDEX idx_portfolios_tags ON portfolios USING GIN(tags);

-- DOWN Migration (in comments)
-- ALTER TABLE portfolios DROP COLUMN tags;
-- DROP INDEX idx_portfolios_tags;
\`\`\`

### Row Level Security

All new tables must include RLS policies:

\`\`\`sql
-- Enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own data
CREATE POLICY "Users can read own data"
  ON your_table FOR SELECT
  USING (auth.uid() = user_id);
\`\`\`

## Testing Guidelines

### Unit Tests

- Test individual functions and components
- Mock external dependencies
- Aim for high code coverage

\`\`\`typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button onClick={() => {}}>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
\`\`\`

### Integration Tests

- Test API endpoints
- Test database operations
- Test Web3 interactions

## Documentation

- Update README.md for new features
- Add JSDoc comments to functions
- Include code examples
- Update API documentation

## Questions?

Feel free to open an issue with the "question" label or reach out to the maintainers directly.

## Recognition

Contributors will be recognized in our README.md and release notes. Thank you for making this project better!
