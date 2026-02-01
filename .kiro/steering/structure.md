# Project Structure

## Directory Organization

```
kiro-workers/
├── actions/                    # Individual GitHub Actions
│   ├── kiro-cli-setup/        # CLI installation action
│   │   ├── action.yml         # Action metadata
│   │   ├── src/
│   │   │   └── main.ts        # Entry point
│   │   └── dist/              # Compiled output (committed)
│   ├── kiro-pr-review/        # PR review action
│   ├── kiro-issue-review/     # Issue review action
│   └── kiro-project-sync/     # Project sync action
├── shared/                     # Shared utilities and types
│   ├── utils/                 # Reusable utility modules
│   │   ├── download.ts        # Binary download utilities
│   │   ├── checksum.ts        # Integrity verification
│   │   ├── github-api.ts      # GitHub API wrappers
│   │   ├── kiro-cli.ts        # Kiro CLI execution
│   │   ├── agent-loader.ts    # Agent configuration loading
│   │   └── error-handler.ts   # Error handling utilities
│   └── types/                 # Shared TypeScript types
│       └── index.ts
├── .github/                    # GitHub configuration
│   ├── workflows/             # CI/CD workflows
│   │   ├── ci.yml            # Lint, test, build, verify deps
│   │   ├── release.yml       # Release automation
│   │   └── pre-commit.yml    # Pre-commit validation
│   └── kiro/                  # Default agent configurations
│       ├── pull-request/      # Default PR agent
│       ├── issue/             # Default issue agent
│       └── project/           # Default project agent
├── .kiro/                      # Kiro-specific files
│   ├── specs/                 # Feature specifications
│   │   └── kiro-workers/      # Main project spec
│   ├── steering/              # AI assistant guidance
│   └── hooks/                 # Agent hooks
└── docs/                       # Additional documentation
```

## Key Conventions

### Action Structure

Each action follows this pattern:
- `action.yml` - Metadata and input/output definitions
- `src/main.ts` - Entry point that imports shared utilities
- `dist/index.js` - Bundled output (auto-generated, must be committed)

### Shared Code

- Place reusable logic in `shared/utils/`
- Define shared types in `shared/types/`
- Import shared code using relative paths from action entry points

### Agent Configuration

Custom agents can be defined in `.github/kiro/{type}/`:
- `prompt.md` - Agent instructions
- `config.json` - Agent configuration
- `code/` - Optional custom TypeScript modules

Agent hierarchy: workflow override > custom agent > default agent

### File Naming

- TypeScript files: `kebab-case.ts`
- Test files: `*.test.ts` (co-located with source)
- Property test files: `*.properties.test.ts`
- Configuration files: Standard names (`.eslintrc.json`, `.prettierrc`, etc.)

### Commit Requirements

- **dist/ directories must be committed** - Required for GitHub Actions to work
- Use Conventional Commits format: `<type>(<scope>): <subject>`
- Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`
- Example: `feat(setup): add AWS Secrets Manager support`

## Code Organization Patterns

### Error Handling

Use centralized error handling from `shared/utils/error-handler.ts`:
- Throw `ActionError` for expected failures
- Use `@actions/core.setFailed()` for action failures
- Log errors with `@actions/core.error()`

### GitHub API Access

Use the wrapper in `shared/utils/github-api.ts`:
- All GitHub operations through Octokit REST API
- No GitHub CLI (`gh`) usage
- Handle rate limits and retries

### CLI Execution

Use utilities from `shared/utils/kiro-cli.ts`:
- Verify CLI availability before execution
- Pass structured input as JSON
- Capture stdout/stderr properly
- Handle exit codes

## Testing Structure

- Unit tests: Co-located with source files (`*.test.ts`)
- Property tests: Separate files (`*.properties.test.ts`)
- Minimum 80% code coverage required
- Property tests must run at least 100 iterations
