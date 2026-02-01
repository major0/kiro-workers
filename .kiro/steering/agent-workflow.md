# Agent Workflow and Branching

## CRITICAL: Topic Branch Creation Rules

**MANDATORY WORKFLOW FOR ALL NEW WORK:**

Before starting ANY new work, the primary agent MUST execute this exact sequence:

```bash
# Step 1: Switch to main branch
git checkout main

# Step 2: Update main from remote (REQUIRED - never skip this!)
git pull origin main

# Step 3: ONLY NOW create new topic branch from updated main
git checkout -b <type>/<description>
```

**ABSOLUTE ENFORCEMENT RULES:**

1. ✅ **ALWAYS update main first**: `git checkout main && git pull origin main`
2. ✅ **ALWAYS create NEW topic branches from UPDATED main**: Never reuse old branches for new work
3. ✅ **ALWAYS verify you're on the correct branch before committing**: `git branch --show-current`
4. ❌ **NEVER work directly on main or develop**
5. ❌ **NEVER create topic branches from outdated main** - ALWAYS pull first
6. ❌ **NEVER create topic branches from other topic branches**
7. ❌ **NEVER skip the `git pull origin main` step** - This is NOT optional
8. ❌ **NEVER reuse an old topic branch for new work** - Always create a fresh branch
9. ❌ **NEVER assume main is up-to-date** - Always pull explicitly

**What constitutes "new work" requiring a NEW topic branch:**
- Starting a new task from the task list
- Implementing a new feature
- Creating new files or functionality
- Any work that will result in a new PR
- **ANY work request from the user after a previous PR was created**

**What does NOT require a new branch:**
- Continuing work on the CURRENT topic branch (same session)
- Fixing issues on the current topic branch before it's merged
- Amending commits on the current topic branch

**Pre-Work Checklist (MANDATORY):**

Before starting new work, the agent MUST:
1. Check current branch: `git branch --show-current`
2. If NOT on main, switch: `git checkout main`
3. Pull latest changes: `git pull origin main` (NEVER skip this!)
4. Create fresh topic branch: `git checkout -b <type>/<description>`
5. Verify new branch: `git branch --show-current`

**Failure to follow this workflow will result in:**
- Merge conflicts
- Integration issues
- Out-of-sync code
- Rejected pull requests

## Topic Branch Requirements

**CRITICAL**: All task work must be done on appropriately named topic branches. Never work directly on `main` or `develop`.

### Branch Naming Convention

Topic branches should follow this pattern:

```
<type>/<task-id>-<brief-description>
```

**Examples:**
- `feat/2.1-download-utility`
- `feat/3.2-pr-context-retrieval`
- `fix/5.3-duplicate-detection`
- `test/2.2-property-tests-download`

**Types:**
- `feat` - New feature implementation
- `fix` - Bug fix
- `refactor` - Code refactoring
- `test` - Test additions
- `docs` - Documentation updates
- `chore` - Maintenance tasks

### Task ID Mapping

When working on tasks from `.kiro/specs/*/tasks.md`:
- Extract the task ID (e.g., "2.1", "3.2.1")
- Use it in the branch name
- Include a brief description of the task

## Branch Workflow

### Starting Work on a Task

**CRITICAL**: Before creating any topic branch, you MUST ensure main is up to date:

1. **Switch to main**: `git checkout main`
2. **Update main**: `git pull origin main`
3. **Create topic branch from updated main**: `git checkout -b <type>/<task-id>-<description>`
4. **Perform all work on this branch**
5. **Commit with Conventional Commits**: `<type>(scope): <task-id> <task-title>`

**NEVER create a topic branch without first updating main. This ensures your branch starts from the latest code and avoids merge conflicts.**

### Sub-Agent Coordination

**IMPORTANT**: When invoking sub-agents or when sub-agents are triggered by hooks:

- **Same branch rule**: All sub-agents must work on the same topic branch as the parent agent
- **No branch switching**: Sub-agents should NOT create new branches or switch branches
- **Continuation**: Sub-agents continue work on the current topic branch
- **Commits**: All commits from sub-agents go to the same topic branch

### Example Workflow

```bash
# Parent agent starts work
git checkout -b feat/2.1-download-utility

# Parent agent makes changes
git add shared/utils/download.ts
git commit -m "feat(shared): 2.1 Create download utility"

# Parent agent invokes sub-agent for testing
# Sub-agent works on SAME branch (feat/2.1-download-utility)
# Sub-agent makes changes
git add shared/utils/download.test.ts
git commit -m "test(shared): 2.2 Add tests for download utility"

# All work stays on feat/2.1-download-utility
```

## Branch Management

### Before Starting Work

```bash
# Ensure you're up to date
git checkout main
git pull

# Create topic branch
git checkout -b feat/<task-id>-<description> origin/main
```

### During Work

