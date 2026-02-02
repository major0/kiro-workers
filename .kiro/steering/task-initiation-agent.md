---
inclusion: manual
---

# Task Initiation Agent Instructions

You are triggered by a promptSubmit hook when the user requests to start a task from a spec's tasks.md file.

## Your Scope

1. Detect task start request in user prompt
2. Mark task as in_progress using taskStatus tool
3. Create topic branch from up-to-date origin/main
4. Implement task according to requirements and design
5. Create ONE implementation commit following Conventional Commits

## Task Detection Patterns

Look for these patterns in the user's prompt:
- "execute task X.Y"
- "start task X.Y"
- "implement task X.Y"
- "work on task X.Y"
- "run task X.Y"
- "do task X.Y"

Extract the task ID (e.g., "2.1", "3.2.1", "5.1.2")

**Examples:**
- "Execute task 2.1" → Task ID: 2.1
- "Start task 3.2.1" → Task ID: 3.2.1
- "Implement task 5" → Task ID: 5

## Branch Creation (CRITICAL)

**MANDATORY SEQUENCE - NEVER SKIP STEPS:**

```bash
# Step 1: Switch to main branch
git checkout main

# Step 2: Pull latest changes (REQUIRED - NEVER skip this!)
git pull origin main

# Step 3: ONLY NOW create new topic branch from updated main
git checkout -b <type>/<task-id>-<description> origin/main

# Step 4: Verify you're on the correct branch
git branch --show-current
```

**Why this matters:**
- Ensures branch starts from latest code
- Prevents merge conflicts
- Avoids integration issues
- Maintains clean git history

**Branch Naming Convention:**

```
<type>/<task-id>-<description>
```

**Type values:**
- `feat` - New feature implementation
- `fix` - Bug fix
- `refactor` - Code refactoring
- `test` - Test additions
- `docs` - Documentation updates
- `chore` - Maintenance tasks

**Task ID:**
- Extract from tasks.md (e.g., "2.1", "3.2.1")
- Use dots as-is, don't convert to dashes

**Description:**
- Brief kebab-case description
- 2-4 words maximum
- Describes what the task does

**Examples:**
- `feat/2.1-download-utility`
- `feat/3.2-pr-context-retrieval`
- `fix/5.3-duplicate-detection`
- `test/2.2-property-tests-download`

## Task Status Management

Before starting implementation, mark the task as in_progress:

```bash
taskStatus \
  --file .kiro/specs/<spec-name>/tasks.md \
  --task "<task-id> <task-title>" \
  --status in_progress
```

**Example:**
```bash
taskStatus \
  --file .kiro/specs/kiro-workers/tasks.md \
  --task "2.1 Create download utility" \
  --status in_progress
```

## Implementation Guidelines

### 1. Read Context First

Before implementing, read these files:
- **tasks.md** - Task details and requirements references
- **requirements.md** - Acceptance criteria and constraints
- **design.md** - Architecture and implementation approach

### 2. Focus on Core Implementation ONLY

**DO implement:**
- Core functionality described in the task
- Necessary types and interfaces
- Error handling for the implementation
- Input validation

**DO NOT implement (other agents will handle):**
- Tests (testing agents will create these)
- Documentation (documentation agent will add this)
- Linting fixes (linting agent will handle this)
- Formatting (formatting agent will handle this)
- Code quality improvements (quality agents will handle this)

### 3. Implementation Checklist

Before committing, verify:
- [ ] Task is marked as in_progress
- [ ] Branch created from up-to-date origin/main
- [ ] Branch name follows convention
- [ ] Implementation is complete and functional
- [ ] Code follows project conventions
- [ ] Only implementation files are included
- [ ] No tests, docs, or quality fixes included

### 4. File Organization

Follow project structure conventions:
- Shared utilities: `shared/utils/`
- Shared types: `shared/types/`
- Action code: `actions/<action-name>/src/`
- Configuration: Root or `.github/` directory

## Commit Format

Create ONE commit following Conventional Commits format:

```
<type>(<scope>): <task-id> <task-title>
```

**Components:**

**Type:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code restructuring
- `perf` - Performance improvement

**Scope:**
- Module or component name
- Examples: `shared`, `setup`, `pr-review`, `issue-review`

**Task ID:**
- From tasks.md (e.g., "2.1", "3.2.1")

**Task Title:**
- Brief description from tasks.md
- Lowercase
- No period at end

**Examples:**
```
feat(shared): 2.1 create download utility
feat(setup): 3.2 add AWS Secrets Manager support
fix(pr-review): 5.3 fix duplicate detection logic
refactor(shared): 4.1 extract common GitHub API methods
```

## Commit Process

```bash
# Stage only implementation files
git add <implementation-files>

# Commit with proper format
git commit -m "<type>(<scope>): <task-id> <task-title>"

# Verify commit
git log -1 --oneline
```

## Quality Verification

Before completing, verify:

1. **Branch Status:**
   ```bash
   git branch --show-current
   # Should show: <type>/<task-id>-<description>
   ```

2. **Commit Format:**
   ```bash
   git log -1 --pretty=format:"%s"
   # Should match: <type>(<scope>): <task-id> <task-title>
   ```

3. **Files Changed:**
   ```bash
   git diff --name-only HEAD~1
   # Should only show implementation files
   ```

4. **Task Status:**
   - Verify task is marked as in_progress in tasks.md

## Error Handling

### If prompt is NOT a task request:
- Process the prompt normally
- Do nothing special
- Don't create branches or mark tasks

### If task ID not found:
- Report error to user
- List available tasks from tasks.md
- Ask user to clarify which task to execute

### If branch creation fails:
- Check if already on a topic branch
- Verify main branch exists
- Ensure origin/main is accessible
- Report specific error to user

### If task is already in_progress or completed:
- Check current status in tasks.md
- Ask user if they want to continue or restart
- Don't automatically overwrite status

## Example Complete Workflow

```bash
# User prompt: "Execute task 2.1"

# 1. Detect task request
# Task ID: 2.1
# Task title: "Create download utility"

# 2. Mark task as in_progress
taskStatus \
  --file .kiro/specs/kiro-workers/tasks.md \
  --task "2.1 Create download utility" \
  --status in_progress

# 3. Update main and create branch
git checkout main
git pull origin main
git checkout -b feat/2.1-download-utility origin/main

# 4. Read context
# - Read .kiro/specs/kiro-workers/tasks.md
# - Read .kiro/specs/kiro-workers/requirements.md
# - Read .kiro/specs/kiro-workers/design.md

# 5. Implement core functionality
# - Create shared/utils/download.ts
# - Implement download function with retry logic
# - Add error handling
# - Add input validation

# 6. Commit implementation
git add shared/utils/download.ts
git commit -m "feat(shared): 2.1 create download utility"

# 7. Verify
git branch --show-current  # feat/2.1-download-utility
git log -1 --oneline       # Shows proper commit message
```

## Post-Implementation

After committing:
- Hook 2 will automatically trigger (after-implementation.json)
- Quality agents will launch in parallel
- Each agent will add tests, docs, and quality improvements
- You are done - let the workflow continue

## Important Reminders

1. **ALWAYS update main before creating branch** - This is NOT optional
2. **ONLY implement core functionality** - Don't add tests or docs
3. **Create ONE commit** - Not multiple commits
4. **Follow Conventional Commits** - Exact format required
5. **Verify branch name** - Must match convention
6. **Mark task in_progress** - Before starting work
7. **Read spec files** - Understand requirements and design

Begin now.
