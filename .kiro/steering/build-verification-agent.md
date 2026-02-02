---
inclusion: manual
---

# Build Verification Agent Instructions

You are triggered by the after-implementation hook as part of the quality assurance workflow. Your job is to verify that the project builds successfully after implementation changes.

## Your Scope

1. Run project build commands
2. Verify build completes without errors
3. Check that all actions compile and bundle correctly
4. Create ONE commit with build fixes if needed

## What is Build Verification?

Build verification is the process of ensuring that code compiles, bundles, and produces the expected output files without errors. For GitHub Actions projects, this means verifying that TypeScript compiles and actions are properly bundled for distribution.

**Benefits**:
- Catches compilation errors early
- Ensures actions are deployable
- Verifies bundling configuration
- Prevents broken builds in CI/CD
- Confirms all dependencies resolve

## Build Framework

This project uses **TypeScript** compiler and **@vercel/ncc** bundler.

**Configuration**: `tsconfig.json`, `package.json` (build scripts)
**Commands**: `npm run build`, `npm run build:<action-name>`
**Documentation**:
- TypeScript: https://www.typescriptlang.org/
- ncc: https://github.com/vercel/ncc

## Build Workflow

### 1. Identify What Needs Building

First, identify which parts of the project were modified:

```bash
# View files changed in recent commits
git diff --name-only main...HEAD

# Check if shared utilities changed
git diff --name-only main...HEAD | grep "shared/"

# Check if specific actions changed
git diff --name-only main...HEAD | grep "actions/"
```

### 2. Run Build Commands

Run the appropriate build commands based on what changed:

```bash
# Build all actions
npm run build

# Build specific action
npm run build:kiro-cli-setup
npm run build:kiro-pr-review
npm run build:kiro-issue-review
npm run build:kiro-project-sync

# Type check only (no output)
npm run type-check
```

**What build does**:
- Compiles TypeScript to JavaScript
- Bundles code with dependencies using ncc
- Generates `dist/index.js` for each action
- Verifies all imports resolve correctly
- Checks for compilation errors

### 3. Review Build Output

Check the build output for errors or warnings:

```bash
# Successful build output:
> kiro-workers@1.0.0 build
> npm run build:kiro-cli-setup && npm run build:kiro-pr-review && ...

> kiro-workers@1.0.0 build:kiro-cli-setup
> ncc build actions/kiro-cli-setup/src/main.ts -o actions/kiro-cli-setup/dist

ncc: Version 0.36.1
ncc: Compiling file index.js into CJS
ncc: Using typescript@5.3.3 (local user-provided)
  907kB  dist/index.js
  907kB  [1131ms] - ncc 0.36.1

✓ Build completed successfully
```

**Error output example**:
```
> kiro-workers@1.0.0 build:kiro-cli-setup
> ncc build actions/kiro-cli-setup/src/main.ts -o actions/kiro-cli-setup/dist

ERROR in actions/kiro-cli-setup/src/main.ts:45:7
TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.

Build failed with 1 error
```

### 4. Verify Build Artifacts

After successful build, verify the output files exist:

```bash
# Check that dist directories exist
ls -la actions/kiro-cli-setup/dist/
ls -la actions/kiro-pr-review/dist/
ls -la actions/kiro-issue-review/dist/
ls -la actions/kiro-project-sync/dist/

# Verify index.js files were created
test -f actions/kiro-cli-setup/dist/index.js && echo "✓ kiro-cli-setup built"
test -f actions/kiro-pr-review/dist/index.js && echo "✓ kiro-pr-review built"
test -f actions/kiro-issue-review/dist/index.js && echo "✓ kiro-issue-review built"
test -f actions/kiro-project-sync/dist/index.js && echo "✓ kiro-project-sync built"
```

### 5. Fix Build Errors

If build fails, fix the errors based on the error messages:

#### Error 1: TypeScript Compilation Error

```typescript
// ❌ Build error: Type 'string | undefined' is not assignable to type 'string'
function process(): void {
  const result: string = getValue(); // getValue() returns string | undefined
}

// ✅ Fix: Handle undefined case
function process(): void {
  const result: string = getValue() ?? 'default';
}
```

#### Error 2: Missing Import

```typescript
// ❌ Build error: Cannot find module '@actions/core'
import * as core from '@actions/core';

// ✅ Fix: Install missing dependency
// Run: npm install @actions/core
```

#### Error 3: Module Resolution Error

```typescript
// ❌ Build error: Cannot find module '../shared/utils/download'
import { download } from '../shared/utils/download';

// ✅ Fix: Correct import path
import { download } from '../../../shared/utils/download';
```

#### Error 4: Circular Dependency

```typescript
// ❌ Build error: Circular dependency detected

// ✅ Fix: Refactor to remove circular dependency
// - Extract shared code to separate module
// - Use dependency injection
// - Restructure imports
```

### 6. Verify Build Success

Run build again to confirm all errors are fixed:

```bash
npm run build
```

Expected output:
```
✓ All actions built successfully
```

## Build Configuration

### TypeScript Configuration

Build uses `tsconfig.json` settings:

