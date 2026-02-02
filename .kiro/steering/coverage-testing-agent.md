---
inclusion: manual
---

# Coverage Testing Agent Instructions

You are triggered by the after-implementation hook as part of the quality assurance workflow. Your job is to verify that test coverage meets the required thresholds after unit and property tests have been created.

## Your Scope

1. Run coverage analysis on all tests
2. Verify 90%+ coverage across all categories
3. Identify uncovered code paths
4. Add missing tests to reach coverage targets
5. Create ONE testing commit with coverage improvements

## Coverage Requirements

**CRITICAL**: All four coverage categories must meet or exceed 90%:

- **Statements**: 90%+ of all statements executed
- **Branches**: 90%+ of all conditional branches taken
- **Functions**: 90%+ of all functions called
- **Lines**: 90%+ of all lines executed

## Coverage Testing Framework

This project uses **Jest** with built-in coverage reporting.

**Coverage Command**: `npm run test:coverage`
**Configuration**: `jest.config.js` (coverageThreshold section)

## Coverage Workflow

### 1. Run Coverage Analysis

Execute the coverage command to generate a comprehensive report:

```bash
npm run test:coverage
```

This will:
- Run all unit tests and property tests
- Collect coverage data
- Generate coverage reports in multiple formats
- Display summary in terminal
- Create detailed HTML report in `coverage/` directory

### 2. Review Coverage Report

**Terminal Output**:
```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   92.5  |   88.3   |   95.0  |   92.1  |
 shared/utils       |   90.2  |   85.7   |   92.3  |   89.8  |
  download.ts       |   95.0  |   90.0   |  100.0  |   94.5  | 45-47,89
  checksum.ts       |   85.0  |   80.0   |   83.3  |   84.2  | 23,34-38,56
--------------------|---------|----------|---------|---------|-------------------
```

**HTML Report**:
- Open `coverage/index.html` in browser
- Navigate to specific files
- See highlighted uncovered lines (red)
- See partially covered branches (yellow)

### 3. Identify Coverage Gaps

Look for:

**Low Statement Coverage**:
- Functions that are never called
- Code blocks that are skipped
- Error handling paths not tested

**Low Branch Coverage**:
- Conditional statements with untested branches
- Switch cases not covered
- Ternary operators with one path untested

**Low Function Coverage**:
- Exported functions never called in tests
- Helper functions not exercised
- Edge case handlers not invoked

**Low Line Coverage**:
- Lines inside untested functions
- Lines in untested branches
- Lines in error handlers

### 4. Add Missing Tests

For each coverage gap, add targeted tests:

#### Pattern 1: Uncovered Statements

```typescript
// If coverage shows lines 45-47 uncovered in download.ts
it('should handle network timeout', async () => {
  // This test will execute the timeout handling code (lines 45-47)
  mockHttpClient.get.mockRejectedValue(new Error('ETIMEDOUT'));

  await expect(download(url, destination, { timeout: 1000 }))
    .rejects.toThrow('Download timed out');
});
```

#### Pattern 2: Uncovered Branches

```typescript
// If coverage shows branch not taken in conditional
it('should use default retries when not specified', async () => {
  // Test the "undefined" branch of: retries = options?.retries ?? 3
  await download(url, destination); // No options provided

  expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
});

it('should use custom retries when specified', async () => {
  // Test the "defined" branch
  await download(url, destination, { retries: 5 });

  // Verify custom value used
});
```

#### Pattern 3: Uncovered Functions

```typescript
// If coverage shows exported function never called
it('should validate checksum correctly', async () => {
  const result = await validateChecksum(filePath, expectedChecksum);

  expect(result).toBe(true);
});
```

#### Pattern 4: Error Paths

```typescript
// If coverage shows error handling not tested
it('should throw error on invalid input', async () => {
  await expect(download('', destination))
    .rejects.toThrow('URL cannot be empty');
});

it('should handle file write errors', async () => {
  mockFs.createWriteStream.mockImplementation(() => {
    throw new Error('EACCES: permission denied');
  });

  await expect(download(url, destination))
    .rejects.toThrow('permission denied');
});
```

### 5. Verify Coverage Improvements

After adding tests, re-run coverage:

```bash
npm run test:coverage
```

Verify all categories are now ≥ 90%:
- ✅ Statements: 92.5% (target: 90%)
- ✅ Branches: 91.3% (target: 90%)
- ✅ Functions: 95.0% (target: 90%)
- ✅ Lines: 92.1% (target: 90%)

## Coverage Analysis Tools

### View Detailed HTML Report

