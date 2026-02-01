# Design Document: Kiro Workers

## Overview

The Kiro Workers project implements four discrete GitHub Actions that integrate Kiro CLI capabilities into GitHub workflows. This design provides a comprehensive technical specification for building these actions with zero third-party dependencies (only @actions/* packages and Node.js built-ins).

**Actions Suite:**
1. **kiro-cli-setup**: Downloads, verifies, caches, and installs the Kiro CLI binary
2. **kiro-pr-review**: Analyzes pull requests using Kiro CLI with configurable agents
3. **kiro-issue-review**: Analyzes GitHub issues with duplicate detection and spec validation
4. **kiro-project-sync**: Synchronizes Kiro spec tasks to GitHub Projects with bidirectional sync

**Key Design Principles:**
- Zero third-party dependencies (security and supply chain risk mitigation)
- Modular architecture with shared utilities
- Configurable agent system with hierarchy (workflow > custom > default)
- Comprehensive error handling and logging
- Self-integration (dogfooding) for validation

**Technology Stack:**
- TypeScript (compiled to JavaScript for distribution)
- Node.js built-in modules (crypto, https, fs, path, child_process)
- @actions/* packages (core, github, tool-cache, exec, http-client)
- GitHub REST API via Octokit (no GitHub CLI dependency - direct API access)

**Important Note on GitHub CLI**: This design intentionally avoids depending on the GitHub CLI (`gh`) tool. Instead, all GitHub operations use the Octokit REST API client provided by `@actions/github`. This approach:
- Eliminates an external dependency (aligns with zero third-party dependencies goal)
- Provides direct programmatic access to GitHub data
- Avoids the overhead of spawning CLI processes
- Ensures consistent behavior across all runner environments

### Node.js Feasibility

**Why Node.js is Appropriate:**

GitHub Actions natively supports JavaScript/TypeScript actions, making Node.js the natural choice for this project. The GitHub Actions runtime provides:

1. **Native @actions/* packages**: Official toolkit packages (`@actions/core`, `@actions/github`, `@actions/tool-cache`, `@actions/exec`) are designed specifically for Node.js actions
2. **Octokit REST API client**: Full-featured GitHub API client with authentication, rate limiting, and retry logic built-in
3. **GitHub context**: Automatic access to workflow context (PR numbers, issue numbers, repository info) via `@actions/github.context`
4. **No external tools needed**: All required functionality (HTTP requests, file I/O, process execution, crypto) is available through Node.js built-ins

**What Node.js Provides:**

- **HTTP/HTTPS**: Native `https` module for downloading Kiro CLI binaries
- **Crypto**: Native `crypto` module for checksum verification
- **File System**: Native `fs` module for reading specs, agent configs, and task files
- **Process Execution**: Native `child_process` module for executing Kiro CLI
- **Path Manipulation**: Native `path` module for cross-platform path handling
- **GitHub API Access**: `@actions/github` provides authenticated Octokit client with zero configuration

**Alternative Considered: Shell Scripts**

Shell scripts were considered but rejected because:
- Limited cross-platform support (Windows compatibility issues)
- No native JSON parsing or complex data structures
- Difficult error handling and testing
- No type safety or IDE support
- Would still need to call external tools for GitHub API access

**Conclusion**: Node.js is not only feasible but optimal for this project. It provides all necessary capabilities through official packages and built-in modules, requires no external dependencies beyond the Kiro CLI itself, and integrates seamlessly with the GitHub Actions runtime.


## Architecture

### High-Level Structure

```
kiro-workers/
├── actions/
│   ├── kiro-cli-setup/
│   │   ├── action.yml          # Action metadata
│   │   ├── src/
│   │   │   └── main.ts         # Entry point
│   │   └── dist/               # Compiled output
│   ├── kiro-pr-review/
│   │   ├── action.yml
│   │   ├── src/
│   │   │   └── main.ts
│   │   └── dist/
│   ├── kiro-issue-review/
│   │   ├── action.yml
│   │   ├── src/
│   │   │   └── main.ts
│   │   └── dist/
│   └── kiro-project-sync/
│       ├── action.yml
│       ├── src/
│       │   └── main.ts
│       └── dist/
├── shared/
│   ├── utils/
│   │   ├── download.ts         # Binary download utilities
│   │   ├── checksum.ts         # Integrity verification
│   │   ├── github-api.ts       # GitHub API wrappers
│   │   ├── kiro-cli.ts         # Kiro CLI execution
│   │   ├── agent-loader.ts     # Agent configuration loading
│   │   └── error-handler.ts    # Error handling utilities
│   └── types/
│       └── index.ts            # Shared TypeScript types
└── .github/
    ├── workflows/
    │   ├── self-pr-review.yml
    │   ├── self-issue-review.yml
    │   └── self-project-sync.yml
    └── kiro/
        ├── pull-request/       # Default PR agent
        ├── issue/              # Default issue agent
        └── project/            # Default project agent
```


### Action Execution Flow

**Setup Action Flow:**
```
1. Parse inputs (version, cache-enabled, kiro-token, aws-config)
2. Resolve version (specific or latest from API)
3. Check tool-cache for existing binary
4. If not cached:
   a. Download binary for OS/arch
   b. Verify checksum
   c. Extract if needed
   d. Cache binary with version key
5. Add binary to PATH
6. Configure Kiro authentication:
   a. If kiro-token provided, use it directly
   b. If AWS config provided, retrieve from Secrets Manager
   c. Set up Kiro CLI authentication
7. Verify installation and authentication
8. Log version and exit
```

**Review Actions Flow (PR/Issue):**
```
1. Verify Kiro CLI availability
2. Parse inputs (token, prompt overrides)
3. Load agent configuration:
   a. Check for workflow prompt override
   b. Check for custom agent in .github/kiro/{type}/
   c. Fall back to default agent
4. Retrieve GitHub context (PR/issue data)
5. Retrieve additional context (linked issues, specs, duplicates)
6. Execute Kiro CLI with context and agent
7. Capture output
8. Post results as comment
9. Handle errors and exit
```

**Project Sync Flow:**
```
1. Verify Kiro CLI availability
2. Parse inputs (project-id, sync-mode, token)
3. Load agent configuration
4. Scan .kiro/specs/*/tasks.md files
5. Parse tasks and metadata
6. For each task:
   a. Check if corresponding issue exists
   b. Create or update issue
   c. Add to GitHub Project
   d. Sync status bidirectionally
7. Handle cross-repository scenarios
8. Log sync results and exit
```


### Agent Configuration System

The agent system provides a flexible hierarchy for customizing action behavior:

**Agent Hierarchy (highest to lowest precedence):**
1. **Workflow Prompt Override**: Specified directly in workflow YAML
2. **Custom Agent**: User-defined configuration in `.github/kiro/{type}/`
3. **Default Agent**: Built-in agent with sensible defaults

**Agent Directory Structure:**
```
.github/kiro/{pull-request|issue|project}/
├── prompt.md              # Agent prompt/instructions
├── config.json            # Agent configuration
└── code/                  # Optional custom code
    └── *.ts               # TypeScript modules
```

**Agent Configuration Schema:**
```typescript
interface AgentConfig {
  name: string;
  description: string;
  prompt?: string;           // Path to prompt file
  settings?: {
    maxTokens?: number;
    temperature?: number;
    // Action-specific settings
  };
  filters?: {
    filePatterns?: string[];  // For PR review
    labelFilters?: string[];  // For issue review
  };
}
```

**Default Agent Behaviors:**
- **PR Review**: Validates changes against `.kiro/specs/`, checks linked issues
- **Issue Review**: Validates scope against specs, detects duplicates
- **Project Sync**: Syncs all tasks to single project with standard mapping


## Components and Interfaces

### 1. Kiro CLI Setup Action

**Inputs (action.yml):**
```yaml
inputs:
  version:
    description: 'Kiro CLI version to install (default: latest)'
    required: false
    default: 'latest'
  cache-enabled:
    description: 'Enable caching of downloaded binary'
    required: false
    default: 'true'
  kiro-token:
    description: 'Kiro authentication token (recommended: use secrets)'
    required: false
  aws-region:
    description: 'AWS region for Secrets Manager (if using AWS OIDC)'
    required: false
  aws-secret-name:
    description: 'AWS Secrets Manager secret name containing Kiro token'
    required: false
```

**Authentication Methods:**

The Setup Action supports two authentication approaches:

1. **Direct Token (Recommended for most users)**:
   - Store Kiro token in GitHub Secrets
   - Pass via `kiro-token` input
   - Action configures Kiro CLI with token

2. **AWS OIDC + Secrets Manager (For AWS-integrated workflows)**:
   - Use GitHub OIDC to authenticate with AWS
   - Retrieve Kiro token from AWS Secrets Manager
   - Action configures Kiro CLI with retrieved token

**Core Functions:**

```typescript
// Version resolution
async function resolveVersion(requestedVersion: string): Promise<string> {
  // If specific version, return it
  // If 'latest', query Kiro release API
  // Return resolved version string (e.g., "1.2.3")
}

// Binary download with checksum verification
async function downloadKiroCLI(version: string, platform: string, arch: string): Promise<string> {
  // Construct download URL
  // Download binary using @actions/http-client
  // Download checksum file
  // Verify integrity using Node.js crypto module
  // Return path to downloaded binary
}

// Caching
async function cacheKiroCLI(binaryPath: string, version: string): Promise<string> {
  // Use @actions/tool-cache to cache binary
  // Cache key: kiro-cli-{version}-{platform}-{arch}
  // Return cached path
}

// PATH setup
async function addToPath(binaryPath: string): Promise<void> {
  // Use @actions/core.addPath()
  // Make binary executable (chmod on Unix)
}

// Authentication configuration
async function configureKiroAuth(token?: string, awsConfig?: AWSConfig): Promise<void> {
  // If direct token provided, use it
  // If AWS config provided, retrieve from Secrets Manager
  // Configure Kiro CLI with token (environment variable or config file)
  // Verify authentication works
}

// AWS Secrets Manager integration
async function retrieveKiroTokenFromAWS(region: string, secretName: string): Promise<string> {
  // Use AWS SDK (via @actions/core and OIDC)
  // Retrieve secret from Secrets Manager
  // Parse and return Kiro token
}
```


### 2. PR Review Action

**Inputs (action.yml):**
```yaml
inputs:
  github-token:
    description: 'GitHub token for API access'
    required: false
    default: ${{ github.token }}
  prompt-override:
    description: 'Custom prompt to override agent default'
    required: false
  file-patterns:
    description: 'File patterns to include in review (glob)'
    required: false
```

**Core Functions:**

```typescript
// Agent loading
async function loadPRAgent(workflowPrompt?: string): Promise<AgentConfig> {
  // Check for workflow prompt override
  // Check for custom agent in .github/kiro/pull-request/
  // Fall back to default agent
  // Return agent configuration
}

// PR context retrieval using Octokit REST API
async function getPRContext(octokit: Octokit, prNumber: number): Promise<PRContext> {
  // Use octokit.rest.pulls.get() for PR details
  // Use octokit.rest.pulls.listFiles() for changed files
  // Use octokit.rest.pulls.get() response to get diffs
  // Parse PR body for linked issues using regex patterns
  // No GitHub CLI dependency - all data from REST API
  // Return structured context
}

// Linked issue analysis using Octokit REST API
async function getLinkedIssues(octokit: Octokit, issueNumbers: number[]): Promise<Issue[]> {
  // Use octokit.rest.issues.get() for each linked issue
  // No GitHub CLI dependency - direct API access
  // Return issue details
}

// Spec validation using Node.js fs module
async function getRelatedSpecs(changedFiles: string[]): Promise<SpecFile[]> {
  // Use Node.js fs.readdir() and fs.readFile() to scan .kiro/specs/
  // Check if changed files relate to spec directories
  // Read relevant spec files directly from filesystem
  // No external tools needed
  // Return spec content
}

// Kiro CLI execution using @actions/exec
async function executeKiroCLI(agent: AgentConfig, context: PRContext): Promise<string> {
  // Prepare input JSON for Kiro CLI
  // Execute using @actions/exec.exec() with kiro command
  // Capture stdout/stderr using exec options
  // Return analysis results
}

// Comment posting
async function postPRComment(octokit: Octokit, prNumber: number, body: string): Promise<void> {
  // Use octokit.rest.issues.createComment()
  // Handle rate limits and errors
}
```


### 3. Issue Review Action

**Inputs (action.yml):**
```yaml
inputs:
  github-token:
    description: 'GitHub token for API access'
    required: false
    default: ${{ github.token }}
  prompt-override:
    description: 'Custom prompt to override agent default'
    required: false
  check-duplicates:
    description: 'Enable duplicate issue detection'
    required: false
    default: 'true'
```

**Core Functions:**

```typescript
// Agent loading
async function loadIssueAgent(workflowPrompt?: string): Promise<AgentConfig> {
  // Similar to PR agent loading
  // Check workflow > custom > default hierarchy
}

// Issue context retrieval
async function getIssueContext(octokit: Octokit, issueNumber: number): Promise<IssueContext> {
  // Get issue details (title, body, author, labels)
  // Get comments if needed
  // Return structured context
}

// Spec scope validation
async function validateIssueScope(issueContext: IssueContext): Promise<ScopeValidation> {
  // Check if .kiro/specs/ exists
  // Read spec requirements
  // Determine if issue is in scope
  // Return validation result
}

// Duplicate detection
async function findDuplicateIssues(
  octokit: Octokit,
  issueContext: IssueContext
): Promise<Issue[]> {
  // Fetch all repository issues (open and closed)
  // Compute semantic similarity (simple keyword matching)
  // Return potential duplicates with similarity scores
}

// Kiro CLI execution
async function executeKiroCLI(
  agent: AgentConfig,
  context: IssueContext,
  specs: SpecFile[],
  duplicates: Issue[]
): Promise<string> {
  // Prepare input JSON
  // Execute Kiro CLI
  // Return analysis results
}

// Comment posting
async function postIssueComment(octokit: Octokit, issueNumber: number, body: string): Promise<void> {
  // Use octokit.rest.issues.createComment()
}
```


### 4. Project Sync Action

**Inputs (action.yml):**
```yaml
inputs:
  github-token:
    description: 'GitHub token for API access'
    required: false
    default: ${{ github.token }}
  project-id:
    description: 'GitHub Project ID to sync to'
    required: true
  sync-mode:
    description: 'Sync mode: unidirectional or bidirectional'
    required: false
    default: 'bidirectional'
  cross-repo:
    description: 'Enable cross-repository management'
    required: false
    default: 'false'
```

**Core Functions:**

```typescript
// Agent loading
async function loadProjectAgent(workflowConfig?: string): Promise<AgentConfig> {
  // Load agent configuration
  // Support custom project mapping rules
}

// Task scanning
async function scanSpecTasks(): Promise<SpecTask[]> {
  // Scan .kiro/specs/*/tasks.md files
  // Parse markdown task lists
  // Extract task metadata (requirements, status)
  // Return structured tasks
}

// Task parsing
interface SpecTask {
  specName: string;
  taskId: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
  requirements: string[];
  isOptional: boolean;
}

// Issue synchronization
async function syncTaskToIssue(
  octokit: Octokit,
  task: SpecTask,
  projectId: string
): Promise<void> {
  // Check if issue exists for task (by label or custom field)
  // Create or update issue
  // Add to GitHub Project
  // Sync status bidirectionally
}

// Cross-repository handling
async function syncCrossRepository(
  octokit: Octokit,
  tasks: SpecTask[],
  projectId: string
): Promise<void> {
  // Tag issues with source repository
  // Avoid duplicate creation
  // Use labels/custom fields for tracking
}

// Bidirectional sync
async function syncStatusFromIssues(
  octokit: Octokit,
  projectId: string
): Promise<void> {
  // Query project issues
  // Update task status in tasks.md files
  // Commit changes if needed
}
```


### Shared Utilities

**Download Utility (shared/utils/download.ts):**
```typescript
// HTTP download with retry logic
async function downloadFile(url: string, destPath: string): Promise<void> {
  // Use @actions/http-client
  // Implement exponential backoff for transient failures
  // Stream to file using Node.js fs
}

// Platform detection
function getPlatform(): { os: string; arch: string } {
  // Use Node.js process.platform and process.arch
  // Map to Kiro CLI binary naming convention
}
```

**Checksum Utility (shared/utils/checksum.ts):**
```typescript
// Verify file integrity
async function verifyChecksum(filePath: string, expectedChecksum: string): Promise<boolean> {
  // Use Node.js crypto module
  // Compute SHA256 hash
  // Compare with expected value
}
```

**GitHub API Utility (shared/utils/github-api.ts):**
```typescript
// Wrapper for common GitHub API operations
class GitHubAPIClient {
  constructor(octokit: Octokit);

  async getPullRequest(prNumber: number): Promise<PullRequest>;
  async getIssue(issueNumber: number): Promise<Issue>;
  async listIssues(state?: 'open' | 'closed' | 'all'): Promise<Issue[]>;
  async createComment(issueNumber: number, body: string): Promise<void>;
  async addToProject(issueNumber: number, projectId: string): Promise<void>;
}
```

**Kiro CLI Utility (shared/utils/kiro-cli.ts):**
```typescript
// Execute Kiro CLI with structured input
async function executeKiro(command: string, input: any): Promise<string> {
  // Use @actions/exec
  // Pass input as JSON via stdin or temp file
  // Capture stdout/stderr
  // Handle exit codes
}

// Verify Kiro CLI availability
async function verifyKiroCLI(): Promise<boolean> {
  // Check if 'kiro' is in PATH
  // Verify version command works
}
```

**Agent Loader Utility (shared/utils/agent-loader.ts):**
```typescript
// Load agent configuration with hierarchy
async function loadAgent(
  agentType: 'pull-request' | 'issue' | 'project',
  workflowOverride?: string
): Promise<AgentConfig> {
  // Check for workflow override
  // Check for custom agent in .github/kiro/{type}/
  // Load default agent
  // Merge configurations
  // Return final agent config
}
```

**Error Handler Utility (shared/utils/error-handler.ts):**
```typescript
// Centralized error handling
class ActionError extends Error {
  constructor(message: string, public exitCode: number = 1) {
    super(message);
  }
}

function handleError(error: Error): never {
  // Log error using @actions/core.error()
  // Set failed status using @actions/core.setFailed()
  // Exit with appropriate code
}
```


## Data Models

### Core Types

```typescript
// Agent configuration
interface AgentConfig {
  name: string;
  description: string;
  promptPath?: string;
  prompt?: string;
  settings?: {
    maxTokens?: number;
    temperature?: number;
  };
  filters?: {
    filePatterns?: string[];
    labelFilters?: string[];
  };
}

// AWS configuration for Kiro token retrieval
interface AWSConfig {
  region: string;
  secretName: string;
}

// Kiro authentication configuration
interface KiroAuthConfig {
  method: 'direct' | 'aws-secrets-manager';
  token?: string;
  awsConfig?: AWSConfig;
}

// Pull request context
interface PRContext {
  number: number;
  title: string;
  body: string;
  author: string;
  labels: string[];
  changedFiles: ChangedFile[];
  linkedIssues: Issue[];
  relatedSpecs: SpecFile[];
}

interface ChangedFile {
  filename: string;
  status: 'added' | 'modified' | 'removed';
  additions: number;
  deletions: number;
  patch?: string;
}

// Issue context
interface IssueContext {
  number: number;
  title: string;
  body: string;
  author: string;
  labels: string[];
  state: 'open' | 'closed';
  createdAt: string;
}

// Spec file
interface SpecFile {
  path: string;
  name: string;
  content: string;
  requirements?: string;
  design?: string;
  tasks?: string;
}

// Spec task
interface SpecTask {
  specName: string;
  taskId: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
  requirements: string[];
  isOptional: boolean;
  parentTaskId?: string;
}

// Scope validation result
interface ScopeValidation {
  inScope: boolean;
  reason: string;
  relatedSpecs: string[];
}

// Duplicate detection result
interface DuplicateMatch {
  issue: Issue;
  similarityScore: number;
  matchingKeywords: string[];
}
```


### GitHub API Data Models

```typescript
// GitHub Issue (simplified)
interface Issue {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: Label[];
  user: User;
  created_at: string;
  updated_at: string;
}

interface Label {
  name: string;
  color: string;
}

interface User {
  login: string;
  id: number;
}

// GitHub Pull Request (simplified)
interface PullRequest extends Issue {
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  merged: boolean;
  mergeable: boolean | null;
}

// GitHub Project (v2 API)
interface Project {
  id: string;
  number: number;
  title: string;
  url: string;
}
```

### Kiro CLI Input/Output Models

```typescript
// Input to Kiro CLI for PR review
interface KiroPRInput {
  action: 'pr-review';
  context: {
    pr: PRContext;
    agent: AgentConfig;
    repository: {
      owner: string;
      name: string;
    };
  };
}

// Input to Kiro CLI for issue review
interface KiroIssueInput {
  action: 'issue-review';
  context: {
    issue: IssueContext;
    specs: SpecFile[];
    duplicates: DuplicateMatch[];
    agent: AgentConfig;
    repository: {
      owner: string;
      name: string;
    };
  };
}

// Input to Kiro CLI for project sync
interface KiroProjectInput {
  action: 'project-sync';
  context: {
    tasks: SpecTask[];
    projectId: string;
    syncMode: 'unidirectional' | 'bidirectional';
    agent: AgentConfig;
    repository: {
      owner: string;
      name: string;
    };
  };
}

// Output from Kiro CLI
interface KiroOutput {
  success: boolean;
  message: string;
  analysis?: string;
  suggestions?: string[];
  errors?: string[];
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following areas of potential redundancy:

1. **CLI Availability Checks**: Requirements 2.1, 5.1, and 7.1.1 all require verifying Kiro CLI availability. These can be combined into one property about precondition validation.

2. **Output Capture and Posting**: Requirements 2.6/2.7, 5.8/5.9 are similar patterns. These can be combined into properties about CLI execution and result posting.

3. **Agent Loading**: Requirements 4.5/4.6 and similar patterns in issue/project agents can be consolidated into properties about agent configuration loading.

4. **Error Handling**: Requirements 1.4, 9.1, 9.2, 9.5 all relate to error handling and can be consolidated into comprehensive error handling properties.

5. **Data Passing**: Requirements 2.5, 4.10, 5.7 all relate to passing context to Kiro CLI and can be combined.

The following properties eliminate redundancy while maintaining comprehensive coverage:


### Setup Action Properties

**Property 1: Platform-Specific Binary Selection**
*For any* runner platform and architecture combination, the Setup Action should construct the correct download URL that matches the platform's binary naming convention.
**Validates: Requirements 1.1**

**Property 2: Checksum Verification Correctness**
*For any* downloaded binary and its checksum file, the verification function should correctly identify matching checksums as valid and mismatching checksums as invalid.
**Validates: Requirements 1.2**

**Property 3: Cache Key Determinism**
*For any* resolved version string, the cache key should never contain the literal string "latest" and should always use the concrete version number.
**Validates: Requirements 1.8, 1.10**

**Property 4: Cache Hit Avoids Download**
*For any* version that exists in the tool cache, the Setup Action should retrieve the cached binary without initiating a new download.
**Validates: Requirements 1.9**

**Property 5: Version Resolution Consistency**
*For any* specific version string provided as input, the resolved version should equal the input version exactly.
**Validates: Requirements 1.6**

**Property 6: Installation Completeness**
*For any* successfully installed Kiro CLI binary, the binary should be executable and available in the system PATH.
**Validates: Requirements 1.3**

**Property 7: Error Exit Codes**
*For any* critical error during installation, the action should exit with a non-zero status code.
**Validates: Requirements 1.4, 9.5**

**Property 8: Authentication Configuration**
*For any* valid Kiro token (direct or from AWS Secrets Manager), the Setup Action should configure the Kiro CLI with the token and verify authentication succeeds.
**Validates: Requirements 8.1, 8.4, 8.6**


### PR Review Action Properties

**Property 8: PR Context Completeness**
*For any* pull request, the retrieved context should include all changed files, diffs, title, body, author, and labels.
**Validates: Requirements 2.2**

**Property 9: Issue Reference Parsing**
*For any* PR description containing issue references (e.g., "fixes #123", "closes #456"), the action should extract all referenced issue numbers.
**Validates: Requirements 2.3**

**Property 10: Linked Issue Retrieval**
*For any* set of linked issue numbers, the action should retrieve the complete issue data for all referenced issues.
**Validates: Requirements 2.4**

**Property 11: Spec File Matching**
*For any* set of changed files, the action should identify all related spec files in `.kiro/specs/` that correspond to the changed files.
**Validates: Requirements 4.2**

**Property 12: Agent Hierarchy Precedence**
*For any* combination of workflow prompt, custom agent, and default agent, the action should select the agent according to the hierarchy: workflow prompt > custom agent > default agent.
**Validates: Requirements 4.7, 4.8**

**Property 13: Agent Configuration Loading**
*For any* valid custom agent directory containing prompt.md and config.json, the action should successfully load all configuration files and custom code.
**Validates: Requirements 4.5, 4.6**

**Property 14: Agent Fallback on Error**
*For any* custom agent that fails to load, the action should fall back to the default agent and log a warning without failing the workflow.
**Validates: Requirements 4.9**

**Property 15: CLI Input Completeness**
*For any* PR review execution, the input passed to Kiro CLI should contain the PR context, linked issues, related specs, and selected agent configuration.
**Validates: Requirements 2.5, 4.10**

**Property 16: Output Capture and Comment Posting**
*For any* successful Kiro CLI execution, the captured output should be posted as a comment on the pull request.
**Validates: Requirements 2.6, 2.7**


### Issue Review Action Properties

**Property 17: Issue Context Completeness**
*For any* issue, the retrieved context should include title, body, author, labels, state, and creation timestamp.
**Validates: Requirements 5.2**

**Property 18: All Issues Retrieval**
*For any* repository, the action should retrieve all issues (both open and closed) for duplicate detection.
**Validates: Requirements 5.5**

**Property 19: Duplicate Detection**
*For any* issue and set of existing issues, the duplicate detection algorithm should identify issues with high semantic similarity based on title and body content.
**Validates: Requirements 5.6**

**Property 20: Duplicate Links in Comments**
*For any* set of detected duplicate issues, the posted comment should include links to all duplicate issues.
**Validates: Requirements 5.10**

**Property 21: Issue CLI Input Completeness**
*For any* issue review execution, the input passed to Kiro CLI should contain the issue context, spec files, duplicate matches, and selected agent configuration.
**Validates: Requirements 5.7**

**Property 22: Issue Output Capture and Comment Posting**
*For any* successful Kiro CLI execution for issue review, the captured output should be posted as a comment on the issue.
**Validates: Requirements 5.8, 5.9**


### Project Sync Action Properties

**Property 23: Task File Discovery**
*For any* repository with `.kiro/specs/` directory, the action should discover all `tasks.md` files in all spec subdirectories.
**Validates: Requirements 7.1.2**

**Property 24: Task Parsing Completeness**
*For any* valid tasks.md file, the parser should extract all tasks with their IDs, titles, descriptions, status, requirements references, and optional flags.
**Validates: Requirements 7.1.3**

**Property 25: Task-to-Issue Mapping**
*For any* spec task, the action should create or update exactly one corresponding GitHub issue.
**Validates: Requirements 7.1.4**

**Property 26: Issue Content Completeness**
*For any* created or updated issue, the issue body should contain the task description, requirements references, and spec context.
**Validates: Requirements 7.1.5**

**Property 27: Status Synchronization**
*For any* task with a status change in the spec file, the corresponding GitHub issue status should be updated to match.
**Validates: Requirements 7.1.6**

**Property 28: Project Membership**
*For any* synced issue, the issue should be added to the configured GitHub Project.
**Validates: Requirements 7.1.7**

**Property 29: Bidirectional Sync Round Trip**
*For any* task, if its status is updated in the spec file and synced to GitHub, then synced back, the final status should match the original update.
**Validates: Requirements 7.1.8**

**Property 30: Cross-Repository Tagging**
*For any* issue created in cross-repository mode, the issue should have labels or custom fields identifying its source repository.
**Validates: Requirements 7.2.2, 7.2.4**

**Property 31: Cross-Repository Duplicate Prevention**
*For any* task that has already been synced from one repository, syncing the same task from another repository should create a separate issue with distinct repository tags.
**Validates: Requirements 7.2.3, 7.2.5**


### Shared Utilities Properties

**Property 32: CLI Availability Verification**
*For any* action execution, if Kiro CLI is not available in PATH, the action should fail with a clear error message instructing users to add the Setup Action.
**Validates: Requirements 2.1, 2.8, 5.1, 5.11, 7.1.1, 7.1.9**

**Property 33: Error Logging Completeness**
*For any* error that occurs during action execution, detailed error information should be logged to the workflow logs.
**Validates: Requirements 9.1**

**Property 34: CLI Error Capture**
*For any* Kiro CLI execution that returns an error, the action should capture and report the error message.
**Validates: Requirements 9.2**

**Property 35: Retry with Exponential Backoff**
*For any* transient network error, the action should retry the operation with exponentially increasing delays between attempts.
**Validates: Requirements 9.4**

**Property 36: Progress Logging**
*For any* action execution, progress information should be logged at key stages (initialization, data retrieval, CLI execution, result posting).
**Validates: Requirements 9.6**

**Property 37: Debug Mode Verbosity**
*For any* action execution with debug mode enabled, the logs should contain additional diagnostic information beyond standard progress logs.
**Validates: Requirements 9.7**

**Property 38: Input Validation**
*For any* invalid configuration input, the action should report a clear validation error before attempting execution.
**Validates: Requirements 10.6**

**Property 39: Token Authentication**
*For any* GitHub API operation, the action should use the provided authentication token or fall back to the default GITHUB_TOKEN.
**Validates: Requirements 8.1, 8.2, 8.3, 8.4**


### Build and Dependency Properties

**Property 40: Conventional Commit Format Validation**
*For any* commit message, the validation function should correctly identify whether it follows the Conventional Commits specification format.
**Validates: Requirements 14.1, 14.2, 14.6**

**Property 41: Zero Third-Party Dependencies**
*For any* bundled action output, the dependency analysis should confirm that only @actions/* packages and Node.js built-in modules are included.
**Validates: Requirements 15.1, 15.2, 15.3, 15.6**


## Error Handling

### Error Categories

**1. Installation Errors (Setup Action)**
- Binary download failures (network errors, 404s)
- Checksum verification failures (corrupted downloads)
- Cache write failures (disk space, permissions)
- PATH modification failures

**2. Precondition Errors (All Review Actions)**
- Kiro CLI not found in PATH
- Invalid or expired authentication tokens
- Missing required inputs

**3. GitHub API Errors**
- Rate limit exceeded (429 responses)
- Permission denied (403 responses)
- Resource not found (404 responses)
- Network timeouts and transient failures

**4. Agent Configuration Errors**
- Custom agent directory not found
- Malformed agent configuration files
- Missing required agent files

**5. Kiro CLI Execution Errors**
- CLI process crashes or hangs
- Invalid CLI output format
- CLI returns error exit codes

**6. Data Processing Errors**
- Malformed task markdown files
- Invalid issue/PR data from GitHub API
- Parsing failures for issue references


### Error Handling Strategies

**Retry Logic:**
- Transient network errors: Retry up to 3 times with exponential backoff (1s, 2s, 4s)
- GitHub API rate limits: Wait for rate limit reset time before retrying
- Timeout errors: Increase timeout on retry (30s, 60s, 120s)

**Graceful Degradation:**
- Custom agent load failure → Fall back to default agent with warning
- Duplicate detection failure → Continue without duplicate information
- Spec file read failure → Continue with available specs

**Clear Error Messages:**
```typescript
// Example error message structure
interface ActionError {
  category: 'installation' | 'precondition' | 'api' | 'agent' | 'cli' | 'data';
  message: string;
  details?: string;
  suggestion?: string;
  exitCode: number;
}

// Example: Kiro CLI not found
{
  category: 'precondition',
  message: 'Kiro CLI not found in PATH',
  details: 'The kiro command is not available in the workflow environment',
  suggestion: 'Add the kiro-cli-setup action before this action in your workflow',
  exitCode: 1
}
```

**Logging Levels:**
- **Error**: Critical failures that prevent action completion
- **Warning**: Non-critical issues with fallback behavior
- **Info**: Progress information at key stages
- **Debug**: Detailed diagnostic information (enabled via input)

**Exit Codes:**
- `0`: Success
- `1`: General error
- `2`: Configuration error
- `3`: Precondition not met (e.g., CLI not found)
- `4`: GitHub API error
- `5`: Kiro CLI execution error


## Testing Strategy

### Dual Testing Approach

This project requires both **unit tests** and **property-based tests** for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs
- Together they provide comprehensive coverage: unit tests catch concrete bugs, property tests verify general correctness

**Balance**: Avoid writing too many unit tests. Property-based tests handle covering lots of inputs. Unit tests should focus on specific examples, integration points, and edge cases.

### Property-Based Testing Configuration

**Library Selection**: Use **fast-check** for TypeScript/JavaScript property-based testing

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `// Feature: kiro-workers, Property {number}: {property_text}`

**Example Property Test Structure**:
```typescript
import * as fc from 'fast-check';

// Feature: kiro-workers, Property 1: Platform-Specific Binary Selection
test('Platform-specific binary selection', () => {
  fc.assert(
    fc.property(
      fc.constantFrom('linux', 'darwin', 'win32'),
      fc.constantFrom('x64', 'arm64'),
      (platform, arch) => {
        const url = constructDownloadURL('1.0.0', platform, arch);
        expect(url).toContain(platform);
        expect(url).toContain(arch);
      }
    ),
    { numRuns: 100 }
  );
});
```


### Test Coverage by Component

**Setup Action Tests**:
- Property tests: Binary selection, checksum verification, cache key generation, version resolution
- Unit tests: Specific version downloads, cache hit scenarios, PATH modification
- Integration tests: End-to-end installation workflow
- Edge cases: Network failures, corrupted downloads, disk space issues

**PR Review Action Tests**:
- Property tests: Context retrieval, issue parsing, agent hierarchy, spec matching
- Unit tests: Specific PR formats, various issue reference patterns, agent loading scenarios
- Integration tests: Full PR review workflow with mocked GitHub API
- Edge cases: PRs with no changes, malformed PR descriptions, missing specs

**Issue Review Action Tests**:
- Property tests: Context retrieval, duplicate detection, agent loading
- Unit tests: Specific issue formats, duplicate matching algorithms, spec validation
- Integration tests: Full issue review workflow with mocked GitHub API
- Edge cases: Issues with no body, repositories without specs, empty issue lists

**Project Sync Action Tests**:
- Property tests: Task discovery, parsing, issue mapping, status sync, cross-repo handling
- Unit tests: Specific task formats, various markdown structures, project API calls
- Integration tests: Full sync workflow with mocked GitHub API
- Edge cases: Empty specs, malformed task files, project API failures

**Shared Utilities Tests**:
- Property tests: Download retry logic, error handling, token validation
- Unit tests: Specific error scenarios, logging output, checksum algorithms
- Edge cases: Rate limit handling, network timeouts, invalid tokens

### Test Data Generation

**Generators for Property Tests**:
```typescript
// Platform/architecture combinations
const platformArch = fc.record({
  platform: fc.constantFrom('linux', 'darwin', 'win32'),
  arch: fc.constantFrom('x64', 'arm64')
});

// Version strings
const versionString = fc.oneof(
  fc.constant('latest'),
  fc.tuple(fc.nat(10), fc.nat(20), fc.nat(50))
    .map(([major, minor, patch]) => `${major}.${minor}.${patch}`)
);

// PR context
const prContext = fc.record({
  number: fc.nat(10000),
  title: fc.string({ minLength: 10, maxLength: 100 }),
  body: fc.string({ minLength: 0, maxLength: 1000 }),
  changedFiles: fc.array(fc.record({
    filename: fc.string(),
    status: fc.constantFrom('added', 'modified', 'removed')
  }))
});

// Issue references in PR body
const issueReferences = fc.array(
  fc.nat(1000).map(n => `fixes #${n}`)
).map(refs => refs.join(', '));

// Task markdown
const taskMarkdown = fc.array(
  fc.record({
    id: fc.string(),
    title: fc.string(),
    status: fc.constantFrom('not_started', 'in_progress', 'completed'),
    optional: fc.boolean()
  })
).map(tasks =>
  tasks.map(t =>
    `- [${t.status === 'completed' ? 'x' : ' '}]${t.optional ? '*' : ''} ${t.id} ${t.title}`
  ).join('\n')
);
```

### Mocking Strategy

**GitHub API Mocking**:
- Use Octokit's built-in mocking capabilities
- Mock all API endpoints used by actions
- Simulate rate limits, errors, and edge cases

**Kiro CLI Mocking**:
- Mock CLI execution using test doubles
- Simulate various CLI outputs and error conditions
- Test timeout and crash scenarios

**File System Mocking**:
- Mock fs operations for agent loading and spec reading
- Test permission errors and missing files
- Verify file writes for bidirectional sync

### Continuous Integration

**Test Execution**:
- Run all tests on every PR
- Run property tests with increased iterations (1000) on main branch
- Run integration tests against real GitHub API in staging environment

**Coverage Requirements**:
- Minimum 80% code coverage for all actions
- 100% coverage for critical paths (checksum verification, error handling)
- Property tests must cover all 41 correctness properties

**Self-Integration Testing**:
- Use the actions on the kiro-workers repository itself
- Validate that PR reviews, issue reviews, and project sync work correctly
- Treat self-integration as acceptance testing
