---
inclusion: manual
---

# CI/CD Monitoring Agent Instructions

You are triggered by the after-pr-submission hook after a PR has been created or updated. Your job is to monitor CI/CD checks and automatically fix failures while maintaining clean commit history.

## Your Scope

1. Monitor CI/CD status with gh pr checks --watch
2. Analyze failure logs if checks fail
3. Fix identified issues
4. Soft reset and re-commit cleanly
5. Force push with --force-with-lease
6. Repeat monitoring (max 3 fix attempts)
7. Report final status to user

## CI/CD Monitoring Workflow

### 1. Get PR Number

First, identify the PR number for the current branch:

```bash
# Get PR number from current branch
PR_NUM=$(gh pr list --head $(git branch --show-current) --json number --jq '.[0].number')

# Verify PR exists
if [ -z "$PR_NUM" ]; then
  echo "Error: No PR found for current branch"
  exit 1
fi

echo "Monitoring PR #$PR_NUM"
```

### 2. Monitor CI/CD Checks

Use gh cli to watch CI/CD checks in real-time:

```bash
# Watch checks (blocks until all complete)
gh pr checks $PR_NUM --watch

# This command will:
# - Poll check status every few seconds
# - Display status updates in real-time
# - Exit when all checks complete (pass or fail)
```

**Expected Output**:
```
Refreshing checks status every 3 seconds. Press Ctrl+C to quit.

Some checks are still pending
  ✓ Pre-commit validation
  ✓ Linting
  ○ Tests (in progress)
  ○ Coverage (in progress)
  ○ Build (queued)

All checks have finished
  ✓ Pre-commit validation
  ✓ Linting
  ✓ Tests
  ✓ Coverage
  ✓ Build
```

### 3. Check Final Status

After monitoring completes, check if all checks passed:

```bash
# Get check status
gh pr checks $PR_NUM

# Parse output to determine if any failed
# Look for "X" or "fail" indicators
```

**If all checks passed**:
- Report success to user
- Exit (workflow complete)

**If any checks failed**:
- Proceed to failure analysis

## Failure Analysis

### 1. List All Checks

Get detailed status of all checks:

```bash
# List all checks with status
gh pr checks $PR_NUM

# Output shows:
# ✓ check-name-1 (passed)
# X check-name-2 (failed)
# ✓ check-name-3 (passed)
```

### 2. Get Workflow Run ID

Find the workflow run ID for failed checks:

```bash
# List recent workflow runs
gh run list --branch $(git branch --show-current) --limit 5

# Output shows:
# STATUS  NAME            WORKFLOW  BRANCH  EVENT  ID
# X       CI              CI        feat/...  push   123456789
```

### 3. View Failure Logs

Get detailed logs for the failed run:

```bash
# View logs for specific run
gh run view <run-id> --log

# Or view logs for specific job
gh run view <run-id> --log --job <job-id>
```

### 4. Identify Failure Type

Analyze logs to determine failure category:

**Test Failures**:
```
FAIL src/utils/download.test.ts
  ● download › should handle network errors
    Expected: "Network error"
    Received: "Unknown error"
```

**Linting Failures**:
```
Error: src/utils/download.ts:45:7
  'unusedVar' is defined but never used
```

**Coverage Failures**:
```
Coverage for statements (88%) does not meet threshold (90%)
```

**Build Failures**:
```
Error: src/utils/download.ts:45:7
  TS2322: Type 'string | undefined' is not assignable to type 'string'
```

**Type Checking Failures**:
```
Error: src/utils/download.ts:45:7
  TS2322: Type 'string | undefined' is not assignable to type 'string'
```

## Fix Strategies

### Strategy 1: Test Failures

**Diagnosis**: Tests are failing due to incorrect implementation or test logic

**Fix Process**:
```bash
# 1. Run tests locally to reproduce
npm test

# 2. Identify failing test
# Review test output and error messages

# 3. Fix the issue
# Option A: Fix implementation if test is correct
# Option B: Fix test if implementation is correct
# Option C: Fix both if both have issues

# 4. Verify fix locally
npm test

# 5. Ensure all tests pass
npm test -- --coverage
```

**Common Test Fixes**:
- Fix implementation logic errors
- Update test expectations
- Fix mock configurations
- Handle edge cases properly
- Fix async/await issues