- Make focused commits following Conventional Commits
- Keep commits atomic and related to the task
- Push regularly to backup work: `git push origin <branch-name>`

### Commit Quality Requirements

**CRITICAL**: Each commit must be a "final draft" - a complete, polished changeset.

**The Essay Analogy:**
Just as you wouldn't submit multiple drafts of an essay with corrections to a teacher, don't create chains of commits that fix previous commits on the same branch. Each commit should be publication-ready.

**Rules:**
- ❌ **DON'T**: Create fix-up commits like "fix typo", "address review comments", "oops forgot file"
- ✅ **DO**: Get it right the first time - each commit should be complete and correct
- ❌ **DON'T**: Push work-in-progress commits that you'll fix later
- ✅ **DO**: Test and verify before committing
- ❌ **DON'T**: Create commit chains like: "add feature" → "fix bug in feature" → "fix another bug"
- ✅ **DO**: Create one complete commit: "add feature" (fully working)

**Requirements for each commit:**
1. **Complete**: Contains all files needed for the change
2. **Correct**: Code works, tests pass, no known issues
3. **Atomic**: Single logical change (but complete)
4. **Reversible**: Can be reverted with `git revert` without breaking the codebase
5. **Self-contained**: Doesn't depend on "fixing" in a later commit

**If you make a mistake:**
- Use `git commit --amend` to fix the last commit (before pushing)
- Use `git rebase -i` to fix earlier commits (before pushing)
- Once pushed, avoid force-pushing unless absolutely necessary

**Why this matters:**
- Clean git history for code review
- Easy to identify what changed and why
- Simple to revert problematic changes
- Professional development practice
- Respects reviewer's time

### Pre-Push Quality Review

**CRITICAL**: Before pushing to remote, perform a comprehensive self-review of the topic branch.

**Quality Criteria Checklist:**

1. **Code Quality**
   - All tests pass locally (`npm test`, `npm run test:properties`)
   - Pre-commit hooks pass (`pre-commit run --all-files`)
   - No linting errors (`npm run lint`)
   - TypeScript compiles without errors (`npm run type-check`)
   - Code follows project conventions and patterns

2. **Commit Quality**
   - All commits follow Conventional Commits format
   - Each commit is complete and self-contained
   - No "fix-up" or "WIP" commits
   - Commit messages are clear and descriptive
   - No unrelated changes mixed in commits

3. **Documentation**
   - Code has appropriate inline comments
   - Public APIs are documented
   - README files updated if needed
   - Examples updated if functionality changed

4. **Testing**
   - New code has unit tests (90%+ coverage)
   - Property-based tests for core logic
   - Edge cases are covered
   - Tests are meaningful and not just for coverage

5. **Branch Hygiene**
   - No merge commits (rebase if needed)
   - No commits from other branches
   - Branch is up to date with `main`
   - No unnecessary files committed

**Self-Review Process:**

```bash
# 1. Review all changes in the branch
git log main..HEAD --oneline
git diff main..HEAD

# 2. Run all quality checks
npm run lint
npm run type-check
npm test
pre-commit run --all-files

# 3. Review each commit individually
git log main..HEAD --stat
git show <commit-hash>  # For each commit

# 4. Check for any issues
git status
git diff --check  # Check for whitespace errors
```

**Cleanup Actions (if needed):**

If issues are found during review:

```bash
# Fix the last commit
git add <files>
git commit --amend --no-edit

# Fix multiple commits (interactive rebase)
git rebase -i main

# Squash fix-up commits
git rebase -i main  # Mark commits as 'fixup' or 'squash'

# Update commit messages
git rebase -i main  # Mark commits as 'reword'

# Reorder commits for logical flow
git rebase -i main  # Reorder lines

# Remove unnecessary commits
git rebase -i main  # Delete lines or mark as 'drop'
```

**Only push when:**
- All quality checks pass
- All commits are clean and complete
- Branch tells a clear story
- You're confident in the changes

### Completing Work

- Perform pre-push quality review (see above)
- Clean up branch as necessary
- Push final changes: `git push origin <branch-name>`
- Create pull request from topic branch to `main`
- Monitor CI/CD status (see Post-Push Monitoring below)

### Post-Push CI/CD Monitoring

**CRITICAL**: After pushing and creating a PR, actively monitor for CI/CD failures and address them immediately.

**Monitoring Process:**

1. **Check PR Status Immediately**
   ```bash
   # View PR status
   gh pr view <pr-number>

   # Watch PR checks in real-time
   gh pr checks <pr-number> --watch
   ```

2. **Monitor CI/CD Workflows**
   - Pre-commit validation
   - Linting and formatting
   - Unit tests
   - Property-based tests
   - Build verification
   - Integration tests

3. **Check for Failures**
   ```bash
   # List all checks and their status
   gh pr checks <pr-number>

   # View specific workflow run
   gh run view <run-id>

   # View workflow logs
   gh run view <run-id> --log
   ```

