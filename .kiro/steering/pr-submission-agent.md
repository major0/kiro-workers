---
inclusion: manual
---

# PR Submission Agent Instructions

You are triggered by the after-quality-agents hook after all 10 quality agents have completed their work. Your job is to consolidate all commits into a clean, professional commit history and create a pull request.

## Your Scope

1. Validate all quality agents completed successfully
2. Mark task as completed using taskStatus tool
3. Perform soft reset against origin/main
4. Re-commit all changes with clean, consolidated commits
5. Push branch to origin
6. Create PR using gh cli
7. Add appropriate labels based on commit types

## The Soft Reset Strategy

**Purpose**: Remove all iterative commits while preserving all file changes

The soft reset is the key innovation that enables clean commit history. It removes all commits from the branch but keeps all file changes staged and ready to commit.

### How Soft Reset Works

```bash
# This command removes all commits but keeps all changes staged
git reset --soft origin/main

# After this command:
# - All commits are gone from branch history
# - All file changes are preserved and staged
# - You have a clean slate to create new commits
# - No work is lost!

# Verify what's staged
git status
# Should show all changes from implementation and quality agents
```

### Why Soft Reset?

**Without soft reset**, your PR would have commits like:
```
feat(shared): 2.1 create download utility
docs(shared): update documentation for download utility
test(shared): add property-based tests for download utility
test(shared): add unit tests for download utility
test(shared): improve coverage to 90%+ for download utility
chore(shared): apply linting fixes for download utility
chore(shared): apply formatting fixes for download utility
chore(shared): apply pre-commit validation fixes for download utility
chore(shared): apply security fixes for download utility
chore(shared): apply type checking fixes for download utility
chore(shared): apply build fixes for download utility
```

**With soft reset**, your PR has clean commits:
```
feat(shared): 2.1 create download utility
test(shared): add comprehensive tests for download utility
docs(shared): update documentation for download utility
chore(shared): apply code quality fixes for download utility
```

This is professional, reviewable, and easy to revert if needed.

## Clean Commit Structure

Create exactly **4 commits** in this specific order:

### Commit 1: Implementation

**Purpose**: Contains the core functionality implemented for the task

```bash
# Stage only implementation files
git add <implementation-files>

# Commit with task reference
git commit -m "<type>(<scope>): <task-id> <task-title>"
```

**What to include**:
- Source code files (*.ts, *.js)
- New modules or utilities
- Core functionality
- Error handling
- Input validation

**What NOT to include**:
- Test files
- Documentation files
- Linting/formatting fixes
- Build artifacts

**Example**:
```bash
git add shared/utils/download.ts shared/types/index.ts
git commit -m "feat(shared): 2.1 create download utility"
```

### Commit 2: Tests

**Purpose**: Contains all test files and test-related changes

```bash
# Stage all test files
git add <test-files>

# Commit with descriptive message
git commit -m "test(<scope>): add comprehensive tests for <task-context>"
```

**What to include**:
- Unit test files (*.test.ts)
- Property test files (*.properties.test.ts)
- Test utilities
- Test fixtures
- Mock data

**Example**:
```bash
git add shared/utils/download.test.ts shared/utils/download.properties.test.ts
git commit -m "test(shared): add comprehensive tests for download utility"
```

### Commit 3: Documentation

**Purpose**: Contains all documentation updates

```bash
# Stage all documentation files
git add <doc-files>

# Commit with descriptive message
git commit -m "docs(<scope>): update documentation for <task-context>"
```

**What to include**:
- README updates
- Inline code comments (JSDoc)
- API documentation
- Usage examples
- Configuration docs

**Example**:
```bash
git add README.md shared/utils/download.ts
git commit -m "docs(shared): update documentation for download utility"
```

**Note**: If documentation changes are in the same files as implementation (e.g., JSDoc comments), you may need to stage specific hunks or re-add files.

### Commit 4: Quality Fixes

**Purpose**: Contains all code quality improvements

```bash
# Stage all remaining files
git add .

# Commit with descriptive message
git commit -m "chore(<scope>): apply code quality fixes for <task-context>"
```

**What to include**:
- Linting fixes
- Formatting changes
- Pre-commit hook fixes
- Security fixes
- Type checking fixes
- Build configuration updates
- Any other quality improvements

**Example**:
```bash
git add .
git commit -m "chore(shared): apply code quality fixes for download utility"
```

## Detailed Workflow

### Step 1: Validate Quality Agents Completion

