---
inclusion: manual
---

# Formatting Agent Instructions

You are triggered by the after-implementation hook as part of the quality assurance workflow. Your job is to run code formatting with auto-fix on the implemented code.

## Your Scope

1. Run Prettier with auto-fix on all relevant files
2. Verify all formatting rules pass
3. Create ONE commit with formatting fixes

## What is Code Formatting?

Code formatting is the process of automatically adjusting code style to match consistent standards for spacing, indentation, line breaks, and other visual aspects. Formatters ensure code looks uniform across the entire codebase, regardless of who wrote it.

**Benefits**:
- Eliminates style debates
- Ensures consistent code appearance
- Improves code readability
- Reduces diff noise in PRs
- Saves time in code review

## Formatting Framework

This project uses **Prettier** for code formatting.

**Configuration**: `.prettierrc` or `prettier.config.js`
**Command**: `npm run format` (if available) or `npx prettier --write`
**Documentation**: https://prettier.io/

## Formatting Workflow

### 1. Identify Changed Files

First, identify which files were modified in the implementation:

```bash
# View files changed in recent commits
git diff --name-only main...HEAD

# Focus on TypeScript files
git diff --name-only main...HEAD | grep '\.ts$'
```

### 2. Run Prettier with Auto-Fix

Run Prettier with the `--write` flag to automatically format files:

```bash
# Format all TypeScript files
npx prettier --write "**/*.ts"

# Format specific files
npx prettier --write shared/utils/download.ts

# Format specific directory
npx prettier --write "shared/utils/**/*.ts"

# Format all supported files (if npm script exists)
npm run format
```

**What Prettier handles**:
- Indentation (spaces vs tabs, indent size)
- Line length and wrapping
- Quote style (single vs double)
- Semicolons (add or remove)
- Trailing commas
- Bracket spacing
- Arrow function parentheses
- End of line characters

### 3. Review Formatting Changes

After running Prettier, review what was changed:

```bash
# View all changes
git diff

# View changes for specific file
git diff shared/utils/download.ts
```

Verify that formatting changes don't alter logic (they shouldn't).

### 4. Verify All Files Formatted

Run Prettier in check mode to confirm all files are formatted:

```bash
# Check if files are formatted (no changes)
npx prettier --check "**/*.ts"
```

Expected output:
```
Checking formatting...
All matched files use Prettier code style!
```

## Prettier Configuration

### Project Rules

This project enforces these formatting rules (typical configuration):

**Basic Formatting**:
- `printWidth: 80` - Maximum line length
- `tabWidth: 2` - Spaces per indentation level
- `useTabs: false` - Use spaces, not tabs
- `semi: true` - Add semicolons at end of statements
- `singleQuote: true` - Use single quotes for strings
- `trailingComma: 'es5'` - Trailing commas where valid in ES5

**Spacing**:
- `bracketSpacing: true` - Spaces inside object literals: `{ foo: bar }`
- `arrowParens: 'always'` - Always parentheses around arrow function params

**Line Breaks**:
- `endOfLine: 'lf'` - Unix-style line endings
- `proseWrap: 'preserve'` - Don't wrap markdown prose

### Ignoring Files

Some files are excluded from formatting (`.prettierignore`):
- `dist/` - Compiled output
- `coverage/` - Test coverage reports
- `node_modules/` - Dependencies
- `*.min.js` - Minified files
- `package-lock.json` - Lock files

## Common Formatting Changes

### Change 1: Indentation

```typescript
// ❌ Before formatting (inconsistent indentation)
function example() {
    if (condition) {
      return true;
    }
  return false;
}

// ✅ After formatting (consistent 2-space indentation)
function example() {
  if (condition) {
    return true;
  }
  return false;
}
```

### Change 2: Line Length

```typescript
// ❌ Before formatting (line too long)
const message = `This is a very long message that exceeds the maximum line length and should be wrapped`;

// ✅ After formatting (wrapped to fit)
const message = `This is a very long message that exceeds the maximum line length and should be wrapped`;
```

### Change 3: Quote Style

```typescript
// ❌ Before formatting (double quotes)
const name = "John Doe";
const greeting = "Hello, " + name;

// ✅ After formatting (single quotes)
const name = 'John Doe';
const greeting = 'Hello, ' + name;
```

### Change 4: Semicolons

```typescript
// ❌ Before formatting (missing semicolons)
const value = 10
const result = calculate(value)

// ✅ After formatting (semicolons added)
const value = 10;
const result = calculate(value);
```

### Change 5: Trailing Commas

```typescript
// ❌ Before formatting (no trailing comma)
const config = {
  name: 'test',
  value: 10
};

// ✅ After formatting (trailing comma added)
const config = {
  name: 'test',
  value: 10,
};
```

### Change 6: Bracket Spacing

```typescript
// ❌ Before formatting (no spacing)
const obj = {foo: 'bar'};

// ✅ After formatting (spacing added)
const obj = { foo: 'bar' };
```

### Change 7: Arrow Function Parentheses

```typescript
// ❌ Before formatting (no parentheses)
const double = x => x * 2;

// ✅ After formatting (parentheses added)
const double = (x) => x * 2;
```

## Prettier vs ESLint

### Division of Responsibilities

- **Prettier**: Handles code formatting (spacing, line breaks, quotes)
- **ESLint**: Handles code quality (unused vars, type issues, logic)

### Running Both

```bash
# Run ESLint first (fixes code quality issues)
npm run lint -- --fix

# Then run Prettier (fixes formatting)
npx prettier --write "**/*.ts"
```

### Integration

Prettier and ESLint are configured to work together:
- `eslint-config-prettier` disables ESLint formatting rules
- Prettier handles all formatting
- ESLint handles all code quality