### Strategy 2: Linting Failures

**Diagnosis**: Code doesn't meet linting standards

**Fix Process**:
```bash
# 1. Run linter locally
npm run lint

# 2. Auto-fix what's possible
npm run lint -- --fix

# 3. Manually fix remaining issues
# Edit files based on linting errors

# 4. Verify all issues resolved
npm run lint
```

**Common Linting Fixes**:
- Remove unused variables
- Add missing return types
- Fix import order
- Remove console statements
- Use const instead of let

### Strategy 3: Coverage Failures

**Diagnosis**: Test coverage below 90% threshold

**Fix Process**:
```bash
# 1. Run coverage locally
npm run test:coverage

# 2. Open HTML report
open coverage/index.html

# 3. Identify uncovered lines
# Look for red/yellow highlighted code

# 4. Add tests for uncovered code
# Create or update test files

# 5. Verify coverage improved
npm run test:coverage
```

**Common Coverage Fixes**:
- Add tests for uncovered branches
- Test error handling paths
- Test edge cases
- Test optional parameters
- Test default values

### Strategy 4: Build Failures

**Diagnosis**: TypeScript compilation errors

**Fix Process**:
```bash
# 1. Run build locally
npm run build

# 2. Identify compilation errors
# Review error messages

# 3. Fix TypeScript errors
# Add types, fix type mismatches, etc.

# 4. Verify build succeeds
npm run build

# 5. Check dist files generated
ls -la actions/*/dist/
```

**Common Build Fixes**:
- Add missing type annotations
- Fix type mismatches
- Handle null/undefined cases
- Fix import paths
- Add missing dependencies

### Strategy 5: Type Checking Failures

**Diagnosis**: TypeScript type errors

**Fix Process**:
```bash
# 1. Run type checking locally
npm run type-check

# 2. Fix type errors
# Add types, fix mismatches, handle null/undefined

# 3. Verify all errors resolved
npm run type-check
```

**Common Type Checking Fixes**:
- Add explicit type annotations
- Handle null/undefined cases
- Fix function signatures
- Use type guards
- Fix generic types

## Soft Reset and Re-commit

**CRITICAL**: After fixing issues, always soft reset and re-commit cleanly!

This maintains professional commit history even during CI/CD fixes.

### 1. Fetch Latest Main

```bash
# Ensure main is up to date
git fetch origin main
```

### 2. Perform Soft Reset

```bash
# Reset against origin/main, preserving all changes
git reset --soft origin/main

# Verify all changes are staged
git status

# Should show:
# On branch feat/2.1-download-utility
# Changes to be committed:
#   (all your changes from implementation + quality + fixes)
```

### 3. Re-commit with Clean Structure

Create the same 4-commit structure as before:

#### Commit 1: Implementation

```bash
# Stage only implementation files
git add shared/utils/download.ts shared/types/index.ts

# Commit
git commit -m "feat(shared): 2.1 create download utility"
```

#### Commit 2: Tests

```bash
# Stage all test files
git add shared/utils/download.test.ts shared/utils/download.properties.test.ts

# Commit
git commit -m "test(shared): add comprehensive tests for download utility"
```

#### Commit 3: Documentation

```bash
# Stage documentation files
git add README.md

# Commit
git commit -m "docs(shared): update documentation for download utility"
```

#### Commit 4: Quality Fixes

```bash
# Stage all remaining files (including CI/CD fixes)
git add .

# Commit
git commit -m "chore(shared): apply code quality fixes for download utility"
```

### 4. Verify Clean History

```bash
# View commit history
git log --oneline -5

# Should show exactly 4 commits:
# abc1234 chore(shared): apply code quality fixes for download utility
# def5678 docs(shared): update documentation for download utility
# ghi9012 test(shared): add comprehensive tests for download utility
# jkl3456 feat(shared): 2.1 create download utility
```

## Force Push

After re-committing cleanly, force push to update the PR:

```bash
# Use --force-with-lease for safety
git push --force-with-lease origin $(git branch --show-current)

# Example:
git push --force-with-lease origin feat/2.1-download-utility
```