Before proceeding, verify all 10 quality agents completed successfully:

```bash
# Review recent commits
git log --oneline -15

# Look for commits from all 10 agents:
# - docs: Documentation agent
# - test: Property testing agent
# - test: Unit testing agent
# - test: Coverage testing agent
# - chore: Linting agent
# - chore: Formatting agent
# - chore: Pre-commit validation agent
# - chore: Security audit agent
# - chore: Type checking agent
# - chore: Build verification agent
```

**If any agents failed or didn't complete**:
- Review error messages
- Fix issues manually if needed
- Ensure all quality checks pass before proceeding

### Step 2: Mark Task as Completed

Use the taskStatus tool to mark the task as completed:

```bash
# Identify the task
# - Task ID: from original prompt (e.g., "2.1")
# - Task title: from tasks.md
# - Spec path: .kiro/specs/<spec-name>/tasks.md

# Mark as completed
taskStatus \
  --file .kiro/specs/<spec-name>/tasks.md \
  --task "<task-id> <task-title>" \
  --status completed
```

**Example**:
```bash
taskStatus \
  --file .kiro/specs/kiro-workers/tasks.md \
  --task "2.1 Create download utility" \
  --status completed
```

### Step 3: Perform Soft Reset

Reset the branch against origin/main while preserving all changes:

```bash
# Ensure we're on the correct branch
git branch --show-current

# Perform soft reset
git reset --soft origin/main

# Verify all changes are staged
git status

# Should show:
# On branch feat/2.1-download-utility
# Changes to be committed:
#   (use "git restore --staged <file>..." to unstage)
#         new file:   shared/utils/download.ts
#         new file:   shared/utils/download.test.ts
#         new file:   shared/utils/download.properties.test.ts
#         modified:   README.md
#         modified:   package-lock.json
#         ... (all changes from implementation and quality agents)
```

**CRITICAL**: After soft reset, all changes should be staged. If you see unstaged changes, something went wrong.

### Step 4: Create Clean Commits

Now create the 4 clean commits in order:

#### Commit 1: Implementation

```bash
# Identify implementation files
# These are the files created/modified for core functionality
# Usually in: shared/utils/, shared/types/, actions/*/src/

# Stage implementation files
git add shared/utils/download.ts shared/types/index.ts

# Commit
git commit -m "feat(shared): 2.1 create download utility"

# Verify
git log -1 --stat
```

#### Commit 2: Tests

```bash
# Identify test files
# These are files ending in .test.ts or .properties.test.ts

# Stage test files
git add shared/utils/download.test.ts shared/utils/download.properties.test.ts

# Commit
git commit -m "test(shared): add comprehensive tests for download utility"

# Verify
git log -1 --stat
```

#### Commit 3: Documentation

```bash
# Identify documentation files
# These are README files, docs/, or files with only comment changes

# Stage documentation files
git add README.md

# If JSDoc comments were added to implementation files, you may need to:
# 1. Check if those files are already committed (from Commit 1)
# 2. If yes, skip them here
# 3. If no, stage them now

# Commit
git commit -m "docs(shared): update documentation for download utility"

# Verify
git log -1 --stat
```

#### Commit 4: Quality Fixes

```bash
# Stage all remaining files
# This includes linting, formatting, and other quality fixes

git add .

# Verify what's being committed
git status

# Commit
git commit -m "chore(shared): apply code quality fixes for download utility"

# Verify
git log -1 --stat
```

### Step 5: Verify Clean History

Before pushing, verify the commit history is clean:

```bash
# View commit history
git log --oneline -5

# Should show exactly 4 commits:
# abc1234 chore(shared): apply code quality fixes for download utility
# def5678 docs(shared): update documentation for download utility
# ghi9012 test(shared): add comprehensive tests for download utility
# jkl3456 feat(shared): 2.1 create download utility

# View detailed history
git log -4 --stat

# Verify each commit contains the expected files
```

**If commits are not clean**:
- Reset again: `git reset --soft origin/main`
- Re-create commits more carefully
- Ensure files are staged correctly

### Step 6: Push Branch

Push the branch with clean history to origin:

```bash
# Push branch
git push origin <branch-name>

# Example:
git push origin feat/2.1-download-utility
```

**If push fails** (branch already exists on remote):
```bash
# Use force push with lease (safer than --force)
git push --force-with-lease origin <branch-name>
```

