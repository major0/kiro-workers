# Task Orchestration Workflow - Design

## Overview

This document describes a hook-based task orchestration workflow that automates the complete task lifecycle from initiation to PR merge. The workflow is triggered by user prompt, handles all quality assurance with 10 parallel agents, maintains clean PR commit history through soft resets, and automatically fixes CI/CD failures.

## Key Innovation: Clean Commit History

Unlike traditional workflows that accumulate iterative commits, this workflow uses **soft reset** to consolidate all changes into clean, logical commits before pushing to the PR. This ensures:
- Professional commit history
- Easy code review
- Simple revert operations
- Clear change narrative

## Architecture

### Workflow Sequence

```
User: "Execute task 2.1"
         ↓
   [Hook 1: on-task-start (promptSubmit)]
         ↓
   Detect task request → Mark in_progress
   Create branch from origin/main
   Implement task → Commit
         ↓
   [Hook 2: after-implementation (agentStop)]
         ↓
   Detect implementation commit
   Launch 10 quality agents in parallel:
   ├─> Documentation
   ├─> Property Testing
   ├─> Unit Testing
   ├─> Coverage Testing
   ├─> Linting
   ├─> Formatting
   ├─> Pre-commit Validation
   ├─> Security Audit
   ├─> Type Checking
   └─> Build Verification
   Each commits independently
         ↓
   [Hook 3: after-quality-agents (agentStop)]
         ↓
   Detect all agents complete
   Soft reset: git reset --soft origin/main
   Re-commit with clean history:
   - Implementation commit
   - Testing commit
   - Documentation commit
   - Quality commit
   Push branch → Create PR
         ↓
   [Hook 4: after-pr-submission (agentStop)]
         ↓
   Detect PR creation
   Monitor: gh pr checks --watch
   If failures:
     - Analyze logs
     - Fix issues
     - Soft reset again
     - Re-commit cleanly
     - Force push
     - Repeat (max 3 attempts)
   Report final status
         ↓
   Done
```

## Implementation Using Hooks

### Hook 1: Task Initiation (promptSubmit)

**File**: `.kiro/hooks/on-task-start.kiro.hook`

