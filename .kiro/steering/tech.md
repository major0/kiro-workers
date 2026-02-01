# Technology Stack

## Core Technologies

- **Language**: TypeScript (compiled to JavaScript for distribution)
- **Runtime**: Node.js 20.x or later
- **Package Manager**: npm 9.x or later

## Dependencies

### Allowed Dependencies (Zero Third-Party Rule)

**CRITICAL**: This project enforces a strict zero third-party dependencies policy. Only the following are permitted:

1. **GitHub Actions Packages** (`@actions/*`):
   - `@actions/core` - Core action utilities
   - `@actions/github` - GitHub API client (Octokit)
   - `@actions/tool-cache` - Binary caching
   - `@actions/exec` - Process execution
   - `@actions/http-client` - HTTP requests

2. **Node.js Built-in Modules**:
   - `crypto` - Checksum verification
   - `https` - Binary downloads
   - `fs` - File system operations
   - `path` - Path manipulation
   - `child_process` - CLI execution

**No other npm packages are allowed.** This is enforced by CI/CD.

## Build System

- **Compiler**: TypeScript (`tsc`)
- **Bundler**: `@vercel/ncc` - Compiles TypeScript and bundles into single `dist/index.js` per action
- **Build Output**: Each action has a `dist/` directory that must be committed (required for GitHub Actions)

## Code Quality Tools

- **Linter**: ESLint with TypeScript plugin
- **Formatter**: Prettier
- **Type Checker**: TypeScript compiler
- **Pre-commit**: Pre-commit framework with multiple hooks
- **Testing**: Jest (unit tests) and fast-check (property-based tests)

## Common Commands

### Development

```bash
# Install dependencies
npm install

# Type check
npm run type-check

# Lint code
npm run lint

# Auto-fix linting issues
npm run lint -- --fix

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run property-based tests
npm run test:properties
```

### Building

```bash
# Build all actions
npm run build

# Build individual actions
npm run build:kiro-cli-setup
npm run build:kiro-pr-review
npm run build:kiro-issue-review
npm run build:kiro-project-sync
```

### Pre-commit Hooks

```bash
# Install pre-commit hooks
pre-commit install
pre-commit install --hook-type commit-msg

# Run all hooks manually
pre-commit run --all-files

# Run specific hook
pre-commit run prettier --all-files
pre-commit run eslint --all-files
```

## GitHub API Access

**Important**: This project does NOT use the GitHub CLI (`gh`). All GitHub operations use the Octokit REST API client provided by `@actions/github`. This approach:

- Eliminates external dependencies
- Provides direct programmatic access
- Ensures consistent behavior across runners
- Avoids CLI process spawning overhead

Use `octokit.rest.*` methods for all GitHub operations.