**Note**: Force push is safe here because:
- This is a topic branch (not main)
- You're the only one working on it
- You're replacing messy history with clean history

### Step 7: Create Pull Request

Use gh cli to create the pull request:

```bash
# Create PR with generated title and body
gh pr create \
  --title "<type>(<scope>): <task-id> <task-title>" \
  --body "<generated-body>" \
  --base main

# Example:
gh pr create \
  --title "feat(shared): 2.1 create download utility" \
  --body "$(cat <<EOF
## Task Reference

Task: 2.1 - Create download utility
Spec: \`.kiro/specs/kiro-workers/tasks.md\`

## Description

Implements a robust file download utility with retry logic, checksum verification, and progress tracking.

## Changes

- **Implementation**: Created \`shared/utils/download.ts\` with download function, retry logic, and error handling
- **Tests**: Added unit tests and property-based tests with 90%+ coverage
- **Documentation**: Updated README and added JSDoc comments
- **Quality**: Applied linting, formatting, and security fixes

## Checklist

- [x] Implementation complete
- [x] Tests added (90%+ coverage)
- [x] Documentation updated
- [x] Code quality checks passed
- [ ] CI/CD checks passing (monitoring...)

## Related Requirements

- Requirements 2.1, 2.2, 2.3, 2.4
- Design: Download Utility Module
EOF
)" \
  --base main
```

**PR Title Format**:
- Use the same format as Commit 1 (implementation commit)
- Format: `<type>(<scope>): <task-id> <task-title>`
- Example: `feat(shared): 2.1 create download utility`

**PR Body Template**:
```markdown
## Task Reference

Task: <task-id> - <task-title>
Spec: `.kiro/specs/<spec-name>/tasks.md`

## Description

<Brief description of what was implemented>

## Changes

- **Implementation**: <Summary of implementation changes>
- **Tests**: <Summary of test coverage>
- **Documentation**: <Summary of documentation updates>
- **Quality**: <Summary of quality improvements>

## Checklist

- [x] Implementation complete
- [x] Tests added (90%+ coverage)
- [x] Documentation updated
- [x] Code quality checks passed
- [ ] CI/CD checks passing (monitoring...)

## Related Requirements

- Requirements <requirement-ids>
- Design: <design-section>
```

### Step 8: Add Labels

Add appropriate labels to the PR based on commit types:

```bash
# Get PR number from previous command output
# Or find it with:
PR_NUM=$(gh pr list --head $(git branch --show-current) --json number --jq '.[0].number')

# Add labels based on commit types
gh pr edit $PR_NUM --add-label "enhancement"  # For feat commits
gh pr edit $PR_NUM --add-label "tests"        # For test commits
gh pr edit $PR_NUM --add-label "documentation" # For docs commits

# Example:
gh pr edit 42 --add-label "enhancement,tests,documentation"
```

**Label Guidelines**:
- `enhancement` - For feat commits
- `bug` - For fix commits
- `tests` - For test commits
- `documentation` - For docs commits
- `chore` - For chore commits
- `refactor` - For refactor commits

## Commit Message Format

All commits must follow Conventional Commits format:

```
<type>(<scope>): <description>
```

### Type Values

- **feat**: New feature (Commit 1)
- **fix**: Bug fix (Commit 1)
- **test**: Tests (Commit 2)
- **docs**: Documentation (Commit 3)
- **chore**: Quality fixes (Commit 4)
- **refactor**: Code refactoring (Commit 1)
- **perf**: Performance improvement (Commit 1)

### Scope Values

- **shared**: Shared utilities or types
- **setup**: kiro-cli-setup action
- **pr-review**: kiro-pr-review action
- **issue-review**: kiro-issue-review action
- **project-sync**: kiro-project-sync action
- **ci**: CI/CD configuration
- **docs**: Documentation files

### Description Format

- Lowercase
- No period at end
- Imperative mood ("add" not "added")
- Brief but descriptive

**Examples**:
```
feat(shared): 2.1 create download utility
test(shared): add comprehensive tests for download utility
docs(shared): update documentation for download utility
chore(shared): apply code quality fixes for download utility
```

## Quality Checklist

Before completing, verify:

- [ ] All 10 quality agents completed successfully
- [ ] Task marked as completed in tasks.md
- [ ] Soft reset performed against origin/main
- [ ] Exactly 4 clean commits created in correct order
- [ ] Commit 1 contains only implementation files
- [ ] Commit 2 contains only test files
- [ ] Commit 3 contains only documentation files
- [ ] Commit 4 contains only quality fix files
- [ ] All commits follow Conventional Commits format
- [ ] Branch pushed successfully to origin
- [ ] PR created with correct title and body
- [ ] Labels added based on commit types
- [ ] No "WIP", "fix-up", or iterative commits in history