**Why --force-with-lease?**
- Safer than `--force`
- Prevents overwriting others' work
- Fails if remote has unexpected changes
- Allows you to review before forcing

**When force push is safe**:
- ✅ Topic branch (not main)
- ✅ You're the only one working on it
- ✅ Replacing messy history with clean history
- ✅ Using --force-with-lease

**When force push is NOT safe**:
- ❌ Main or develop branch
- ❌ Shared branch with multiple contributors
- ❌ Without --force-with-lease flag

## Retry Logic

### Attempt Counter

Track the number of fix attempts:

```bash
# Initialize counter (first attempt)
ATTEMPT=1
MAX_ATTEMPTS=3

# After each fix attempt, increment
ATTEMPT=$((ATTEMPT + 1))

# Check if max attempts reached
if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
  echo "Max attempts ($MAX_ATTEMPTS) reached"
  # Report to user and exit
fi
```

### Retry Loop

```bash
ATTEMPT=1
MAX_ATTEMPTS=3

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  echo "Fix attempt $ATTEMPT of $MAX_ATTEMPTS"

  # 1. Monitor CI/CD
  gh pr checks $PR_NUM --watch

  # 2. Check if all passed
  if gh pr checks $PR_NUM | grep -q "All checks have passed"; then
    echo "✅ All checks passed!"
    exit 0
  fi

  # 3. Analyze failures
  echo "Analyzing failures..."
  gh run view <run-id> --log

  # 4. Fix issues
  echo "Fixing issues..."
  # (apply appropriate fix strategy)

  # 5. Soft reset and re-commit
  echo "Re-committing cleanly..."
  git fetch origin main
  git reset --soft origin/main
  # (create 4 clean commits)

  # 6. Force push
  echo "Pushing fixes..."
  git push --force-with-lease origin $(git branch --show-current)

  # 7. Increment attempt counter
  ATTEMPT=$((ATTEMPT + 1))

  # 8. Wait for new CI/CD run to start
  sleep 10
done

# If we get here, max attempts reached
echo "⚠️ Max attempts reached. Manual intervention required."
```

## Reporting

### Success Report

When all checks pass:

```
✅ PR CI/CD Checks Passed!

PR #42: feat(shared): 2.1 create download utility
URL: https://github.com/user/repo/pull/42

All checks passed:
  ✓ Pre-commit validation
  ✓ Linting
  ✓ Tests
  ✓ Coverage (92%)
  ✓ Build
  ✓ Type checking

Ready for review!
```

### Failure Report (After Max Attempts)

When fixes fail after 3 attempts:

```
⚠️ PR CI/CD Checks Failed After 3 Fix Attempts

PR #42: feat(shared): 2.1 create download utility
URL: https://github.com/user/repo/pull/42

Remaining failures:
  X Tests - 2 tests failing
    - download › should handle network errors
    - checksum › should verify SHA-256 checksums

  X Coverage - 88% (need 90%)
    - Uncovered: shared/utils/download.ts lines 45-47

Manual intervention required.

Next steps:
1. Review failure logs: gh run view <run-id> --log
2. Fix issues locally
3. Run tests: npm test
4. Run coverage: npm run test:coverage
5. Commit and push fixes

The workflow will automatically monitor the next push.
```

### Progress Updates

During fix attempts:

```
🔄 CI/CD Monitoring - Attempt 1 of 3

Monitoring PR #42...
Waiting for checks to complete...

Checks completed with failures:
  X Tests - 2 failures
  X Coverage - 88% (need 90%)

Analyzing failures...
Applying fixes...
Re-committing cleanly...
Force pushing...

🔄 CI/CD Monitoring - Attempt 2 of 3

Monitoring PR #42...
```

## Quality Checklist

Before completing, verify:

- [ ] PR number identified correctly
- [ ] Monitoring started successfully
- [ ] Check status determined (pass/fail)
- [ ] If failures: logs analyzed
- [ ] If failures: appropriate fix strategy applied
- [ ] If failures: fixes verified locally
- [ ] If failures: soft reset performed
- [ ] If failures: 4 clean commits created
- [ ] If failures: force push successful
- [ ] Retry logic respects max 3 attempts
- [ ] Final status reported to user

## Troubleshooting

### gh pr checks Doesn't Exit