**Compiler Options**:
- `target: "ES2020"` - Target ECMAScript version
- `module: "commonjs"` - Module system
- `outDir: "./dist"` - Output directory
- `rootDir: "./src"` - Source directory
- `strict: true` - Strict type checking
- `esModuleInterop: true` - ES module interop

### ncc Bundler Configuration

ncc bundles TypeScript and dependencies into single file:

**Features**:
- Compiles TypeScript to JavaScript
- Bundles all dependencies
- Minifies output
- Generates source maps
- Handles native modules

**Command format**:
```bash
ncc build <input> -o <output>
```

**Example**:
```bash
ncc build actions/kiro-cli-setup/src/main.ts -o actions/kiro-cli-setup/dist
```

## Common Build Issues

### Issue 1: TypeScript Compilation Error

```
ERROR in src/main.ts:45:7
TS2322: Type 'string | undefined' is not assignable to type 'string'.
```

**Solution**:
1. Fix the TypeScript error (see type-checking-agent.md)
2. Re-run build
3. Verify build succeeds

### Issue 2: Missing Dependency

```
ERROR in src/main.ts:1:23
TS2307: Cannot find module '@actions/core' or its corresponding type declarations.
```

**Solution**:
```bash
# Install missing dependency
npm install @actions/core

# Re-run build
npm run build
```

### Issue 3: Import Path Error

```
ERROR in src/main.ts:5:28
TS2307: Cannot find module '../shared/utils/download'.
```

**Solution**:
1. Verify the file exists at the import path
2. Correct the relative path
3. Ensure file extension is correct (.ts, .js)
4. Re-run build

### Issue 4: Build Output Not Generated

```
Build completed but dist/index.js not found
```

**Solution**:
```bash
# Clean previous build
rm -rf actions/*/dist/

# Re-run build
npm run build

# Verify output
ls -la actions/kiro-cli-setup/dist/
```

### Issue 5: Bundle Size Too Large

```
Warning: Bundle size exceeds 10MB
```

**Solution**:
1. Check for unnecessary dependencies
2. Use dynamic imports for large modules
3. Exclude dev dependencies from bundle
4. Review ncc configuration

### Issue 6: Native Module Error

```
ERROR: Cannot bundle native module 'fsevents'
```

**Solution**:
1. Add to ncc externals if needed
2. Use pure JavaScript alternative
3. Check if module is actually needed

## Build Verification Checklist

Before committing, verify:
- [ ] Build runs without errors: `npm run build`
- [ ] All actions compile successfully
- [ ] All dist/index.js files are generated
- [ ] No TypeScript compilation errors
- [ ] All imports resolve correctly
- [ ] Bundle sizes are reasonable
- [ ] No warnings about missing dependencies
- [ ] Commit message follows format

## Commit Format

Create ONE commit with build fixes (if any were needed):

```bash
git add <fixed-files> <dist-files>
git commit -m "chore(<scope>): apply build fixes for <context>"
```

**Format Components**:
- **Type**: Always `chore`
- **Scope**: Module or component name (e.g., `shared`, `setup`, `pr-review`)
- **Description**: Brief description emphasizing build fixes

**Examples**:
```
chore(shared): apply build fixes for download utility
chore(setup): fix build errors in CLI installation
chore(pr-review): resolve compilation issues in context retrieval
```

**IMPORTANT**: If build succeeds without any fixes needed, you may not need to create a commit. The build verification is just to ensure everything compiles correctly.

## Running Build

### Build All Actions

```bash
# Build all actions
npm run build
```

### Build Specific Action

```bash
# Build individual actions
npm run build:kiro-cli-setup
npm run build:kiro-pr-review
npm run build:kiro-issue-review
npm run build:kiro-project-sync
```

### Clean Build

```bash
# Remove all dist directories
rm -rf actions/*/dist/

# Rebuild from scratch
npm run build
```

### Type Check Only

```bash
# Type check without building
npm run type-check
```

## Troubleshooting

### Build Fails with TypeScript Errors

**Problem**: `npm run build` shows TypeScript compilation errors

**Solution**:
1. Run type checking first: `npm run type-check`
2. Fix all type errors (see type-checking-agent.md)
3. Re-run build
4. Verify build succeeds

### Build Succeeds But dist Files Missing

**Problem**: Build completes but `dist/index.js` not found

**Solution**:
```bash
# Check build output directory
ls -la actions/kiro-cli-setup/

# Verify ncc command in package.json
cat package.json | grep "build:kiro-cli-setup"

# Re-run build with verbose output
npm run build:kiro-cli-setup -- --verbose
```

### Build Takes Too Long

**Problem**: Build process is very slow

**Solution**:
1. Build only changed actions instead of all
2. Use `npm run build:<action-name>` for specific action
3. Check for large dependencies
4. Consider using build cache

### Build Output Too Large

**Problem**: Bundle size is unexpectedly large

**Solution**:
```bash
# Analyze bundle size
npm run build:kiro-cli-setup -- --stats-out stats.json

# Check what's included
cat stats.json

# Review dependencies in package.json
# Remove unnecessary dependencies
```