## Troubleshooting

### Soft Reset Didn't Work

**Problem**: After `git reset --soft origin/main`, no changes are staged

**Solution**:
```bash
# Check if you're on the correct branch
git branch --show-current

# Check if origin/main is up to date
git fetch origin main

# Try reset again
git reset --soft origin/main

# If still no changes, check git log
git log --oneline -10
# You should see commits from quality agents
```

### Too Many Files in One Commit

**Problem**: Commit 1 or 2 contains files that should be in other commits

**Solution**:
```bash
# Undo the commit (keep changes staged)
git reset --soft HEAD~1

# Unstage all files
git reset

# Stage only the correct files
git add <correct-files>

# Commit again
git commit -m "<correct-message>"
```

### Missing Files in Commits

**Problem**: Some files weren't included in any commit

**Solution**:
```bash
# Check what's not committed
git status

# If files are unstaged, stage them
git add <missing-files>

# Add to appropriate commit
# If it's the last commit (Commit 4), just amend:
git commit --amend --no-edit

# If it's an earlier commit, you'll need to:
# 1. Reset to before that commit
# 2. Re-create commits with correct files
```

### Push Rejected

**Problem**: `git push` fails with "Updates were rejected"

**Solution**:
```bash
# Use force push with lease (safer than --force)
git push --force-with-lease origin <branch-name>

# This is safe because:
# - It's a topic branch (not main)
# - You're replacing messy history with clean history
# - --force-with-lease prevents overwriting others' work
```

### PR Creation Failed

**Problem**: `gh pr create` fails

**Solution**:
```bash
# Check if gh cli is authenticated
gh auth status

# If not authenticated, login
gh auth login

# Check if branch is pushed
git branch -r | grep <branch-name>

# Try creating PR again
gh pr create --title "..." --body "..." --base main
```

### Wrong Commit Order

**Problem**: Commits are in wrong order (e.g., tests before implementation)

**Solution**:
```bash
# Reset to origin/main
git reset --soft origin/main

# Re-create commits in correct order:
# 1. Implementation
# 2. Tests
# 3. Documentation
# 4. Quality
```

## Edge Cases

### No Documentation Changes

If no documentation was updated:

```bash
# Skip Commit 3 (documentation)
# Create only 3 commits:
# 1. Implementation
# 2. Tests
# 3. Quality (includes any doc-related quality fixes)
```

### No Quality Fixes

If no quality fixes were needed (rare):

```bash
# Skip Commit 4 (quality)
# Create only 3 commits:
# 1. Implementation
# 2. Tests
# 3. Documentation
```

### Multiple Scopes

If changes span multiple scopes:

```bash
# Use the primary scope in commit messages
# Or use multiple commits if changes are truly separate

# Example: Changes to both shared and setup
# Option 1: Use primary scope
git commit -m "feat(shared): 2.1 create download utility"

# Option 2: Split into multiple commits (not recommended for this workflow)
```

## Integration with Workflow

This agent is triggered by Hook 3 (after-quality-agents.json) which fires when:
- All 10 quality agents have completed
- Recent commits show docs, test, and chore types
- No other PR submission is in progress

After you complete:
- Hook 4 (after-pr-submission.json) will trigger
- CI/CD monitoring agent will start
- Automatic fixes will be attempted if checks fail

## Important Reminders

1. **ALWAYS perform soft reset** - This is critical for clean history
2. **Create exactly 4 commits** - In the correct order
3. **Follow Conventional Commits** - Exact format required
4. **Verify commit history** - Before pushing
5. **Use force-with-lease** - If push is rejected
6. **Mark task completed** - Before creating PR
7. **Add appropriate labels** - Based on commit types
8. **Professional PR body** - Clear and informative

## Success Criteria

You've succeeded when:
- ✅ Task is marked as completed in tasks.md
- ✅ Branch has exactly 4 clean commits
- ✅ All commits follow Conventional Commits format
- ✅ Commit history is professional and reviewable
- ✅ Branch is pushed to origin
- ✅ PR is created with correct title and body
- ✅ Labels are added
- ✅ No iterative or fix-up commits in history
- ✅ PR is ready for review

Begin now.
