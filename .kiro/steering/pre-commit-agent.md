---
inclusion: manual
---

# Pre-commit Validation Agent Instructions

You are triggered by the after-implementation hook as part of the quality assurance workflow. Your job is to run all pre-commit hooks to validate the implemented code before it's committed.

## Your Scope

1. Run all pre-commit hooks on relevant files
2. Fix any auto-fixable issues
3. Verify all hooks pass
4. Create ONE commit with pre-commit validation fixes

## What is Pre-commit Validation?

Pre-commit validation is a comprehensive quality gate that runs multiple checks before code is committed. It combines linting, formatting, type checking, and other validations into a single automated workflow. Pre-commit hooks ensure code meets all quality standards before entering the repository.

**Benefits**:
- Catches issues before they reach CI/CD
- Enforces consistent quality standards
- Prevents broken code from being committed
- Combines multiple tools into one workflow
- Reduces CI/CD failures

## Pre-commit Framework

This project uses the **pre-commit** framework to manage hooks.

**Configuration**: `.pre-commit-config.yaml`
**Command**: `pre-commit run --all-files`
**Documentation**: https://pre-commit.com/

## Pre-commit Workflow

### 1. Identify Changed Files

First, identify which files were modified in the implementation:

```bash
# View files changed in recent commits
git diff --name-only main...HEAD

# Focus on TypeScript files
git diff --name-only main...HEAD | grep '\.ts$'
```

### 2. Run All Pre-commit Hooks

Run all pre-commit hooks on all files:

```bash
# Run all hooks on all files
pre-commit run --all-files

# Run all hooks on specific files
pre-commit run --files shared/utils/download.ts

# Run specific hook on all files
pre-commit run prettier --all-files
pre-commit run eslint --all-files
```

**What pre-commit runs**:
- Prettier (code formatting)
- ESLint (code quality and linting)
- TypeScript type checking
- Trailing whitespace removal
- End-of-file fixer
- YAML/JSON syntax validation
- Merge conflict detection
- Large file detection

### 3. Review Pre-commit Changes

After running pre-commit, review what was changed:

```bash
# View all changes
git diff

# View changes for specific file
git diff shared/utils/download.ts
```

Verify that auto-fixes are correct and don't change logic.

### 4. Fix Remaining Issues Manually

Some pre-commit issues require manual intervention:

```bash
# Run pre-commit again to see remaining issues
pre-commit run --all-files
```

**Common manual fixes**:

#### Type Errors
```typescript
// ❌ Pre-commit error: Type 'string | undefined' is not assignable to type 'string'
function process(value: string): void {
  const result: string = getValue(); // getValue() returns string | undefined
}

// ✅ Fix: Handle undefined case
function process(value: string): void {
  const result: string = getValue() ?? 'default';
}
```

#### Missing Exports
```typescript
// ❌ Pre-commit error: 'functionName' is declared but never used
function functionName(): void {
  // Implementation
}

// ✅ Fix: Export if needed, or remove if unused
export function functionName(): void {
  // Implementation
}
```

#### Import Order
```typescript
// ❌ Pre-commit error: Imports not sorted
import { z } from 'zod';
import * as core from '@actions/core';
import { a } from './local';

// ✅ Fix: Sort imports (external, then local)
import * as core from '@actions/core';
import { z } from 'zod';
import { a } from './local';
```

### 5. Verify All Hooks Pass

Run pre-commit again to confirm all hooks pass:

```bash
pre-commit run --all-files
```

Expected output:
```
Prettier..........................Passed
ESLint............................Passed
TypeScript Type Check.............Passed
Trailing Whitespace...............Passed
End of File Fixer.................Passed
Check YAML........................Passed
Check JSON........................Passed
Detect Merge Conflicts............Passed
Check for Large Files.............Passed
```

## Pre-commit Configuration

### Project Hooks

This project runs these pre-commit hooks (typical configuration):

**Formatting Hooks**:
- `prettier` - Code formatting (TypeScript, JSON, YAML, Markdown)
- `trailing-whitespace` - Remove trailing whitespace
- `end-of-file-fixer` - Ensure files end with newline

**Code Quality Hooks**:
- `eslint` - Linting and code quality checks
- `tsc` - TypeScript type checking

**Syntax Validation Hooks**:
- `check-yaml` - Validate YAML syntax
- `check-json` - Validate JSON syntax
- `check-merge-conflict` - Detect merge conflict markers

**Safety Hooks**:
- `check-added-large-files` - Prevent committing large files
- `detect-private-key` - Detect accidentally committed private keys

### Hook Execution Order

Pre-commit runs hooks in the order defined in `.pre-commit-config.yaml`:
1. Formatting hooks (Prettier, whitespace)
2. Linting hooks (ESLint)
3. Type checking hooks (TypeScript)
4. Validation hooks (YAML, JSON)
5. Safety hooks (large files, private keys)

## Common Pre-commit Issues

### Issue 1: Prettier Formatting

```typescript
// ❌ Pre-commit error: File not formatted with Prettier
const obj={foo:'bar',baz:'qux'};

// ✅ Fix: Prettier auto-fixes this
const obj = { foo: 'bar', baz: 'qux' };
```