```json
{
  "name": "Task Initiation and Implementation",
  "version": "1.0.0",
  "description": "Triggers on prompt submit to detect task start requests, create branch, and implement task",
  "when": {
    "type": "promptSubmit"
  },
  "then": {
    "type": "askAgent",
    "prompt": "Check if the user's prompt is requesting to start a task from `.kiro/specs/*/tasks.md`. Look for phrases like 'execute task', 'start task', 'implement task', 'work on task', followed by a task ID (e.g., '2.1', '3.2.1').\n\nIf YES (this is a task start request):\n\n1. **Identify Task**: Parse task ID and locate task in tasks.md\n2. **Mark In Progress**: Use taskStatus tool to mark task as in_progress\n3. **Update Main**: \n   ```bash\n   git checkout main\n   git pull origin main\n   ```\n4. **Create Branch**: \n   ```bash\n   git checkout -b <type>/<task-id>-<description> origin/main\n   ```\n   - type: feat, fix, docs, test, refactor, etc.\n   - task-id: e.g., 2.1, 3.2.1\n   - description: brief kebab-case description\n5. **Verify Branch**: Ensure branch is up-to-date with origin/main\n6. **Implement Task**: \n   - Read task details from tasks.md\n   - Read requirements.md and design.md for context\n   - Implement ONLY core functionality (no tests, no docs)\n   - Create ONE commit: `<type>(<scope>): <task-id> <task-title>`\n\nReference steering file: task-initiation-agent.md\n#[[file:.kiro/steering/task-initiation-agent.md]]\n\nIf NO (not a task start request):\n   - Process the prompt normally\n   - Do nothing special"
  }
}
```

### Hook 2: Quality Assurance (agentStop)

**File**: `.kiro/hooks/after-implementation.kiro.hook`

```json
{
  "name": "Launch Quality Assurance Agents",
  "version": "1.0.0",
  "description": "After implementation, launch 10 quality agents in parallel",
  "when": {
    "type": "agentStop"
  },
  "then": {
    "type": "askAgent",
    "prompt": "Check if the agent that just completed was implementing a task (look for a commit with 'feat' or 'fix' type in the message).\n\nIf YES (this was task implementation):\n\nLaunch 10 sub-agents in parallel using invokeSubAgent:\n\n1. **Documentation Agent**\n   Reference: #[[file:.kiro/steering/documentation-agent.md]]\n   Task: Update inline comments, README, API docs\n\n2. **Property Testing Agent**\n   Reference: #[[file:.kiro/steering/property-testing-agent.md]]\n   Task: Create property-based tests (100+ iterations)\n\n3. **Unit Testing Agent**\n   Reference: #[[file:.kiro/steering/unit-testing-agent.md]]\n   Task: Create unit tests for specific cases and edge cases\n\n4. **Coverage Testing Agent**\n   Reference: #[[file:.kiro/steering/coverage-testing-agent.md]]\n   Task: Verify 90%+ coverage across all categories\n\n5. **Linting Agent**\n   Reference: #[[file:.kiro/steering/linting-agent.md]]\n   Task: Run linter with auto-fix\n\n6. **Formatting Agent**\n   Reference: #[[file:.kiro/steering/formatting-agent.md]]\n   Task: Run formatter (Prettier) with auto-fix\n\n7. **Pre-commit Validation Agent**\n   Reference: #[[file:.kiro/steering/pre-commit-agent.md]]\n   Task: Run all pre-commit hooks\n\n8. **Security Audit Agent**\n   Reference: #[[file:.kiro/steering/security-agent.md]]\n   Task: Check for vulnerabilities, secrets, injection risks\n\n9. **Type Checking Agent**\n   Reference: #[[file:.kiro/steering/type-checking-agent.md]]\n   Task: Verify TypeScript compilation\n\n10. **Build Verification Agent**\n    Reference: #[[file:.kiro/steering/build-verification-agent.md]]\n    Task: Verify project builds successfully\n\nEach agent should commit its changes independently with appropriate commit type (docs, test, chore).\n\nIf NO (this wasn't task implementation):\n   - Do nothing"
  }
}
```

### Hook 3: PR Submission with Clean History (agentStop)

**File**: `.kiro/hooks/after-quality-agents.kiro.hook`

```json
{
  "name": "Consolidate Commits and Create PR",
  "version": "1.0.0",
  "description": "After quality agents complete, consolidate commits and create PR",
  "when": {
    "type": "agentStop"
  },
  "then": {
    "type": "askAgent",
    "prompt": "Check if the agent that just completed was running quality checks (look for recent commits with 'docs', 'test', or 'chore' types).\n\nIf YES and all 10 quality agents have completed:\n\nReference steering file: pr-submission-agent.md\n#[[file:.kiro/steering/pr-submission-agent.md]]\n\nThe steering file contains detailed instructions for:\n\n1. **Validate Completion**: Verify all 10 agents completed successfully\n2. **Mark Task Complete**: Use taskStatus tool to mark task as completed\n3. **Soft Reset**: \n   ```bash\n   git reset --soft origin/main\n   ```\n   This preserves all changes but removes commit history\n\n4. **Re-commit Cleanly**: Create consolidated commits:\n   ```bash\n   # Stage implementation files\n   git add <implementation-files>\n   git commit -m \"<type>(<scope>): <task-id> <task-title>\"\n   \n   # Stage test files\n   git add <test-files>\n   git commit -m \"test(<scope>): add comprehensive tests for <task-context>\"\n   \n   # Stage documentation files\n   git add <doc-files>\n   git commit -m \"docs(<scope>): update documentation for <task-context>\"\n   \n   # Stage quality fix files\n   git add <remaining-files>\n   git commit -m \"chore(<scope>): apply code quality fixes for <task-context>\"\n   ```\n\n5. **Push Branch**: \n   ```bash\n   git push origin <branch-name>\n   ```\n\n6. **Create PR**: \n   ```bash\n   gh pr create --title \"<generated-title>\" --body \"<generated-body>\" --base main\n   ```\n\n7. **Add Labels**: Based on commit types found\n\nIf NO (quality agents not done yet):\n   - Do nothing"
  }
}
```

### Hook 4: CI/CD Monitoring and Fixes (agentStop)

**File**: `.kiro/hooks/after-pr-submission.kiro.hook`

```json
{
  "name": "Monitor CI/CD and Fix Failures",
  "version": "1.0.0",
  "description": "After PR submission, monitor CI/CD and automatically fix failures",
  "when": {
    "type": "agentStop"
  },
  "then": {
    "type": "askAgent",
    "prompt": "Check if the agent that just completed was creating/updating a PR (look for 'gh pr create' or 'git push' to PR branch).\n\nIf YES (this was PR submission):\n\nReference steering file: ci-cd-monitoring-agent.md\n#[[file:.kiro/steering/ci-cd-monitoring-agent.md]]\n\nThe steering file contains detailed instructions for:\n\n1. **Get PR Number**: Extract from previous output or use `gh pr list --head <branch>`\n\n2. **Monitor CI/CD**: \n   ```bash\n   gh pr checks <pr-number> --watch\n   ```\n   This will automatically poll and display check status\n\n3. **If All Pass**: Report success and exit\n\n4. **If Failures Detected**:\n   a. **Analyze Logs**: \n      ```bash\n      gh pr checks <pr-number>\n      gh run view <run-id> --log\n      ```\n   \n   b. **Fix Issues**: Based on failure type:\n      - Test failures: Fix tests or implementation\n      - Linting: Run linter and fix\n      - Coverage: Add missing tests\n      - Build: Fix compilation errors\n      - Type errors: Fix TypeScript issues\n   \n   c. **Soft Reset Again**: \n      ```bash\n      git fetch origin main\n      git reset --soft origin/main\n      ```\n   \n   d. **Re-commit Cleanly**: Same 4-commit structure as before\n   \n   e. **Force Push**: \n      ```bash\n      git push --force-with-lease origin <branch-name>\n      ```\n   \n   f. **Monitor Again**: Repeat from step 2\n   \n   g. **Max 3 Attempts**: If still failing after 3 fix attempts, report to user\n\n5. **Report Final Status**: Success or failure with details\n\nIf NO (this wasn't PR submission):\n   - Do nothing"
  }
}
```

## Steering Files

### 1. Task Initiation Agent

**File**: `.kiro/steering/task-initiation-agent.md`

```markdown
---
inclusion: manual
---

# Task Initiation Agent Instructions

You are triggered by a promptSubmit hook when the user requests to start a task.

## Your Scope

1. Detect task start request in user prompt
2. Mark task as in_progress
3. Create topic branch from up-to-date origin/main
4. Implement task according to spec
5. Create ONE implementation commit

## Task Detection

Look for patterns:
- "execute task 2.1"
- "start task 3.2"
- "implement task 5.1.2"
- "work on task 4.3"

Extract task ID (e.g., "2.1", "3.2.1")

## Branch Creation

**CRITICAL**: Always update main first!

```bash
# Step 1: Switch to main
git checkout main

# Step 2: Pull latest (NEVER skip this!)
git pull origin main

# Step 3: Create branch from origin/main
git checkout -b <type>/<task-id>-<description> origin/main

# Step 4: Verify
git branch --show-current
git log --oneline -1 origin/main
```

**Branch Naming**:
- type: feat, fix, docs, test, refactor
- task-id: from tasks.md (e.g., 2.1)
- description: brief kebab-case (e.g., "download-utility")

**Example**: `feat/2.1-download-utility`

## Task Status

```bash
# Mark as in_progress
taskStatus --file .kiro/specs/<spec-name>/tasks.md --task "<task-id> <task-title>" --status in_progress
```

## Implementation

1. **Read Context**:
   - Task details from tasks.md
   - Requirements from requirements.md
   - Design from design.md

2. **Implement Core Functionality**:
   - Focus ONLY on implementation
   - DO NOT write tests (testing agents will do this)
   - DO NOT update docs (documentation agent will do this)
   - DO NOT run linting/formatting (quality agents will do this)

3. **Create ONE Commit**:
   ```bash
   git add <implementation-files>
   git commit -m "<type>(<scope>): <task-id> <task-title>"
   ```

**Commit Format**:
- type: feat, fix, refactor, perf
- scope: module/component name
- task-id: from tasks.md
- task-title: brief description

**Example**: `feat(shared): 2.1 create download utility`

## Quality Checklist

Before committing:
- [ ] Task is marked as in_progress
- [ ] Branch created from up-to-date origin/main
- [ ] Branch name follows convention
- [ ] Implementation is complete and working
- [ ] Only implementation files are included
- [ ] Commit message follows Conventional Commits
- [ ] Commit is atomic and complete

Begin now.
```

### 2-10. Quality Agent Steering Files

Each quality agent gets its own detailed steering file with:
- Scope of work
- Specific tasks
- Tools to use
- Commit format
- Quality checklist

(I'll create abbreviated versions here for brevity)

**Files**:
- `documentation-agent.md` - Update comments, README, API docs
- `property-testing-agent.md` - Create property tests with 100+ iterations
- `unit-testing-agent.md` - Create unit tests for specific cases
- `coverage-testing-agent.md` - Verify 90%+ coverage
- `linting-agent.md` - Run ESLint with --fix
- `formatting-agent.md` - Run Prettier
- `pre-commit-agent.md` - Run pre-commit hooks
- `security-agent.md` - Check vulnerabilities, secrets
- `type-checking-agent.md` - Run tsc --noEmit
- `build-verification-agent.md` - Run build command

### 11. PR Submission Agent

**File**: `.kiro/steering/pr-submission-agent.md`

```markdown
---
inclusion: manual
---

# PR Submission Agent Instructions

You are triggered after all quality agents complete. Your job is to consolidate commits into clean history and create a PR.

## Your Scope

1. Validate all quality agents completed
2. Mark task as completed
3. Soft reset against origin/main
4. Re-commit with clean, consolidated commits
5. Push branch
6. Create PR with gh cli
7. Add labels

## Soft Reset Strategy

**Purpose**: Remove all iterative commits while preserving changes

```bash
# This removes all commits but keeps all file changes staged
git reset --soft origin/main

# Now you have a clean slate with all changes ready to commit
git status  # Shows all changes staged
```

## Clean Commit Structure

Create exactly 4 commits in this order:

### Commit 1: Implementation
```bash
git add <implementation-files>
git commit -m "<type>(<scope>): <task-id> <task-title>"
```

### Commit 2: Tests
```bash
git add <test-files>
git commit -m "test(<scope>): add comprehensive tests for <task-context>"
```

### Commit 3: Documentation
```bash
git add <doc-files>
git commit -m "docs(<scope>): update documentation for <task-context>"
```

### Commit 4: Quality
```bash
git add .  # Remaining files (linting, formatting fixes)
git commit -m "chore(<scope>): apply code quality fixes for <task-context>"
```

## Push and Create PR

```bash
# Push branch
git push origin <branch-name>

# Create PR
gh pr create \
  --title "<type>(<scope>): <task-id> <task-title>" \
  --body "<generated-body>" \
  --base main

# Add labels
gh pr edit <pr-number> --add-label "<labels>"
```

## PR Body Template

```markdown
## Task Reference

Task: <task-id> - <task-title>
Spec: `.kiro/specs/<spec-name>/tasks.md`

## Description

<Brief description>

## Changes

- Implementation: <summary>
- Tests: <summary>
- Documentation: <summary>
- Quality: <summary>

## Checklist

- [x] Implementation complete
- [x] Tests added (90%+ coverage)
- [x] Documentation updated
- [x] Code quality checks passed
- [ ] CI/CD checks passing (monitoring...)
```

## Quality Checklist

Before completing:
- [ ] All 10 quality agents completed successfully
- [ ] Task marked as completed
- [ ] Soft reset performed
- [ ] Exactly 4 clean commits created
- [ ] Branch pushed successfully
- [ ] PR created with correct title/body
- [ ] Labels added

Begin now.
```

### 12. CI/CD Monitoring Agent

**File**: `.kiro/steering/ci-cd-monitoring-agent.md`

```markdown
---
inclusion: manual
---

# CI/CD Monitoring Agent Instructions

You are triggered after PR creation/update. Your job is to monitor CI/CD and automatically fix failures.

## Your Scope

1. Monitor CI/CD with gh pr checks --watch
2. If failures, analyze logs
3. Fix issues
4. Soft reset and re-commit cleanly
5. Force push
6. Repeat (max 3 attempts)

## Monitoring

```bash
# Get PR number
PR_NUM=$(gh pr list --head $(git branch --show-current) --json number --jq '.[0].number')

# Watch checks
gh pr checks $PR_NUM --watch
```

This will automatically poll and exit when all checks complete.

## Failure Analysis

```bash
# List all checks
gh pr checks $PR_NUM

# View specific run logs
gh run view <run-id> --log
```

## Fix Strategy

Based on failure type:

### Test Failures
- Review failing test output
- Fix implementation or test
- Ensure all tests pass locally

### Linting Failures
- Run linter: `npm run lint --fix`
- Fix remaining issues manually

### Coverage Failures
- Run coverage: `npm run test:coverage`
- Add tests for uncovered lines

### Build Failures
- Run build: `npm run build`
- Fix compilation errors

### Type Errors
- Run type check: `npm run type-check`
- Fix TypeScript errors

## Soft Reset and Re-commit

**CRITICAL**: After fixing, always soft reset and re-commit cleanly!

```bash
# Fetch latest main
git fetch origin main

# Soft reset
git reset --soft origin/main

# Re-commit with same 4-commit structure
# (Implementation, Tests, Docs, Quality)
```

## Force Push

```bash
# Use --force-with-lease for safety
git push --force-with-lease origin <branch-name>
```

## Retry Logic

- Max 3 fix attempts
- After each fix, monitor again
- If still failing after 3 attempts, report to user

## Reporting

### Success
```
✅ PR CI/CD Checks Passed!

PR #<number>: <title>
URL: <url>

All checks passed:
- Pre-commit: ✓
- Linting: ✓
- Tests: ✓
- Coverage: ✓
- Build: ✓

Ready for review!
```

### Failure (after 3 attempts)
```
⚠️ PR CI/CD Checks Failed After 3 Fix Attempts

PR #<number>: <title>
URL: <url>

Remaining failures:
- <check-name>: <error-summary>

Manual intervention required.
View logs: gh run view <run-id> --log
```

## Quality Checklist

- [ ] Monitoring started successfully
- [ ] Failures detected and analyzed
- [ ] Fixes applied
- [ ] Soft reset performed
- [ ] Clean commits created
- [ ] Force push successful
- [ ] Final status reported

Begin now.
```

## Data Flow

### Context Passing

Hooks pass context through:
- Git commits (what was done)
- Commit messages (type of work)
- Branch names (task being worked on)
- Task status in tasks.md

### State Management

State is tracked via:
- Git history (commits, branches)
- Task status in tasks.md
- PR status on GitHub
- CI/CD check status

## Error Handling

### Hook-Level Error Handling

Each hook includes conditional logic:
```
If [condition]:
  [do work]
Else:
  [do nothing]
```

### Agent-Level Error Handling

Agents handle errors by:
- Logging errors clearly
- Continuing with other work when possible
- Reporting failures to user
- Providing actionable fix commands

## Performance

### Parallel Execution

- 10 quality agents run simultaneously
- Total time: max(agent times) not sum(agent times)
- Expected: 60-70% time savings vs sequential

### Timing Estimates

- Task initiation: 1-2 minutes
- Implementation: 5-15 minutes (varies by task)
- Quality agents (parallel): 3-8 minutes
- PR submission: 1-2 minutes
- CI/CD monitoring: 5-15 minutes
- **Total**: 15-42 minutes (typical: 20-25 minutes)

## Advantages

### Clean Commit History

- Professional, reviewable commits
- Easy to revert if needed
- Clear change narrative
- No "fix typo" or "oops" commits

### Automatic Quality

- 10 comprehensive quality checks
- All run in parallel
- No manual intervention needed

### Automatic CI/CD Fixes

- Detects failures automatically
- Attempts fixes automatically
- Maintains clean history even during fixes

### Zero Custom Code

- Just JSON and Markdown
- Easy to understand and modify
- No build process
- No dependencies

## Extensibility

### Adding Quality Agents

Currently at maximum (10 agents). To add more:
1. Replace less critical agent
2. Or combine related agents

### Customizing Workflow

Users can customize by:
- Editing hook prompts
- Editing steering files
- Adjusting commit structure
- Changing fix strategies

## Conclusion

This refactored workflow provides:
- **Clean commit history** through soft reset
- **Maximum parallelization** (10 quality agents)
- **Automatic CI/CD fixes** with clean re-commits
- **Zero custom code** (just hooks and steering)
- **Professional PRs** ready for review

The workflow is production-ready and maintainable through simple configuration file edits.
