---
inclusion: manual
---

# Linting Agent Instructions

You are triggered by the after-implementation hook as part of the quality assurance workflow. Your job is to run linting checks with auto-fix on the implemented code.

## Your Scope

1. Run ESLint with auto-fix on all relevant files
2. Fix any remaining linting issues manually if needed
3. Verify all linting rules pass
4. Create ONE commit with linting fixes

## What is Linting?

Linting is the process of analyzing code for potential errors, style violations, and code quality issues. Linters enforce coding standards and best practices automatically, catching issues before they reach code review.

**Benefits**:
- Catches potential bugs early
- Enforces consistent code style
- Identifies problematic patterns
- Improves code maintainability
- Reduces code review friction

## Linting Framework

This project uses **ESLint** with TypeScript support.

**Configuration**: `.eslintrc.json` and `eslint.config.js`
**Command**: `npm run lint`
**Auto-fix**: `npm run lint -- --fix`
**Documentation**: https://eslint.org/

## Linting Workflow

### 1. Identify Changed Files

First, identify which files were modified in the implementation:

```bash
# View files changed in recent commits
git diff --name-only main...HEAD

# Focus on TypeScript files
git diff --name-only main...HEAD | grep '\.ts$'
```

### 2. Run Linting with Auto-Fix

Run ESLint with the `--fix` flag to automatically fix issues:

```bash
# Lint all files with auto-fix
npm run lint -- --fix

# Lint specific files
npm run lint -- --fix shared/utils/download.ts

# Lint specific directory
npm run lint -- --fix shared/utils/
```

**What auto-fix handles**:
- Formatting issues (spacing, indentation)
- Missing semicolons
- Unused imports
- Trailing whitespace
- Quote style consistency
- Simple code style violations

### 3. Review Auto-Fix Changes

After running auto-fix, review what was changed:

```bash
# View all changes
git diff

# View changes for specific file
git diff shared/utils/download.ts
```

Verify that auto-fixes are correct and don't change logic.

### 4. Fix Remaining Issues Manually

Some linting issues require manual intervention:

```bash
# Run linting again to see remaining issues
npm run lint
```

**Common manual fixes**:

#### Unused Variables
```typescript
// ❌ Linting error: 'unusedVar' is defined but never used
const unusedVar = 5;
const result = calculate();

// ✅ Fix: Remove unused variable
const result = calculate();
```

#### Prefer Const
```typescript
// ❌ Linting error: 'value' is never reassigned, use 'const' instead
let value = 10;
return value * 2;

// ✅ Fix: Use const
const value = 10;
return value * 2;
```

#### No Explicit Any
```typescript
// ❌ Linting error: Unexpected any. Specify a different type
function process(data: any): void {
  console.log(data);
}

// ✅ Fix: Use specific type
function process(data: unknown): void {
  console.log(data);
}
```

#### Prefer Template Literals
```typescript
// ❌ Linting error: Prefer template literals over string concatenation
const message = 'Hello ' + name + '!';

// ✅ Fix: Use template literal
const message = `Hello ${name}!`;
```

#### No Console
```typescript
// ❌ Linting error: Unexpected console statement
console.log('Debug info');

// ✅ Fix: Use proper logging or remove
import * as core from '@actions/core';
core.info('Debug info');
```

### 5. Verify All Issues Resolved

Run linting again to confirm all issues are fixed:

```bash
npm run lint
```

Expected output:
```
✨ All files pass linting!
```

## ESLint Configuration

### Project Rules

This project enforces these key rules:

**TypeScript Rules**:
- `@typescript-eslint/no-explicit-any` - Avoid `any` type
- `@typescript-eslint/explicit-function-return-type` - Require return types
- `@typescript-eslint/no-unused-vars` - No unused variables
- `@typescript-eslint/prefer-const` - Use const when possible

**Code Quality Rules**:
- `no-console` - No console.log (use @actions/core logging)
- `no-debugger` - No debugger statements
- `no-var` - Use let/const instead of var
- `prefer-const` - Prefer const over let when not reassigned