### Issue 2: ESLint Violations

```typescript
// ❌ Pre-commit error: 'unusedVar' is defined but never used
const unusedVar = 5;
const result = calculate();

// ✅ Fix: Remove unused variable
const result = calculate();
```

### Issue 3: TypeScript Type Errors

```typescript
// ❌ Pre-commit error: Type 'number' is not assignable to type 'string'
const value: string = 42;

// ✅ Fix: Use correct type
const value: number = 42;
```

### Issue 4: Trailing Whitespace

```typescript
// ❌ Pre-commit error: Trailing whitespace found
const value = 10;

// ✅ Fix: Remove trailing spaces (auto-fixed)
const value = 10;
```

### Issue 5: Missing End-of-File Newline

```typescript
// ❌ Pre-commit error: No newline at end of file
export function example(): void {
  // Implementation
}
// ✅ Fix: Add newline at end (auto-fixed)
export function example(): void {
  // Implementation
}

```

### Issue 6: YAML/JSON Syntax Errors

```yaml
# ❌ Pre-commit error: Invalid YAML syntax
name: Test
  value: 123

# ✅ Fix: Correct indentation
name: Test
value: 123
```

## Handling Pre-commit Errors

### Auto-Fixable Errors

Many pre-commit issues can be auto-fixed:

```bash
# Run pre-commit with auto-fix
pre-commit run --all-files

# Pre-commit will automatically fix:
# - Prettier formatting
# - Trailing whitespace
# - End-of-file newlines
# - Some ESLint issues
```

### Manual Fixes Required

Some errors require understanding the code:

1. **Type errors**: Add proper TypeScript types
2. **Logic errors**: Fix code to match types
3. **Import issues**: Organize imports correctly
4. **Unused code**: Remove or export as needed

### Skipping Hooks (Use Sparingly)

In rare cases, you may need to skip a hook:

```bash
# Skip specific hook
SKIP=eslint pre-commit run --all-files

# Skip all hooks (NEVER do this in production)
git commit --no-verify
```

**IMPORTANT**: Only skip hooks when absolutely necessary and document why.

## Integration with Other Tools

### Relationship to Other Agents

Pre-commit validation runs AFTER other quality agents:
- **Linting agent**: Runs ESLint
- **Formatting agent**: Runs Prettier
- **Type checking agent**: Runs TypeScript compiler
- **Pre-commit agent (you)**: Runs ALL of the above together

Pre-commit validation is the final quality gate that ensures all previous agents' work is correct.

### CI/CD Integration

Pre-commit hooks also run in CI/CD:
```yaml
# .github/workflows/ci.yml
- name: Run pre-commit
  run: pre-commit run --all-files
```

This ensures the same checks run locally and in CI/CD.

## Commit Format

Create ONE commit with all pre-commit validation fixes:

```bash
git add <fixed-files>
git commit -m "chore(<scope>): apply pre-commit validation fixes for <context>"
```

**Format Components**:
- **Type**: Always `chore`
- **Scope**: Module or component name (e.g., `shared`, `setup`, `pr-review`)
- **Description**: Brief description emphasizing pre-commit validation

**Examples**:
```
chore(shared): apply pre-commit validation fixes for download utility
chore(setup): fix pre-commit hook violations in CLI installation
chore(pr-review): resolve pre-commit validation issues
```

## Quality Checklist

Before committing, verify:
- [ ] Pre-commit runs without errors: `pre-commit run --all-files`
- [ ] All hooks pass (Prettier, ESLint, TypeScript, etc.)
- [ ] Auto-fixable issues have been fixed
- [ ] Manual fixes are correct and don't change logic
- [ ] No hooks were skipped unnecessarily
- [ ] Commit message follows format
- [ ] Only pre-commit-related changes included

## Running Pre-commit

### Run All Hooks on All Files

```bash
pre-commit run --all-files
```

### Run All Hooks on Specific Files

```bash
pre-commit run --files shared/utils/download.ts shared/utils/checksum.ts
```

### Run Specific Hook on All Files

```bash
# Run only Prettier
pre-commit run prettier --all-files

# Run only ESLint
pre-commit run eslint --all-files

# Run only TypeScript
pre-commit run tsc --all-files
```

### Run Hooks on Staged Files Only

```bash
# Run on files staged for commit
pre-commit run
```

### Install Pre-commit Hooks

```bash
# Install hooks to run automatically on git commit
pre-commit install

# Install hooks for commit messages
pre-commit install --hook-type commit-msg
```

## Troubleshooting

### Pre-commit Not Found

**Problem**: `pre-commit` command not found

**Solution**:
```bash
# Install pre-commit (should already be installed)
pip install pre-commit

# Or use system package manager
brew install pre-commit  # macOS
apt install pre-commit   # Ubuntu/Debian
```

### Hooks Fail with Errors

**Problem**: `pre-commit run --all-files` shows errors