**Failure Response Protocol:**

When CI/CD checks fail:

1. **Immediate Investigation**
   - Review the failure logs
   - Identify the root cause
   - Determine if it's a real issue or flaky test

2. **Fix Locally**
   ```bash
   # Reproduce the failure locally
   npm test  # or specific test command

   # Fix the issue
   # ... make changes ...

   # Verify fix locally
   npm test
   pre-commit run --all-files

   # Commit the fix
   git add <files>
   git commit --amend --no-edit  # Or new commit if appropriate

   # Force push if amended (use with caution)
   git push origin <branch-name> --force-with-lease
   ```

3. **Re-verify CI/CD**
   ```bash
   # Watch the new run
   gh pr checks <pr-number> --watch
   ```

4. **Iterate Until Green**
   - Keep fixing until all checks pass
   - Don't leave failing PRs unattended
   - Don't merge with failing checks

**CI/CD Failure Categories:**

- **Pre-commit failures**: Formatting, linting, or hook issues
  - Fix: Run `pre-commit run --all-files` locally and commit fixes

- **Test failures**: Unit tests or property tests failing
  - Fix: Debug tests locally, fix code or tests, verify, commit

- **Build failures**: TypeScript compilation or bundling errors
  - Fix: Run `npm run build` locally, fix errors, commit

- **Coverage failures**: Code coverage below threshold
  - Fix: Add missing tests, verify coverage locally, commit

**Monitoring Duration:**

- Monitor actively for the first 10-15 minutes after push
- Check back periodically until all checks pass
- Set up notifications if available
- Don't consider work "done" until CI is green

**Communication:**

If CI failures are complex or require discussion:
- Comment on the PR explaining the issue
- Tag relevant reviewers if needed
- Document any workarounds or known issues
- Update PR description if scope changes

## Multi-Task Scenarios

### Sequential Tasks

If working on multiple related tasks sequentially:
- Complete first task on its branch
- Create PR for first task
- Create new branch from `main` for second task
- Do NOT stack branches

### Parallel Tasks

If tasks are independent:
- Create separate topic branches from `main`
- Work on each independently
- Create separate PRs

## Branch Cleanup

After PR is merged:
```bash
# Switch back to main
git checkout main
git pull origin main

# Delete local topic branch
git branch -d feat/2.1-download-utility

# Delete remote topic branch (if not auto-deleted)
git push origin --delete feat/2.1-download-utility
```

## Common Mistakes to Avoid

❌ **DON'T**: Work directly on `main` or `develop`
✅ **DO**: Always create a topic branch

❌ **DON'T**: Create new branches in sub-agents
✅ **DO**: Sub-agents work on the same branch as parent

❌ **DON'T**: Use generic branch names like `feature` or `updates`
✅ **DO**: Use descriptive names with task IDs

❌ **DON'T**: Mix unrelated changes in one branch
✅ **DO**: Keep branches focused on single tasks

❌ **DON'T**: Push without performing pre-push quality review
✅ **DO**: Review all changes, run all checks, clean up commits

❌ **DON'T**: Create PR and walk away
✅ **DO**: Monitor CI/CD actively and fix failures immediately

❌ **DON'T**: Leave failing CI checks unattended
✅ **DO**: Iterate until all checks pass before considering work done

❌ **DON'T**: Force push without `--force-with-lease`
✅ **DO**: Use `--force-with-lease` to avoid overwriting others' work

## Verification

Before committing, verify you're on the correct branch:
```bash
git branch --show-current
```

Expected output: `feat/<task-id>-<description>` (NOT `main` or `develop`)

## Complete Workflow Example

Here's a complete workflow from start to finish:

```bash
# 1. Start work
git checkout main
git pull origin main
git checkout -b feat/2.1-download-utility

# 2. Implement feature
# ... write code ...
git add shared/utils/download.ts
git commit -m "feat(shared): 2.1 Create download utility"

# 3. Add tests
# ... write tests ...
git add shared/utils/download.test.ts
git commit -m "test(shared): add unit tests for download utility"

# 4. Pre-push quality review
git log main..HEAD --oneline
git diff main..HEAD
npm run lint
npm run type-check
npm test
pre-commit run --all-files

# 5. Clean up if needed (example: squash commits)
git rebase -i main  # Mark second commit as 'squash'

# 6. Push
git push origin feat/2.1-download-utility

# 7. Create PR
gh pr create --title "feat(shared): 2.1 Create download utility" \
  --body "Implements download utility with retry logic" \
  --base main

# 8. Monitor CI/CD
gh pr checks --watch

# 9. If CI fails, fix immediately
# ... fix issues ...
git add <files>
git commit --amend --no-edit
git push origin feat/2.1-download-utility --force-with-lease

# 10. Continue monitoring until green
gh pr checks --watch

# 11. After PR is merged
git checkout main
git pull origin main
git branch -d feat/2.1-download-utility
```