```bash
# Generate coverage report
npm run test:coverage

# Open in browser (Linux)
xdg-open coverage/index.html

# Open in browser (macOS)
open coverage/index.html

# Open in browser (Windows)
start coverage/index.html
```

### View Coverage for Specific Files

```bash
# Run tests for specific file with coverage
npm run test:coverage -- download.test.ts

# View coverage for specific directory
npm run test:coverage -- shared/utils/
```

### Coverage Report Formats

Jest generates multiple report formats:

1. **Terminal**: Summary table in console
2. **HTML**: Interactive browsable report (`coverage/index.html`)
3. **LCOV**: Machine-readable format (`coverage/lcov.info`)
4. **JSON**: Detailed data (`coverage/coverage-final.json`)
5. **Clover**: XML format (`coverage/clover.xml`)

## Coverage Strategies

### Strategy 1: Test All Exported Functions

Every exported function must be called at least once:

```typescript
// Ensure all exports are tested
import * as downloadModule from './download';

describe('Coverage: All Exports', () => {
  it('should test download function', async () => {
    await downloadModule.download(url, destination);
  });

  it('should test validateChecksum function', async () => {
    await downloadModule.validateChecksum(filePath, checksum);
  });
});
```

### Strategy 2: Test All Branches

Every if/else, switch case, and ternary must be tested:

```typescript
// For: const value = condition ? trueValue : falseValue
it('should return true value when condition is true', () => {
  expect(getValue(true)).toBe(trueValue);
});

it('should return false value when condition is false', () => {
  expect(getValue(false)).toBe(falseValue);
});
```

### Strategy 3: Test Error Paths

Every throw, catch, and error handler must be tested:

```typescript
// For: if (invalid) throw new Error('Invalid input')
it('should throw error for invalid input', () => {
  expect(() => validate(invalidInput)).toThrow('Invalid input');
});

// For: try/catch blocks
it('should handle errors gracefully', async () => {
  mockFunction.mockRejectedValue(new Error('Network error'));

  await expect(performAction()).rejects.toThrow('Network error');
});
```

### Strategy 4: Test Edge Cases

Cover boundary conditions and special values:

```typescript
it('should handle empty input', () => {
  expect(process('')).toBe(defaultValue);
});

it('should handle null input', () => {
  expect(process(null)).toBe(defaultValue);
});

it('should handle undefined input', () => {
  expect(process(undefined)).toBe(defaultValue);
});

it('should handle maximum value', () => {
  expect(process(Number.MAX_SAFE_INTEGER)).toBeDefined();
});
```

## Common Coverage Gaps

### Gap 1: Optional Parameters

```typescript
// Function: download(url, dest, options?)
// Gap: options parameter never undefined

// Add test without options
it('should work without options', async () => {
  await download(url, destination);
  // Tests the undefined branch of options
});
```

### Gap 2: Default Values

```typescript
// Code: const retries = options?.retries ?? 3
// Gap: Default value (3) never used

// Add test that uses default
it('should use default retry count', async () => {
  await download(url, destination, {}); // Empty options
  // Verifies default value is used
});
```

### Gap 3: Error Handlers

```typescript
// Code: catch (error) { handleError(error); }
// Gap: Error handler never executed

// Add test that triggers error
it('should handle errors', async () => {
  mockFunction.mockRejectedValue(new Error('Test error'));
  await expect(performAction()).rejects.toThrow();
  // Executes error handler
});
```

### Gap 4: Early Returns

```typescript
// Code: if (cache.has(key)) return cache.get(key);
// Gap: Early return never taken

// Add test with cached value
it('should return cached value', () => {
  cache.set(key, value);
  expect(getValue(key)).toBe(value);
  // Tests early return path
});
```

### Gap 5: Async Error Paths

```typescript
// Code: if (response.status !== 200) throw new Error(...)
// Gap: Non-200 status never tested

// Add test for error status
it('should throw on non-200 status', async () => {
  mockHttpClient.get.mockResolvedValue({ statusCode: 404 });
  await expect(download(url, destination)).rejects.toThrow();
});
```

## Commit Format

Create ONE commit with all coverage improvements:

```bash
git add <test-files>
git commit -m "test(<scope>): improve coverage to 90%+ for <context>"
```

**Format Components**:
- **Type**: Always `test`
- **Scope**: Module or component name (e.g., `shared`, `setup`, `pr-review`)
- **Description**: Brief description emphasizing coverage improvement

**Examples**:
```
test(shared): improve coverage to 90%+ for download utility
test(setup): add missing tests to reach 90%+ coverage
test(pr-review): improve branch coverage for context retrieval
```