**Solution**:
1. Read error messages carefully
2. Fix issues based on error type (formatting, linting, types)
3. Re-run pre-commit to verify
4. If stuck, run individual hooks to isolate issue

### Hooks Take Too Long

**Problem**: Pre-commit runs very slowly

**Solution**:
1. Run on specific files instead of all files
2. Use `--files` flag to limit scope
3. Check if hooks are configured efficiently
4. Consider running only changed files

### Hooks Modify Files

**Problem**: Pre-commit changes files unexpectedly

**Solution**:
1. Review the diff: `git diff`
2. Verify changes are correct (formatting, whitespace)
3. If incorrect, revert and fix manually
4. Re-run pre-commit to verify

### Hook Configuration Issues

**Problem**: Pre-commit can't find hook configuration

**Solution**:
```bash
# Update pre-commit hooks
pre-commit autoupdate

# Clean and reinstall hooks
pre-commit clean
pre-commit install
```

## Best Practices

### Do's

- ✅ Run pre-commit before committing
- ✅ Fix all pre-commit issues
- ✅ Use auto-fix when available
- ✅ Install pre-commit hooks locally
- ✅ Keep hooks up to date
- ✅ Run on all files for comprehensive check

### Don'ts

- ❌ Skip pre-commit hooks without good reason
- ❌ Commit code with pre-commit failures
- ❌ Disable hooks permanently
- ❌ Ignore pre-commit warnings
- ❌ Use `--no-verify` to bypass hooks
- ❌ Commit without running pre-commit

## Integration with Workflow

This agent runs in parallel with other quality agents:
- Documentation agent
- Property testing agent
- Unit testing agent
- Coverage testing agent
- Linting agent
- Formatting agent
- Pre-commit validation agent (you)
- Security audit agent
- Type checking agent
- Build verification agent

**Special Role**: Pre-commit validation is the final quality gate that verifies all other agents' work is correct and complete.

Your work will be consolidated with others during PR submission.

## Example Complete Workflow

```bash
# 1. Identify changed files
git diff --name-only main...HEAD | grep '\.ts$'

# Output:
# shared/utils/download.ts
# shared/utils/checksum.ts

# 2. Run all pre-commit hooks
pre-commit run --all-files

# Output:
# Prettier..........................Failed
# - hook id: prettier
# - files were modified by this hook
#
# ESLint............................Failed
# - hook id: eslint
# - exit code: 1
#
# TypeScript Type Check.............Passed
# Trailing Whitespace...............Passed
# End of File Fixer.................Passed

# 3. Review changes from auto-fixes
git diff

# Output shows:
# - Prettier formatted files
# - Trailing whitespace removed
# - End-of-file newlines added

# 4. Fix remaining ESLint issues manually
# Edit files to fix linting errors

# 5. Run pre-commit again
pre-commit run --all-files

# Output:
# Prettier..........................Passed
# ESLint............................Passed
# TypeScript Type Check.............Passed
# Trailing Whitespace...............Passed
# End of File Fixer.................Passed
# Check YAML........................Passed
# Check JSON........................Passed
# Detect Merge Conflicts............Passed
# Check for Large Files.............Passed

# 6. Commit pre-commit validation fixes
git add shared/utils/download.ts shared/utils/checksum.ts
git commit -m "chore(shared): apply pre-commit validation fixes for download utility"

# 7. Verify commit
git log -1 --oneline
```

## Pre-commit vs Individual Tools

### Why Use Pre-commit?

**Comprehensive**:
- Runs all quality checks together
- Single command for all validations
- Consistent across team

**Automated**:
- Runs automatically on commit (if installed)
- Catches issues before CI/CD
- Reduces manual work

**Standardized**:
- Same checks for everyone
- Configured once, used everywhere
- Easy to update and maintain

### What Pre-commit Doesn't Do

Pre-commit does NOT:
- Run tests (use test agents)
- Check code coverage (use coverage agent)
- Perform security audits (use security agent)
- Build the project (use build agent)

Pre-commit focuses on code quality and formatting validation.

## Advanced Usage

### Running Specific Hooks

```bash
# Run only formatting hooks
pre-commit run prettier --all-files
pre-commit run trailing-whitespace --all-files
pre-commit run end-of-file-fixer --all-files

# Run only linting hooks
pre-commit run eslint --all-files

# Run only type checking
pre-commit run tsc --all-files
```

### Updating Hooks

```bash
# Update all hooks to latest versions
pre-commit autoupdate

# Update specific hook
pre-commit autoupdate --repo https://github.com/pre-commit/pre-commit-hooks
```

### Debugging Hooks

```bash
# Run with verbose output
pre-commit run --all-files --verbose

# Run with color output
pre-commit run --all-files --color=always

# Show hook configuration
pre-commit run --all-files --show-diff-on-failure
```

## Final Notes

- Pre-commit validation is the final quality gate
- It combines multiple tools into one workflow
- All hooks must pass before committing
- Auto-fixes handle most issues automatically
- Manual fixes required for logic and type issues
- Pre-commit ensures code quality before CI/CD
- Install hooks locally for automatic validation
- Never skip pre-commit without good reason

Begin now.
