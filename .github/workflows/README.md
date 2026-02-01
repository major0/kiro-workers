# GitHub Actions Workflows

This directory contains CI/CD workflows for the kiro-workers repository.

## Workflows

### 1. CI Workflow (`ci.yml`)

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

#### Lint

- Runs ESLint on all TypeScript/JavaScript files
- Ensures code quality and consistency
- **Command:** `npm run lint`

#### Type Check

- Runs TypeScript compiler in no-emit mode
- Validates type correctness without generating output
- **Command:** `npm run type-check`

#### Test

- Runs the test suite (when tests exist)
- Continues on error if no test directory is found
- **Command:** `npm test`

#### Build

- Builds all four GitHub Actions in parallel:
  - `kiro-cli-setup`
  - `kiro-pr-review`
  - `kiro-issue-review`
  - `kiro-project-sync`
- Compiles TypeScript and bundles with `@vercel/ncc`
- Verifies `dist/` directories are created
- Uploads build artifacts for verification
- **Commands:** `npm run build:kiro-cli-setup`, etc.

#### Verify Dependencies

- **Critical:** Audits bundled output for third-party dependencies
- Ensures only `@actions/*` packages and Node.js built-ins are included
- Analyzes `require()` calls in bundled `index.js` files
- Fails if any third-party dependencies are detected
- This enforces the zero third-party dependencies constraint

#### CI Success

- Final job that checks all previous jobs succeeded
- Provides clear failure messages if any job failed
- Required status check for merging PRs

**Required Scripts in package.json:**

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.js",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "build:kiro-cli-setup": "tsc && ncc build actions/kiro-cli-setup/src/main.ts -o actions/kiro-cli-setup/dist",
    "build:kiro-pr-review": "tsc && ncc build actions/kiro-pr-review/src/main.ts -o actions/kiro-pr-review/dist",
    "build:kiro-issue-review": "tsc && ncc build actions/kiro-issue-review/src/main.ts -o actions/kiro-issue-review/dist",
    "build:kiro-project-sync": "tsc && ncc build actions/kiro-project-sync/src/main.ts -o actions/kiro-project-sync/dist"
  }
}
```

---

### 2. Release Workflow (`release.yml`)

**Triggers:**

- Push of tags matching `v*` (e.g., `v1.0.0`, `v2.1.3`)

**Permissions:**

- `contents: write` (required for creating releases and committing)

**Jobs:**

#### Build All

- Extracts version from git tag
- Installs dependencies
- Builds all four actions
- Verifies all `dist/` directories exist
- **Critical:** Runs zero third-party dependencies audit
- Uploads build artifacts

#### Commit dist/

- Downloads build artifacts
- Commits `dist/` directories if changes detected
- Pushes to the release tag
- Uses `github-actions[bot]` as committer

#### Create Release

- Downloads build artifacts
- Generates release notes from git history
- Creates GitHub Release with:
  - Version number
  - Changelog since previous tag
  - Installation instructions
  - Verification badges
- Marks release as published (not draft)

**Usage:**

```bash
# Create and push a release tag
git tag v1.0.0
git push origin v1.0.0

# The workflow will automatically:
# 1. Build all actions
# 2. Verify dependencies
# 3. Commit dist/ directories
# 4. Create GitHub Release
```

**Release Notes Format:**

- What's Changed (git log since previous tag)
- Actions Included (list of all four actions)
- Installation instructions
- Verification status

---

### 3. Pre-commit Workflow (`pre-commit.yml`)

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

#### Pre-commit

- Installs Python and Node.js
- Installs pre-commit framework
- Caches pre-commit environments for faster runs
- Runs pre-commit hooks on all files (or changed files for PRs)
- Verifies EditorConfig compliance
- Validates Conventional Commits format (PR only)

**Checks Performed:**

1. **Pre-commit Hooks** (if `.pre-commit-config.yaml` exists):

   - Trailing whitespace removal
   - End-of-file fixes
   - YAML validation
   - JSON validation
   - TypeScript/JavaScript linting
   - Markdown linting

2. **EditorConfig Compliance**:

   - No trailing whitespace in source files
   - All files end with newline
   - Consistent indentation

3. **Conventional Commits** (PR only):
   - All commit messages follow format: `<type>(<scope>): <subject>`
   - Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`, `revert`
   - Examples:
     - `feat(shared): add download utility`
     - `fix(setup): correct cache key generation`
     - `docs(readme): update installation instructions`

**Required Files:**

- `.pre-commit-config.yaml` (optional, but recommended)
- `.editorconfig` (optional, but recommended)

---

## Setup Instructions

### 1. Install Dependencies

```bash
npm install --save-dev \
  typescript \
  @vercel/ncc \
  eslint \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  jest \
  @types/jest \
  @types/node
```

### 2. Configure package.json Scripts

Add the required scripts shown in the CI Workflow section above.

### 3. Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["actions/**/*", "shared/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### 4. Configure ESLint

Create `.eslintrc.json`:

```json
{
  "parser": "@typescript-eslint/parser",
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off"
  }
}
```

### 5. Configure Pre-commit (Optional)

Create `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-added-large-files
      - id: check-merge-conflict

  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.56.0
    hooks:
      - id: eslint
        files: \.(ts|js)$
        types: [file]
```

### 6. Configure EditorConfig (Optional)