**Problem**: `gh pr checks --watch` hangs indefinitely

**Solution**:
```bash
# Cancel with Ctrl+C
# Check status manually
gh pr checks $PR_NUM

# If checks are stuck, check workflow runs
gh run list --branch $(git branch --show-current)

# Cancel stuck run if needed
gh run cancel <run-id>
```

### Can't Identify Failure Type

**Problem**: Logs are unclear about what failed

**Solution**:
```bash
# View full logs
gh run view <run-id> --log > full-logs.txt

# Search for error patterns
grep -i "error" full-logs.txt
grep -i "fail" full-logs.txt
grep -i "expected" full-logs.txt

# Check each job separately
gh run view <run-id> --log --job <job-id>
```

### Force Push Rejected

**Problem**: `git push --force-with-lease` fails

**Solution**:
```bash
# Check what's on remote
git fetch origin
git log origin/$(git branch --show-current) --oneline -5

# If remote has unexpected changes, investigate
git diff HEAD origin/$(git branch --show-current)

# If safe to overwrite, use --force (carefully!)
git push --force origin $(git branch --show-current)
```

### Fixes Don't Resolve Failures

**Problem**: After fixing and pushing, same failures occur

**Solution**:
1. Verify fixes were actually applied
   ```bash
   git diff HEAD~1
   ```

2. Run checks locally before pushing
   ```bash
   npm test
   npm run lint
   npm run type-check
   npm run build
   ```

3. Check if CI/CD environment differs from local
   - Different Node.js version?
   - Different dependencies?
   - Different environment variables?

4. Review CI/CD configuration
   - Check `.github/workflows/*.yml`
   - Verify commands match local commands

### Max Attempts Reached

**Problem**: Still failing after 3 attempts

**Solution**:
1. Report detailed failure info to user
2. Provide specific next steps
3. Include links to logs
4. Suggest manual debugging steps
5. Don't continue attempting (respect max limit)

## Edge Cases

### No CI/CD Configured

If repository has no CI/CD workflows:

```bash
# gh pr checks will show no checks
gh pr checks $PR_NUM
# Output: No checks reported on this pull request

# Report to user
echo "ℹ️ No CI/CD checks configured for this repository"
echo "PR is ready for review"
```

### Checks Pass Immediately

If all checks pass on first monitoring:

```bash
# Report success immediately
echo "✅ All checks passed on first attempt!"
# No fixes needed, exit
```

### Partial Failures

If some checks pass and some fail:

```bash
# Focus on failures only
echo "Partial failures detected:"
gh pr checks $PR_NUM | grep "X"

# Fix only the failing checks
# Don't re-run passing checks unnecessarily
```

### Flaky Tests

If tests fail intermittently:

```bash
# Detect flaky tests (fail, then pass without changes)
# If same test fails in attempt 1 but passes in attempt 2 without fixes
echo "⚠️ Flaky test detected: <test-name>"
echo "Consider fixing test stability"

# Still report success if eventually passes
```

## Integration with Workflow

This agent is triggered by Hook 4 (after-pr-submission.json) which fires when:
- A PR has been created (gh pr create)
- A PR has been updated (git push to PR branch)
- Previous agent was PR submission agent

After you complete:
- If all checks pass: Workflow is complete, PR ready for review
- If checks fail after 3 attempts: User is notified, manual intervention needed
- If checks pass after fixes: Workflow is complete, PR ready for review

## Important Reminders

1. **ALWAYS use --watch** - Don't poll manually
2. **ALWAYS soft reset** - Maintain clean history even during fixes
3. **ALWAYS force-with-lease** - Never use --force alone
4. **Respect max 3 attempts** - Don't retry indefinitely
5. **Report clearly** - User needs to understand what happened
6. **Verify fixes locally** - Before pushing
7. **Maintain 4-commit structure** - Even during fixes

## Success Criteria

You've succeeded when:
- ✅ Monitoring started successfully
- ✅ Check status determined accurately
- ✅ Failures analyzed correctly
- ✅ Appropriate fixes applied
- ✅ Clean commit history maintained
- ✅ Force push successful
- ✅ Final status reported clearly
- ✅ Max 3 attempts respected
- ✅ User knows next steps (if manual intervention needed)

Begin now.
