# Contributing to Kiro Workers

Thank you for your interest in contributing to Kiro Workers!

**Important**: This is an independent, experimental project and is **NOT** officially part of, endorsed by, or affiliated with AWS or kiro.dev in any way. This is a small, community-driven effort.

**Note**: This guide is for **contributors** who want to develop the kiro-workers actions themselves. If you just want to **use** these actions in your workflows, see the [README.md](./README.md) - you don't need to clone this repository or install anything.

---

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Pre-commit Hooks](#pre-commit-hooks)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Code Quality Standards](#code-quality-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Creating a Release](#creating-a-release)
- [Troubleshooting](#troubleshooting)

## Development Setup

### Prerequisites

- Node.js 20.x or later
- npm 9.x or later
- Git
- Python 3.7+ (for pre-commit framework)
- GitHub account with repository access

### Initial Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/your-org/kiro-workers.git
   cd kiro-workers
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Install pre-commit hooks:

   ```bash
   pip install pre-commit
   pre-commit install
   pre-commit install --hook-type commit-msg
   ```

4. Verify setup:

   ```bash
   npm run type-check
   npm run lint
   npm test
   npm run build
   ```

## Project Structure

When contributing, you'll work with this structure:

```
kiro-workers/
├── actions/              # Individual GitHub Actions
│   ├── kiro-cli-setup/
│   ├── kiro-pr-review/
│   ├── kiro-issue-review/
│   └── kiro-project-sync/
├── shared/               # Shared utilities and types
│   ├── utils/
│   └── types/
└── .github/              # GitHub workflows and default agents
    ├── workflows/
    └── kiro/
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feat/my-feature
```

### 2. Make Changes

Edit files in `actions/` or `shared/` directories.

### 3. Run Local Checks

```bash
# Lint your code
npm run lint

# Check types
npm run type-check

# Run tests
npm test

# Build to verify
npm run build
```

### 4. Commit Changes

Use Conventional Commits format (see below).

### 5. Push and Create PR

```bash
git push origin feat/my-feature
```

Then create a Pull Request on GitHub.

### 6. CI Checks

The following checks will run automatically:

- ✅ Lint
- ✅ Type Check
- ✅ Test
- ✅ Build (all 4 actions)
- ✅ Verify Zero Third-Party Dependencies
- ✅ Pre-commit Hooks
- ✅ Conventional Commits

### 7. Merge

Once all checks pass and the PR is approved, merge to `main`.

## Pre-commit Hooks

This project uses [pre-commit](https://pre-commit.com/) to ensure code quality and consistency. Pre-commit hooks automatically run checks before each commit.

### What Gets Checked

Pre-commit hooks validate:

**File Types:**

- TypeScript/JavaScript (`.ts`, `.tsx`, `.js`, `.jsx`)
- YAML (`.yml`, `.yaml`)
- JSON (`.json`)
- Markdown (`.md`)
- Shell scripts (`.sh`)

**Checks Performed:**

1. **General File Quality**

   - Trailing whitespace removal
   - End-of-file fixer (ensures newline at end)
   - Mixed line ending check (enforces LF)
   - Large file detection (prevents files >1MB)
   - Merge conflict detection
   - Private key detection

2. **YAML Validation**

   - Syntax validation
   - Style linting (yamllint): 2-space indentation, 120-char lines

3. **JSON Validation**

   - Syntax validation
   - Formatting with Prettier

4. **TypeScript/JavaScript**

   - ESLint: TypeScript best practices, bug detection, style consistency
   - Prettier: Code formatting (2-space indent, single quotes, semicolons)
   - Type checking: TypeScript compiler validation

5. **Markdown**

   - Markdownlint: Heading styles, list formatting, 120-char lines

6. **Commit Messages**
   - Conventional Commits validation
   - Format: `<type>(<scope>): <subject>`
   - Valid types: feat, fix, docs, style, refactor, test, chore, build, ci, perf

### Installing Pre-commit

**Step 1: Install the pre-commit framework**

Choose one method:

#### Option 1: Using pip (Recommended)

```bash
pip install pre-commit
```

#### Option 2: Using Homebrew (macOS)

```bash
brew install pre-commit
```

#### Option 3: Using conda

```bash
conda install -c conda-forge pre-commit
```

### Setting Up Hooks

After installing pre-commit, set up the git hooks:

```bash
pre-commit install
pre-commit install --hook-type commit-msg
```

This installs hooks that run:

- **Before each commit**: Code formatting, linting, and validation
- **On commit messages**: Conventional Commits format validation

### Running Hooks Manually

Run all hooks on all files:

```bash
pre-commit run --all-files
```

Run a specific hook:

```bash
pre-commit run <hook-id> --all-files
```

Examples:

```bash
pre-commit run prettier --all-files
pre-commit run eslint --all-files
pre-commit run markdownlint --all-files
```

Run hooks on specific files:

```bash
pre-commit run --files path/to/file1.ts path/to/file2.ts
```

### Updating Hooks

Update hooks to their latest versions:

```bash
pre-commit autoupdate
```

### Troubleshooting Pre-commit

**Hook fails on commit:**

1. Review the error message
2. Fix the issues (most hooks auto-fix)
3. Stage the fixes: `git add <fixed-files>`
4. Commit again

**Auto-fix not working:**

- Some hooks auto-fix (Prettier, ESLint with `--fix`)
- Others require manual fixes (TypeScript errors, commit message format)

**Performance issues:**

- Hooks run on staged files by default (fast)
- Use `SKIP` environment variable during development:

  ```bash
  SKIP=eslint,typescript-check git commit -m "WIP: work in progress"
  ```

- Run full checks before pushing: `pre-commit run --all-files`

### Skipping Hooks (Emergency Only)

In rare cases where you need to skip hooks:

```bash
git commit --no-verify -m "your message"
```

**Warning**: Only use this in emergencies. Skipped checks may cause CI/CD failures.

## Commit Message Guidelines

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring without changing functionality
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (dependencies, tooling, etc.)
- **build**: Build system or external dependency changes
- **ci**: CI/CD configuration changes
- **perf**: Performance improvements

### Scopes

Common scopes in this project:

- **setup**: kiro-cli-setup action
- **pr-review**: kiro-pr-review action
- **issue-review**: kiro-issue-review action
- **project-sync**: kiro-project-sync action
- **shared**: Shared utilities
- **docs**: Documentation
- **config**: Configuration files

### Examples

```bash
# Feature addition
git commit -m "feat(setup): add AWS Secrets Manager support for token retrieval"

# Bug fix
git commit -m "fix(pr-review): handle PRs with no changed files"

# Documentation
git commit -m "docs(readme): add authentication setup instructions"

# Test addition
git commit -m "test(shared): add property tests for download utility"

# Chore
git commit -m "chore(deps): update @actions/core to v1.10.0"
```

### Task-Based Commits

When working on tasks from the implementation plan:

```bash
# Format: <type>(<scope>): <task-id> <task-title>
git commit -m "feat(shared): 2.1 Create download utility"
git commit -m "test(shared): 2.2 Write property test for download utility"
```

## Code Quality Standards

### TypeScript

- Use TypeScript strict mode
- Provide explicit return types for functions
- Avoid `any` types (use `unknown` if necessary)
- Use meaningful variable and function names
- Document complex logic with comments

### Formatting

- **Prettier** handles all code formatting automatically
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- 100 character line length (120 for Markdown)

### Linting

- **ESLint** enforces code quality rules
- Fix all linting errors before committing
- Warnings should be addressed or justified

### File Organization

```
kiro-workers/
├── actions/              # Individual GitHub Actions
│   ├── kiro-cli-setup/
│   ├── kiro-pr-review/
│   ├── kiro-issue-review/
│   └── kiro-project-sync/
├── shared/               # Shared utilities and types
│   ├── utils/
│   └── types/
└── .github/              # GitHub workflows and default agents
    ├── workflows/
    └── kiro/
```

### Zero Third-Party Dependencies

**Critical Constraint**: Actions must use ONLY:

- `@actions/*` packages from GitHub
- Node.js built-in modules

No third-party npm packages are allowed. This is enforced by CI.

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Requirements

- **Unit tests**: For specific examples and edge cases
- **Property tests**: For universal correctness properties (minimum 100 iterations)
- **Integration tests**: For end-to-end workflows
- Minimum 80% code coverage
- All tests must pass before merging

### Property-Based Testing

This project uses **fast-check** for property-based testing. Each property test must:

1. Reference its design document property
2. Run at least 100 iterations
3. Use the tag format: `// Feature: kiro-workers, Property {number}: {property_text}`

Example:

```typescript
import * as fc from 'fast-check';

// Feature: kiro-workers, Property 1: Platform-Specific Binary Selection
test('Platform-specific binary selection', () => {
  fc.assert(
    fc.property(fc.constantFrom('linux', 'darwin', 'win32'), fc.constantFrom('x64', 'arm64'), (platform, arch) => {
      const url = constructDownloadURL('1.0.0', platform, arch);
      expect(url).toContain(platform);
      expect(url).toContain(arch);
    }),
    { numRuns: 100 }
  );
});
```

## Pull Request Process

### Before Submitting

1. Ensure all tests pass: `npm test`
2. Ensure all pre-commit hooks pass: `pre-commit run --all-files`
3. Update documentation if needed
4. Add tests for new functionality
5. Follow the commit message guidelines

### PR Description

Include in your PR description:

- **Summary**: Brief description of changes
- **Motivation**: Why these changes are needed
- **Testing**: How you tested the changes
- **Related Issues**: Link to related issues (e.g., "Closes #123")
- **Checklist**: Confirm all requirements are met

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] New tests added for new functionality
- [ ] Documentation updated
- [ ] Commit messages follow Conventional Commits
- [ ] Pre-commit hooks pass
- [ ] No third-party dependencies added (only @actions/\* and Node.js built-ins)

### Review Process

1. Automated checks must pass (CI/CD, pre-commit hooks)
2. At least one maintainer approval required
3. All review comments must be addressed
4. PR will be squashed and merged with a clean commit message

## Creating a Release

**For Maintainers Only**

### 1. Decide on Version

Follow [Semantic Versioning](https://semver.org/):

- **Major** (v2.0.0): Breaking changes
- **Minor** (v1.1.0): New features, backward compatible
- **Patch** (v1.0.1): Bug fixes, backward compatible

### 2. Create and Push Tag

```bash
# Create tag
git tag v1.0.0

# Push tag
git push origin v1.0.0
```

### 3. Automated Release Process

The release workflow will automatically:

1. ✅ Build all actions
2. ✅ Verify zero third-party dependencies
3. ✅ Commit dist/ directories
4. ✅ Create GitHub Release with notes
5. ✅ Publish release

### 4. Verify Release

1. Go to **Releases** on GitHub
2. Verify the new release is published
3. Check that dist/ directories are committed
4. Review release notes

## Troubleshooting

### Build Fails

**Problem**: `npm run build` fails with TypeScript errors.

**Solution**:

```bash
# Check TypeScript configuration
npm run type-check

# Fix type errors in your code
```

### Lint Fails

**Problem**: ESLint reports errors.

**Solution**:

```bash
# Auto-fix issues
npm run lint -- --fix

# Review remaining issues
npm run lint
```

### Pre-commit Hooks Fail

**Problem**: Pre-commit hooks prevent commit.

**Solution**:

```bash
# Run pre-commit manually
pre-commit run --all-files

# Fix reported issues
# Then try committing again
```

### Dependency Verification Fails

**Problem**: CI reports third-party dependencies in bundle.

**Solution**:

1. Review your imports - only use `@actions/*` and Node.js built-ins
2. Check `package.json` dependencies section
3. Remove any third-party packages
4. Rebuild

### GitHub Actions Not Running

**Problem**: Workflows don't trigger on push/PR.

**Solution**:

1. Check **Settings** → **Actions** → **General**
2. Ensure "Allow all actions" is selected
3. Verify workflow files are in `.github/workflows/`

## Best Practices

1. **Always run checks locally** before pushing:

   ```bash
   npm run lint && npm run type-check && npm test && npm run build
   ```

2. **Use Conventional Commits** for automatic changelog generation

3. **Keep dist/ committed** - required for GitHub Actions to work

4. **Review dependency audit** - zero third-party dependencies is enforced

5. **Write tests** - unit tests, property tests, and integration tests

6. **Document changes** - update READMEs and add code comments

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Creating GitHub Actions](https://docs.github.com/en/actions/creating-actions)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Pre-commit Framework](https://pre-commit.com/)

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## Questions?

If you have questions or need help:

- Open an issue for bugs or feature requests
- Start a discussion for general questions
- Review existing documentation and issues first

Thank you for contributing to Kiro Workers! 🎉