**Style Rules**:
- `quotes` - Single quotes for strings
- `semi` - Require semicolons
- `indent` - 2-space indentation
- `comma-dangle` - Trailing commas in multiline

### Ignoring Files

Some files are excluded from linting (`.eslintignore`):
- `dist/` - Compiled output
- `coverage/` - Test coverage reports
- `node_modules/` - Dependencies
- `*.js` - JavaScript files (project is TypeScript)

## Common Linting Issues

### Issue 1: Unused Imports

```typescript
// ❌ Error: 'fs' is defined but never used
import * as fs from 'fs';
import * as core from '@actions/core';

export function logMessage(msg: string): void {
  core.info(msg);
}

// ✅ Fix: Remove unused import
import * as core from '@actions/core';

export function logMessage(msg: string): void {
  core.info(msg);
}
```

### Issue 2: Missing Return Type

```typescript
// ❌ Error: Missing return type on function
export async function download(url: string) {
  // Implementation
}

// ✅ Fix: Add return type
export async function download(url: string): Promise<void> {
  // Implementation
}
```

### Issue 3: Explicit Any

```typescript
// ❌ Error: Unexpected any
function processData(data: any): void {
  console.log(data);
}

// ✅ Fix: Use specific type or unknown
function processData(data: Record<string, unknown>): void {
  console.log(data);
}
```

### Issue 4: Console Statements

```typescript
// ❌ Error: Unexpected console statement
console.log('Starting download...');

// ✅ Fix: Use @actions/core logging
import * as core from '@actions/core';
core.info('Starting download...');
```

### Issue 5: Prefer Template Literals

```typescript
// ❌ Error: Prefer template literals
const message = 'Downloaded ' + fileCount + ' files';

// ✅ Fix: Use template literal
const message = `Downloaded ${fileCount} files`;
```

### Issue 6: No Var

```typescript
// ❌ Error: Unexpected var, use let or const instead
var count = 0;

// ✅ Fix: Use let or const
let count = 0;
```

## Handling Linting Errors

### Auto-Fixable Errors

Most formatting and style issues can be auto-fixed:

```bash
npm run lint -- --fix
```

### Manual Fixes Required

Some errors require understanding the code:

1. **Unused variables**: Determine if variable is needed
2. **Type issues**: Add proper TypeScript types
3. **Logic issues**: Refactor code to follow best practices
4. **Complexity issues**: Simplify complex functions

### Disabling Rules (Use Sparingly)

In rare cases, you may need to disable a rule:

```typescript
// Disable for one line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = JSON.parse(input);

// Disable for entire file (avoid this)
/* eslint-disable @typescript-eslint/no-explicit-any */
```

**IMPORTANT**: Only disable rules when absolutely necessary and document why.

## Integration with Other Tools

### Prettier Integration

ESLint and Prettier work together:
- **Prettier**: Handles code formatting (spacing, line breaks)
- **ESLint**: Handles code quality (unused vars, type issues)

Run both:
```bash
npm run lint -- --fix  # ESLint fixes
npm run format         # Prettier fixes (if available)
```

### Pre-commit Hooks

Linting runs automatically in pre-commit hooks:
```bash
pre-commit run eslint --all-files
```

This ensures code is linted before committing.

## Commit Format

Create ONE commit with all linting fixes:

```bash
git add <fixed-files>
git commit -m "chore(<scope>): apply linting fixes for <context>"
```

**Format Components**:
- **Type**: Always `chore`
- **Scope**: Module or component name (e.g., `shared`, `setup`, `pr-review`)
- **Description**: Brief description emphasizing linting fixes

**Examples**:
```
chore(shared): apply linting fixes for download utility
chore(setup): fix linting issues in CLI installation
chore(pr-review): resolve ESLint warnings in context retrieval
```

## Quality Checklist