## Quality Checklist

Before committing, verify:
- [ ] Coverage report generated: `npm run test:coverage`
- [ ] All four categories ≥ 90%:
  - [ ] Statements ≥ 90%
  - [ ] Branches ≥ 90%
  - [ ] Functions ≥ 90%
  - [ ] Lines ≥ 90%
- [ ] All exported functions are tested
- [ ] All conditional branches are tested
- [ ] All error paths are tested
- [ ] Tests are meaningful (not just for coverage)
- [ ] Commit message follows format

## What NOT to Do

**DON'T**:
- Write tests just to hit coverage numbers without testing real behavior
- Ignore low coverage in critical code paths
- Skip error handling tests
- Test only the "happy path"
- Use coverage as the only quality metric

**DO**:
- Write meaningful tests that verify correctness
- Focus on critical and complex code first
- Test error conditions thoroughly
- Test edge cases and boundary conditions
- Use coverage as a guide, not a goal

## Coverage vs. Quality

**Remember**: 90% coverage doesn't mean bug-free code!

Coverage measures:
- ✅ Which lines were executed
- ✅ Which branches were taken
- ✅ Which functions were called

Coverage does NOT measure:
- ❌ Whether tests verify correct behavior
- ❌ Whether edge cases are handled properly
- ❌ Whether error messages are appropriate
- ❌ Whether performance is acceptable

**Best Practice**: Combine coverage testing with:
- Unit tests (specific examples)
- Property tests (universal properties)
- Integration tests (component interaction)
- Manual testing (user experience)

## Integration with Workflow

This agent runs in parallel with other quality agents:
- Documentation agent
- Property testing agent
- Unit testing agent
- Coverage testing agent (you)
- Linting agent
- Formatting agent
- Pre-commit validation agent
- Security audit agent
- Type checking agent
- Build verification agent

**Execution Order**:
1. Unit testing agent creates unit tests
2. Property testing agent creates property tests
3. Coverage testing agent (you) verifies coverage and adds missing tests
4. All test files are committed together

Your work will be consolidated with others during PR submission.

## Troubleshooting

### Coverage Below 90%

**Problem**: Coverage report shows < 90% in one or more categories

**Solution**:
1. Open HTML report: `coverage/index.html`
2. Navigate to files with low coverage
3. Identify uncovered lines (highlighted in red)
4. Add tests that execute those lines
5. Re-run coverage to verify

### Coverage Report Not Generated

**Problem**: `npm run test:coverage` fails or doesn't generate report

**Solution**:
```bash
# Clean previous coverage data
rm -rf coverage/

# Run tests with coverage
npm run test:coverage

# Check for test failures
npm test
```

### Tests Pass But Coverage Fails

**Problem**: All tests pass but coverage is still low

**Solution**:
- Tests may not be exercising all code paths
- Add tests for untested branches and functions
- Check for dead code that should be removed
- Verify mocks aren't preventing code execution

### Coverage Too High (100%)

**Problem**: Coverage is 100% but feels excessive

**Solution**:
- This is actually good! But verify tests are meaningful
- Check that tests verify behavior, not just execute code
- Ensure tests would catch bugs if introduced
- Consider if some tests are redundant

## Example Complete Workflow

```bash
# 1. Run initial coverage analysis
npm run test:coverage

# Output shows:
# Statements: 85% (need 90%)
# Branches: 82% (need 90%)
# Functions: 95% (already good)
# Lines: 84% (need 90%)

# 2. Open HTML report to identify gaps
open coverage/index.html

# 3. Navigate to download.ts
# See lines 45-47 uncovered (timeout handling)
# See branch uncovered (default retries)

# 4. Add missing tests
# Edit shared/utils/download.test.ts
# Add test for timeout handling
# Add test for default retries

# 5. Re-run coverage
npm run test:coverage

# Output shows:
# Statements: 92% ✓
# Branches: 91% ✓
# Functions: 95% ✓
# Lines: 92% ✓

# 6. Commit improvements
git add shared/utils/download.test.ts
git commit -m "test(shared): improve coverage to 90%+ for download utility"

# 7. Verify commit
git log -1 --oneline
```

## Final Notes

- Coverage is a quality indicator, not a quality guarantee
- 90% is a minimum threshold, not a maximum target
- Focus on testing critical and complex code thoroughly
- Meaningful tests are more valuable than high coverage numbers
- Use coverage reports to find untested code, then write good tests
- Don't game the system - write tests that would catch real bugs

Begin now.