Create `.editorconfig`:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.{ts,js,json,yml,yaml}]
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

---

## Workflow Status Badges

Add these badges to your README.md:

```markdown
[![CI](https://github.com/<owner>/<repo>/actions/workflows/ci.yml/badge.svg)](https://github.com/<owner>/<repo>/actions/workflows/ci.yml)
[![Pre-commit](https://github.com/<owner>/<repo>/actions/workflows/pre-commit.yml/badge.svg)](https://github.com/<owner>/<repo>/actions/workflows/pre-commit.yml)
```

---

## Troubleshooting

### CI Workflow Fails on Lint

**Problem:** ESLint errors prevent CI from passing.

**Solution:**

```bash
# Fix auto-fixable issues
npm run lint -- --fix

# Review and fix remaining issues manually
npm run lint
```

### CI Workflow Fails on Type Check

**Problem:** TypeScript compilation errors.

**Solution:**

```bash
# Run type check locally
npm run type-check

# Fix type errors in your code
# Common issues:
# - Missing type annotations
# - Incorrect type usage
# - Missing dependencies
```

### CI Workflow Fails on Build

**Problem:** Build fails or dist/ directory not created.

**Solution:**

```bash
# Build locally to see detailed errors
npm run build:kiro-cli-setup

# Common issues:
# - TypeScript compilation errors
# - Missing dependencies
# - Incorrect file paths
```

### CI Workflow Fails on Dependency Verification

**Problem:** Third-party dependencies detected in bundle.

**Solution:**

1. Review your imports - only use `@actions/*` and Node.js built-ins
2. Check `package.json` dependencies
3. Rebuild and verify locally:

   ```bash
   npm run build:kiro-cli-setup
   grep -oP "require\(['\"]([^'\"]+)['\"]\)" actions/kiro-cli-setup/dist/index.js | sort -u
   ```

### Release Workflow Fails

**Problem:** Release creation fails or dist/ commit fails.

**Solution:**

1. Ensure you have `contents: write` permission
2. Verify tag format matches `v*` pattern
3. Check that all builds succeed before release
4. Review GitHub Actions logs for specific errors

### Pre-commit Workflow Fails on Conventional Commits

**Problem:** Commit messages don't follow Conventional Commits format.

**Solution:**

1. Rewrite commit messages:

   ```bash
   git rebase -i HEAD~N  # N = number of commits to fix
   ```

2. Use correct format: `<type>(<scope>): <subject>`
3. Valid types: feat, fix, docs, style, refactor, test, chore, build, ci, perf, revert

---

## Best Practices

1. **Always run CI locally before pushing:**

   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run build:kiro-cli-setup
   ```

2. **Use Conventional Commits for all commits:**

   - Makes changelog generation automatic
   - Enables semantic versioning
   - Improves project history readability

3. **Keep dist/ directories committed:**

   - Required for GitHub Actions to work
   - Automatically handled by release workflow
   - Don't manually edit dist/ files

4. **Review dependency audit failures carefully:**

   - Zero third-party dependencies is a security requirement
   - Only `@actions/*` and Node.js built-ins allowed
   - If you need a feature, implement it using built-ins

5. **Test releases with pre-release tags first:**

   ```bash
   git tag v1.0.0-beta.1
   git push origin v1.0.0-beta.1
   ```

---

## Maintenance

### Updating Node.js Version

To update the Node.js version used in workflows:

1. Update `node-version` in all three workflow files
2. Test locally with the new version
3. Update documentation

### Updating Dependencies

To update workflow dependencies (actions):

1. Check for new versions of:

   - `actions/checkout`
   - `actions/setup-node`
   - `actions/upload-artifact`
   - `actions/download-artifact`
   - `actions/cache`
   - `actions/setup-python`

2. Update version tags in workflow files

3. Test workflows after updates

### Adding New Actions

When adding a new action to the project:

1. Add build script to `package.json`:

   ```json
   "build:new-action": "tsc && ncc build actions/new-action/src/main.ts -o actions/new-action/dist"
   ```

2. Add to matrix in `ci.yml` and `release.yml`:

   ```yaml
   matrix:
     action:
       - kiro-cli-setup
       - kiro-pr-review
       - kiro-issue-review
       - kiro-project-sync
       - new-action # Add here
   ```

3. Update release notes generation in `release.yml`

---

## Security Considerations

1. **Secrets Management:**

   - Never commit secrets to the repository
   - Use GitHub Secrets for sensitive data
   - Rotate tokens regularly

2. **Dependency Auditing:**

   - Zero third-party dependencies constraint enforced
   - Reduces supply chain attack surface
   - All dependencies are official GitHub Actions packages

3. **Permissions:**

   - Workflows use minimal required permissions
   - `contents: write` only for release workflow
   - Default `GITHUB_TOKEN` for most operations

4. **Code Review:**
   - All PRs must pass CI checks
   - Pre-commit hooks enforce code quality
   - Conventional Commits ensure clear history

---

## Support

For issues with workflows:

1. Check workflow logs in GitHub Actions tab
2. Review troubleshooting section above
3. Ensure all required files and scripts exist
4. Verify Node.js and npm versions match requirements

For questions about the kiro-workers project:

- See main project README.md
- Review design documentation in `.kiro/specs/`
- Check individual action README files