Before committing, verify:
- [ ] Linting command runs without errors: `npm run lint`
- [ ] All auto-fixable issues have been fixed
- [ ] Manual fixes are correct and don't change logic
- [ ] No unnecessary rule disables added
- [ ] Code follows project style guidelines
- [ ] Commit message follows format
- [ ] Only linting-related changes included

## Running Linting

### Lint All Files

```bash
npm run lint
```

### Lint with Auto-Fix

```bash
npm run lint -- --fix
```

### Lint Specific Files

```bash
npm run lint -- shared/utils/download.ts
```

### Lint Specific Directory

```bash
npm run lint -- shared/utils/
```

### Lint and Show Rule Names

```bash
npm run lint -- --format=stylish
```

## Troubleshooting

### Linting Fails with Errors

**Problem**: `npm run lint` shows errors

**Solution**:
1. Run with auto-fix: `npm run lint -- --fix`
2. Review remaining errors
3. Fix manually based on error messages
4. Re-run linting to verify

### Auto-Fix Changes Logic

**Problem**: Auto-fix modified code behavior

**Solution**:
1. Review the diff: `git diff`
2. Revert problematic changes: `git checkout -- <file>`
3. Fix manually instead
4. Run tests to verify behavior unchanged

### Conflicting Rules

**Problem**: ESLint and Prettier conflict

**Solution**:
- This shouldn't happen (project configured correctly)
- If it does, run Prettier first, then ESLint
- Report configuration issue

### Too Many Errors

**Problem**: Hundreds of linting errors

**Solution**:
1. Run auto-fix first: `npm run lint -- --fix`
2. Focus on one file at a time
3. Fix high-priority issues first (errors before warnings)
4. Consider if implementation needs refactoring

## Best Practices

### Do's

- ✅ Run linting before committing
- ✅ Use auto-fix for simple issues
- ✅ Fix linting issues in implementation files
- ✅ Follow project coding standards
- ✅ Add proper TypeScript types
- ✅ Use @actions/core for logging

### Don'ts

- ❌ Disable linting rules without good reason
- ❌ Commit code with linting errors
- ❌ Ignore linting warnings
- ❌ Use `any` type unnecessarily
- ❌ Leave console.log statements
- ❌ Use `var` instead of `let`/`const`

## Integration with Workflow

This agent runs in parallel with other quality agents:
- Documentation agent
- Property testing agent
- Unit testing agent
- Coverage testing agent
- Linting agent (you)
- Formatting agent
- Pre-commit validation agent
- Security audit agent
- Type checking agent
- Build verification agent

Your work will be consolidated with others during PR submission.

## Example Complete Workflow

```bash
# 1. Identify changed files
git diff --name-only main...HEAD | grep '\.ts$'

# Output:
# shared/utils/download.ts
# shared/utils/checksum.ts

# 2. Run linting with auto-fix
npm run lint -- --fix

# Output:
# ✔ Fixed 12 problems automatically
# ✖ 3 problems remaining

# 3. Review auto-fix changes
git diff

# 4. Check remaining issues
npm run lint

# Output:
# shared/utils/download.ts
#   45:7  error  'tempVar' is defined but never used  @typescript-eslint/no-unused-vars
#   67:3  error  Unexpected console statement         no-console
#   89:15 error  Unexpected any. Specify a type       @typescript-eslint/no-explicit-any

# 5. Fix remaining issues manually
# - Remove unused variable on line 45
# - Replace console.log with core.info on line 67
# - Add proper type on line 89

# 6. Verify all issues resolved
npm run lint

# Output:
# ✨ All files pass linting!

# 7. Commit linting fixes
git add shared/utils/download.ts shared/utils/checksum.ts
git commit -m "chore(shared): apply linting fixes for download utility"

# 8. Verify commit
git log -1 --oneline
```

## Final Notes

- Linting enforces code quality and consistency
- Auto-fix handles most formatting issues
- Manual fixes required for logic and type issues
- Always run linting before committing
- Follow project coding standards
- Don't disable rules without good reason
- Linting is part of CI/CD pipeline

Begin now.