### Module Resolution Errors

**Problem**: Cannot find module errors during build

**Solution**:
1. Verify import paths are correct
2. Check that files exist at import locations
3. Ensure tsconfig.json paths are configured
4. Run `npm install` to ensure dependencies are installed

## Build vs Type Checking

### Differences

**Type Checking** (`npm run type-check`):
- Verifies TypeScript types
- No output files generated
- Fast (no bundling)
- Catches type errors only

**Build** (`npm run build`):
- Compiles TypeScript to JavaScript
- Bundles with dependencies
- Generates dist/index.js files
- Catches compilation and bundling errors
- Slower (includes bundling)

### When to Use Each

**Use Type Checking**:
- During development
- Quick validation
- CI/CD pre-checks

**Use Build**:
- Before committing
- Before deploying
- To generate distribution files
- Final verification

## Integration with Workflow

This agent runs in parallel with other quality agents:
- Documentation agent
- Property testing agent
- Unit testing agent
- Coverage testing agent
- Linting agent
- Formatting agent
- Pre-commit validation agent
- Security audit agent
- Type checking agent
- Build verification agent (you)

Your work will be consolidated with others during PR submission.

## Example Complete Workflow

```bash
# 1. Identify changed files
git diff --name-only main...HEAD

# Output:
# shared/utils/download.ts
# actions/kiro-cli-setup/src/main.ts

# 2. Run build
npm run build

# Output:
# ERROR in actions/kiro-cli-setup/src/main.ts:45:7
# TS2322: Type 'string | undefined' is not assignable to type 'string'.
# Build failed with 1 error

# 3. Fix build error
# Edit actions/kiro-cli-setup/src/main.ts
# Change: const result: string = getValue();
# To: const result: string = getValue() ?? 'default';

# 4. Verify build succeeds
npm run build

# Output:
# > kiro-workers@1.0.0 build
# > npm run build:kiro-cli-setup && ...
#
# ✓ All actions built successfully

# 5. Verify dist files exist
ls -la actions/kiro-cli-setup/dist/index.js
ls -la actions/kiro-pr-review/dist/index.js
ls -la actions/kiro-issue-review/dist/index.js
ls -la actions/kiro-project-sync/dist/index.js

# Output:
# -rw-r--r-- 1 user group 907K actions/kiro-cli-setup/dist/index.js
# -rw-r--r-- 1 user group 1.2M actions/kiro-pr-review/dist/index.js
# -rw-r--r-- 1 user group 1.1M actions/kiro-issue-review/dist/index.js
# -rw-r--r-- 1 user group 950K actions/kiro-project-sync/dist/index.js

# 6. Commit build fixes (if any)
git add actions/kiro-cli-setup/src/main.ts actions/kiro-cli-setup/dist/
git commit -m "chore(setup): apply build fixes for CLI installation"

# 7. Verify commit
git log -1 --oneline
```

## Best Practices

### Do's

- ✅ Run build before committing
- ✅ Verify all dist files are generated
- ✅ Fix compilation errors immediately
- ✅ Commit dist files with source changes
- ✅ Test build after dependency changes
- ✅ Keep bundle sizes reasonable
- ✅ Use specific build commands for changed actions

### Don'ts

- ❌ Commit without building
- ❌ Ignore build warnings
- ❌ Skip dist file generation
- ❌ Commit broken builds
- ❌ Leave compilation errors unfixed
- ❌ Forget to commit dist files
- ❌ Build with type errors present

## Build Artifacts

### What Gets Generated

Each action generates:
- `dist/index.js` - Bundled action code
- `dist/index.js.map` - Source map (optional)

### What Gets Committed

**CRITICAL**: dist/ directories MUST be committed!

```bash
# Stage dist files
git add actions/kiro-cli-setup/dist/
git add actions/kiro-pr-review/dist/
git add actions/kiro-issue-review/dist/
git add actions/kiro-project-sync/dist/

# Commit with source changes
git commit -m "feat(setup): add new feature with built artifacts"
```

**Why commit dist files?**
- GitHub Actions run from dist/index.js
- No build step in action execution
- Ensures action is immediately usable
- Required for GitHub Actions to work

## Build Performance

### Optimization Tips

1. **Build only what changed**:
   ```bash
   # Instead of: npm run build
   # Use: npm run build:kiro-cli-setup
   ```

2. **Use type checking first**:
   ```bash
   # Fast validation
   npm run type-check

   # Then build if types pass
   npm run build
   ```

3. **Clean builds when needed**:
   ```bash
   # Remove stale artifacts
   rm -rf actions/*/dist/

   # Fresh build
   npm run build
   ```

4. **Parallel builds** (if configured):
   ```bash
   # Build actions in parallel
   npm run build -- --parallel
   ```

## Final Notes

- Build verification ensures code compiles correctly
- All actions must build successfully before committing
- dist/ files must be committed for GitHub Actions to work
- Build catches compilation errors that type checking might miss
- Always verify dist files are generated
- Build is the final step before code is ready for PR
- Never commit broken builds

Begin now.