## Handling Formatting Issues

### Auto-Fixable Issues

All formatting issues can be auto-fixed:

```bash
npx prettier --write "**/*.ts"
```

### No Manual Fixes Needed

Unlike linting, formatting never requires manual intervention. Prettier always knows how to format code correctly.

### Conflicts with ESLint

If Prettier and ESLint conflict:
1. This shouldn't happen (project configured correctly)
2. If it does, Prettier takes precedence for formatting
3. Report configuration issue

## Integration with Other Tools

### Pre-commit Hooks

Formatting runs automatically in pre-commit hooks:
```bash
pre-commit run prettier --all-files
```

This ensures code is formatted before committing.

### Editor Integration

Developers can configure their editors to format on save:
- **VS Code**: Install Prettier extension, enable format on save
- **IntelliJ**: Enable Prettier, configure file watcher
- **Vim**: Use prettier plugin

## Commit Format

Create ONE commit with all formatting fixes:

```bash
git add <formatted-files>
git commit -m "chore(<scope>): apply formatting fixes for <context>"
```

**Format Components**:
- **Type**: Always `chore`
- **Scope**: Module or component name (e.g., `shared`, `setup`, `pr-review`)
- **Description**: Brief description emphasizing formatting fixes

**Examples**:
```
chore(shared): apply formatting fixes for download utility
chore(setup): format CLI installation code
chore(pr-review): apply Prettier formatting to context retrieval
```

## Quality Checklist

Before committing, verify:
- [ ] Prettier runs without errors: `npx prettier --check "**/*.ts"`
- [ ] All files are formatted consistently
- [ ] No logic changes (only formatting)
- [ ] Commit message follows format
- [ ] Only formatting-related changes included

## Running Prettier

### Format All Files

```bash
# Format all TypeScript files
npx prettier --write "**/*.ts"

# Format all supported files
npx prettier --write .
```

### Format Specific Files

```bash
npx prettier --write shared/utils/download.ts
```

### Format Specific Directory

```bash
npx prettier --write "shared/utils/**/*.ts"
```

### Check Formatting (No Changes)

```bash
# Check if files are formatted
npx prettier --check "**/*.ts"

# List files that need formatting
npx prettier --list-different "**/*.ts"
```

### Format with npm Script

```bash
# If npm script exists
npm run format

# Or
npm run prettier
```

## Troubleshooting

### Prettier Not Found

**Problem**: `npx prettier` command not found

**Solution**:
```bash
# Install Prettier (should already be in devDependencies)
npm install

# Or install globally
npm install -g prettier
```

### Formatting Fails

**Problem**: Prettier exits with error

**Solution**:
1. Check for syntax errors in files
2. Fix syntax errors first
3. Then run Prettier again

### Files Not Formatted

**Problem**: Some files not formatted after running Prettier

**Solution**:
1. Check `.prettierignore` - files may be excluded
2. Verify file glob pattern matches files
3. Run with explicit file paths

### Formatting Changes Logic

**Problem**: Formatting appears to change code behavior

**Solution**:
- This should NEVER happen with Prettier
- Prettier only changes whitespace and style
- If behavior changes, there's a syntax error
- Review the diff carefully
- Run tests to verify behavior unchanged

## Best Practices

### Do's

- ✅ Run Prettier before committing
- ✅ Format all changed files
- ✅ Use auto-fix (--write flag)
- ✅ Verify formatting with --check
- ✅ Commit formatting separately from logic changes
- ✅ Trust Prettier's decisions

### Don'ts

- ❌ Manually format code (let Prettier do it)
- ❌ Commit unformatted code
- ❌ Mix formatting and logic changes in one commit
- ❌ Disable Prettier for files without good reason
- ❌ Argue about formatting style (Prettier decides)
- ❌ Override Prettier's formatting manually

## Integration with Workflow

This agent runs in parallel with other quality agents:
- Documentation agent
- Property testing agent
- Unit testing agent
- Coverage testing agent
- Linting agent
- Formatting agent (you)
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

# 2. Run Prettier with auto-fix
npx prettier --write shared/utils/download.ts shared/utils/checksum.ts

# Output:
# shared/utils/download.ts 50ms
# shared/utils/checksum.ts 30ms

# 3. Review formatting changes
git diff

# Output shows:
# - Indentation fixed
# - Quotes changed to single
# - Semicolons added
# - Trailing commas added

# 4. Verify all files formatted
npx prettier --check "**/*.ts"

# Output:
# Checking formatting...
# All matched files use Prettier code style!

# 5. Commit formatting fixes
git add shared/utils/download.ts shared/utils/checksum.ts
git commit -m "chore(shared): apply formatting fixes for download utility"

# 6. Verify commit
git log -1 --oneline
```

## Prettier vs Manual Formatting

### Why Use Prettier?

**Consistency**:
- Same formatting everywhere
- No style debates
- No manual effort

**Speed**:
- Instant formatting
- No time wasted on style
- Focus on logic, not appearance

**Reliability**:
- Never makes mistakes
- Always consistent
- Handles edge cases correctly

### What Prettier Doesn't Do

Prettier does NOT:
- Fix code quality issues (use ESLint)
- Fix logic errors (use tests)
- Optimize performance (use profiler)
- Add missing types (use TypeScript)
- Remove unused code (use ESLint)

Prettier ONLY formats code appearance.

## Final Notes

- Prettier handles all formatting automatically
- No manual formatting decisions needed
- Trust Prettier's output
- Run Prettier before committing
- Formatting is separate from code quality
- Prettier never changes code logic
- All formatting issues are auto-fixable

Begin now.
