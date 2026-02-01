# Implementation Plan: Kiro Workers

## Overview

This implementation plan breaks down the kiro-workers project into discrete, incremental coding tasks. Each task builds on previous work and focuses on creating working, testable code. The plan follows a bottom-up approach: shared utilities first, then individual actions, then integration and testing.

## Tasks

- [x] 1. Project setup and shared infrastructure
  - Set up TypeScript project structure with separate directories for each action
  - Configure tsconfig.json for GitHub Actions compatibility
  - Set up build tooling (compilation, bundling with ncc)
  - Create shared types in `shared/types/index.ts`
  - _Requirements: 15.1, 15.2, 15.3_

- [ ] 2. Implement shared utility modules
  - [ ] 2.1 Create download utility (`shared/utils/download.ts`)
    - Implement `downloadFile()` with retry logic using @actions/http-client
    - Implement `getPlatform()` for OS/arch detection
    - Use Node.js https and fs modules only
    - _Requirements: 1.1, 9.4_

  - [ ] 2.2 Write property test for download utility
    - **Property 35: Retry with Exponential Backoff**
    - **Validates: Requirements 9.4**

  - [ ] 2.3 Create checksum utility (`shared/utils/checksum.ts`)
    - Implement `verifyChecksum()` using Node.js crypto module
    - Support SHA256 hash verification
    - _Requirements: 1.2_

  - [ ] 2.4 Write property test for checksum utility
    - **Property 2: Checksum Verification Correctness**
    - **Validates: Requirements 1.2**

  - [ ] 2.5 Create error handler utility (`shared/utils/error-handler.ts`)
    - Implement ActionError class with exit codes
    - Implement `handleError()` function using @actions/core
    - _Requirements: 9.1, 9.5_

  - [ ] 2.6 Write property test for error handler
    - **Property 7: Error Exit Codes**
    - **Property 33: Error Logging Completeness**
    - **Validates: Requirements 1.4, 9.1, 9.5**


- [ ] 3. Implement GitHub API utility
  - [ ] 3.1 Create GitHub API client wrapper (`shared/utils/github-api.ts`)
    - Implement GitHubAPIClient class using @actions/github Octokit
    - Implement methods: getPullRequest, getIssue, listIssues, createComment
    - Add retry logic for rate limits and transient failures
    - _Requirements: 2.2, 5.2, 5.5, 9.3, 9.4_

  - [ ] 3.2 Write property tests for GitHub API client
    - **Property 8: PR Context Completeness**
    - **Property 17: Issue Context Completeness**
    - **Property 18: All Issues Retrieval**
    - **Validates: Requirements 2.2, 5.2, 5.5**

  - [ ] 3.3 Write unit tests for rate limit handling
    - Test rate limit detection and retry behavior
    - Test exponential backoff implementation
    - _Requirements: 9.3, 9.4_

- [ ] 4. Implement Kiro CLI utility
  - [ ] 4.1 Create Kiro CLI execution wrapper (`shared/utils/kiro-cli.ts`)
    - Implement `executeKiro()` using @actions/exec
    - Implement `verifyKiroCLI()` for availability check
    - Handle stdin/stdout for JSON input/output
    - _Requirements: 2.5, 2.6, 5.7, 5.8_

  - [ ] 4.2 Write property tests for CLI utility
    - **Property 32: CLI Availability Verification**
    - **Property 34: CLI Error Capture**
    - **Validates: Requirements 2.1, 2.8, 5.1, 5.11, 9.2**

- [ ] 5. Implement agent loader utility
  - [ ] 5.1 Create agent configuration loader (`shared/utils/agent-loader.ts`)
    - Implement `loadAgent()` with hierarchy support
    - Read agent files from `.github/kiro/{type}/` directories
    - Parse config.json and prompt.md files
    - Implement fallback to default agent on errors
    - _Requirements: 4.4, 4.5, 4.6, 4.8, 4.9_

  - [ ] 5.2 Write property tests for agent loader
    - **Property 12: Agent Hierarchy Precedence**
    - **Property 13: Agent Configuration Loading**
    - **Property 14: Agent Fallback on Error**
    - **Validates: Requirements 4.5, 4.6, 4.7, 4.8, 4.9**

- [ ] 6. Checkpoint - Ensure shared utilities tests pass
  - Run all property tests and unit tests for shared utilities
  - Verify zero third-party dependencies (only @actions/* and Node.js built-ins)
  - Ask the user if questions arise


- [ ] 7. Implement kiro-cli-setup action
  - [ ] 7.1 Create action metadata (`actions/kiro-cli-setup/action.yml`)
    - Define inputs: version, cache-enabled, kiro-token, aws-region, aws-secret-name
    - Define outputs: version, cache-hit
    - Specify Node.js runtime
    - _Requirements: 1.6, 1.7, 10.1_

  - [ ] 7.2 Implement version resolution
    - Implement `resolveVersion()` function
    - Query Kiro release API for latest version
    - Handle specific version inputs
    - _Requirements: 1.6, 1.7_

  - [ ] 7.3 Write property test for version resolution
    - **Property 5: Version Resolution Consistency**
    - **Validates: Requirements 1.6**

  - [ ] 7.4 Implement binary download and verification
    - Implement `downloadKiroCLI()` using download utility
    - Construct platform-specific download URLs
    - Verify checksums after download
    - _Requirements: 1.1, 1.2_

  - [ ] 7.5 Write property tests for binary download
    - **Property 1: Platform-Specific Binary Selection**
    - **Validates: Requirements 1.1**

  - [ ] 7.6 Implement caching logic
    - Use @actions/tool-cache for caching
    - Implement cache key generation (never use "latest")
    - Check cache before downloading
    - _Requirements: 1.8, 1.9, 1.10_

  - [ ] 7.7 Write property tests for caching
    - **Property 3: Cache Key Determinism**
    - **Property 4: Cache Hit Avoids Download**
    - **Validates: Requirements 1.8, 1.9, 1.10**

  - [ ] 7.8 Implement PATH setup and verification
    - Add binary to PATH using @actions/core
    - Make binary executable (chmod on Unix)
    - Verify installation with version check
    - _Requirements: 1.3, 1.5_

  - [ ] 7.9 Write property test for installation
    - **Property 6: Installation Completeness**
    - **Validates: Requirements 1.3**

  - [ ] 7.10 Implement Kiro authentication configuration
    - Support direct token input
    - Support AWS Secrets Manager retrieval
    - Configure Kiro CLI with token
    - Verify authentication works
    - _Requirements: 8.1, 8.4, 8.6_

  - [ ] 7.11 Write property test for authentication
    - **Property 8: Authentication Configuration**
    - **Validates: Requirements 8.1, 8.4, 8.6**

  - [ ] 7.12 Implement main entry point (`actions/kiro-cli-setup/src/main.ts`)
    - Wire all functions together
    - Add error handling and logging
    - Set action outputs
    - _Requirements: 1.4, 1.5, 9.1, 9.6_

  - [ ] 7.13 Write integration tests for setup action
    - Test complete installation workflow
    - Test cache hit scenarios
    - Test error scenarios
    - _Requirements: 1.1, 1.2, 1.3, 1.4_


- [ ] 8. Implement kiro-pr-review action
  - [ ] 8.1 Create action metadata (`actions/kiro-pr-review/action.yml`)
    - Define inputs: github-token, prompt-override, file-patterns
    - Specify Node.js runtime
    - _Requirements: 10.2_

  - [ ] 8.2 Implement PR context retrieval
    - Implement `getPRContext()` using GitHub API utility
    - Retrieve PR details, changed files, and diffs
    - Parse PR body for issue references (regex patterns)
    - _Requirements: 2.2, 2.3_

  - [ ] 8.3 Write property tests for PR context retrieval
    - **Property 8: PR Context Completeness**
    - **Property 9: Issue Reference Parsing**
    - **Validates: Requirements 2.2, 2.3**

  - [ ] 8.4 Implement linked issue retrieval
    - Implement `getLinkedIssues()` using GitHub API utility
    - Fetch all referenced issues
    - _Requirements: 2.4_

  - [ ] 8.5 Write property test for linked issues
    - **Property 10: Linked Issue Retrieval**
    - **Validates: Requirements 2.4**

  - [ ] 8.6 Implement spec file matching
    - Implement `getRelatedSpecs()` using Node.js fs module
    - Scan `.kiro/specs/` directory
    - Match changed files to spec directories
    - _Requirements: 4.2_

  - [ ] 8.7 Write property test for spec matching
    - **Property 11: Spec File Matching**
    - **Validates: Requirements 4.2**

  - [ ] 8.8 Implement default PR agent
    - Create default agent configuration in `.github/kiro/pull-request/`
    - Write default prompt for spec validation
    - _Requirements: 4.1_

  - [ ] 8.9 Implement PR review execution
    - Load agent using agent loader utility
    - Prepare CLI input with all context
    - Execute Kiro CLI
    - Capture output
    - _Requirements: 2.5, 2.6, 4.10_

  - [ ] 8.10 Write property tests for PR review execution
    - **Property 15: CLI Input Completeness**
    - **Validates: Requirements 2.5, 4.10**

  - [ ] 8.11 Implement comment posting
    - Post Kiro CLI output as PR comment
    - Handle API errors gracefully
    - _Requirements: 2.7_

  - [ ] 8.12 Write property test for comment posting
    - **Property 16: Output Capture and Comment Posting**
    - **Validates: Requirements 2.6, 2.7**

  - [ ] 8.13 Implement main entry point (`actions/kiro-pr-review/src/main.ts`)
    - Wire all functions together
    - Add error handling and logging
    - Verify Kiro CLI availability
    - _Requirements: 2.1, 2.8, 9.1, 9.6_

  - [ ] 8.14 Write integration tests for PR review action
    - Test complete PR review workflow
    - Test with various PR formats
    - Test error scenarios
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_


- [ ] 9. Implement kiro-issue-review action
  - [ ] 9.1 Create action metadata (`actions/kiro-issue-review/action.yml`)
    - Define inputs: github-token, prompt-override, check-duplicates
    - Specify Node.js runtime
    - _Requirements: 10.3_

  - [ ] 9.2 Implement issue context retrieval
    - Implement `getIssueContext()` using GitHub API utility
    - Retrieve issue details (title, body, labels, state)
    - _Requirements: 5.2_

  - [ ] 9.3 Write property test for issue context retrieval
    - **Property 17: Issue Context Completeness**
    - **Validates: Requirements 5.2**

  - [ ] 9.4 Implement duplicate detection
    - Implement `findDuplicateIssues()` function
    - Retrieve all repository issues
    - Compute semantic similarity (keyword matching)
    - Return potential duplicates with scores
    - _Requirements: 5.5, 5.6_

  - [ ] 9.5 Write property tests for duplicate detection
    - **Property 18: All Issues Retrieval**
    - **Property 19: Duplicate Detection**
    - **Validates: Requirements 5.5, 5.6**

  - [ ] 9.6 Implement spec scope validation
    - Implement `validateIssueScope()` function
    - Check if `.kiro/specs/` exists
    - Read spec requirements
    - Determine if issue is in scope
    - _Requirements: 5.3, 5.4_

  - [ ] 9.7 Implement default issue agent
    - Create default agent configuration in `.github/kiro/issue/`
    - Write default prompt for scope validation and duplicate detection
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 9.8 Implement issue review execution
    - Load agent using agent loader utility
    - Prepare CLI input with issue context, specs, and duplicates
    - Execute Kiro CLI
    - Capture output
    - _Requirements: 5.7, 5.8_

  - [ ] 9.9 Write property test for issue review execution
    - **Property 21: Issue CLI Input Completeness**
    - **Validates: Requirements 5.7**

  - [ ] 9.10 Implement comment posting with duplicate links
    - Post Kiro CLI output as issue comment
    - Include links to duplicate issues
    - Handle API errors gracefully
    - _Requirements: 5.9, 5.10_

  - [ ] 9.11 Write property tests for comment posting
    - **Property 20: Duplicate Links in Comments**
    - **Property 22: Issue Output Capture and Comment Posting**
    - **Validates: Requirements 5.9, 5.10**

  - [ ] 9.12 Implement main entry point (`actions/kiro-issue-review/src/main.ts`)
    - Wire all functions together
    - Add error handling and logging
    - Verify Kiro CLI availability
    - _Requirements: 5.1, 5.11, 9.1, 9.6_

  - [ ] 9.13 Write integration tests for issue review action
    - Test complete issue review workflow
    - Test duplicate detection scenarios
    - Test error scenarios
    - _Requirements: 5.1, 5.2, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_


- [ ] 10. Checkpoint - Ensure review actions tests pass
  - Run all property tests and unit tests for PR and issue review actions
  - Verify agent loading works correctly
  - Verify GitHub API integration works
  - Ask the user if questions arise

- [ ] 11. Implement kiro-project-sync action
  - [ ] 11.1 Create action metadata (`actions/kiro-project-sync/action.yml`)
    - Define inputs: github-token, project-id, sync-mode, cross-repo
    - Specify Node.js runtime
    - _Requirements: 10.4_

  - [ ] 11.2 Implement task file scanning
    - Implement `scanSpecTasks()` function
    - Scan `.kiro/specs/*/tasks.md` files using Node.js fs
    - Return list of task file paths
    - _Requirements: 7.1.2_

  - [ ] 11.3 Write property test for task scanning
    - **Property 23: Task File Discovery**
    - **Validates: Requirements 7.1.2**

  - [ ] 11.4 Implement task markdown parsing
    - Implement task parser for markdown format
    - Extract task ID, title, description, status, requirements
    - Identify optional tasks (marked with *)
    - Handle nested tasks
    - _Requirements: 7.1.3_

  - [ ] 11.5 Write property test for task parsing
    - **Property 24: Task Parsing Completeness**
    - **Validates: Requirements 7.1.3**

  - [ ] 11.6 Implement task-to-issue synchronization
    - Implement `syncTaskToIssue()` function
    - Check if issue exists for task (by label/custom field)
    - Create or update issue with task details
    - Add issue to GitHub Project
    - _Requirements: 7.1.4, 7.1.5, 7.1.7_

  - [ ] 11.7 Write property tests for task-to-issue sync
    - **Property 25: Task-to-Issue Mapping**
    - **Property 26: Issue Content Completeness**
    - **Property 28: Project Membership**
    - **Validates: Requirements 7.1.4, 7.1.5, 7.1.7**

  - [ ] 11.8 Implement status synchronization
    - Implement status sync from tasks.md to issues
    - Update issue status when task status changes
    - _Requirements: 7.1.6_

  - [ ] 11.9 Write property test for status sync
    - **Property 27: Status Synchronization**
    - **Validates: Requirements 7.1.6**

  - [ ] 11.10 Implement bidirectional sync
    - Implement sync from issues back to tasks.md
    - Update task status in markdown files
    - Handle file writes safely
    - _Requirements: 7.1.8_

  - [ ] 11.11 Write property test for bidirectional sync
    - **Property 29: Bidirectional Sync Round Trip**
    - **Validates: Requirements 7.1.8**

  - [ ] 11.12 Implement cross-repository support
    - Implement repository tagging for issues
    - Implement duplicate prevention across repos
    - Use labels/custom fields for tracking
    - _Requirements: 7.2.2, 7.2.3, 7.2.4, 7.2.5_

  - [ ] 11.13 Write property tests for cross-repo sync
    - **Property 30: Cross-Repository Tagging**
    - **Property 31: Cross-Repository Duplicate Prevention**
    - **Validates: Requirements 7.2.2, 7.2.3, 7.2.4, 7.2.5**

  - [ ] 11.14 Implement default project agent
    - Create default agent configuration in `.github/kiro/project/`
    - Write default configuration for project mapping
    - _Requirements: 7.4.1_

  - [ ] 11.15 Implement main entry point (`actions/kiro-project-sync/src/main.ts`)
    - Wire all functions together
    - Add error handling and logging
    - Verify Kiro CLI availability
    - _Requirements: 7.1.1, 7.1.9, 9.1, 9.6_

  - [ ] 11.16 Write integration tests for project sync action
    - Test complete sync workflow
    - Test bidirectional sync
    - Test cross-repository scenarios
    - Test error scenarios
    - _Requirements: 7.1.2, 7.1.3, 7.1.4, 7.1.5, 7.1.6, 7.1.7, 7.1.8_


- [ ] 12. Implement development tooling
  - [x] 12.1 Create .editorconfig file
    - Define formatting rules for all file types
    - Specify indentation, line endings, charset, trailing whitespace
    - _Requirements: 13.1, 13.2_

  - [x] 12.2 Create .pre-commit-config.yaml file
    - Configure pre-commit hooks for all file types
    - Add hooks for trailing whitespace, end-of-file fixes, YAML validation
    - Add TypeScript linting and formatting hooks
    - _Requirements: 13.3, 13.4, 13.5, 13.6_

  - [x] 12.3 Add Conventional Commits validation
    - Add commit message validation hook to pre-commit config
    - Implement commit message format validator
    - _Requirements: 14.1, 14.2, 14.3_

  - [ ] 12.4 Write property test for commit message validation
    - **Property 40: Conventional Commit Format Validation**
    - **Validates: Requirements 14.1, 14.2, 14.6**

- [ ] 13. Create comprehensive documentation
  - [ ] 13.1 Write README for kiro-cli-setup action
    - Document purpose, inputs, outputs, usage examples
    - Include authentication setup (GitHub Secrets and AWS OIDC)
    - Document required permissions
    - _Requirements: 11.1, 11.2, 11.9, 11.11, 11.12, 11.13, 11.14_

  - [ ] 13.2 Write README for kiro-pr-review action
    - Document purpose, inputs, usage examples
    - Include default agent and custom agent examples
    - Document required permissions
    - _Requirements: 11.1, 11.2, 11.3, 11.7, 11.9_

  - [ ] 13.3 Write README for kiro-issue-review action
    - Document purpose, inputs, usage examples
    - Include default agent and custom agent examples
    - Document required permissions
    - _Requirements: 11.1, 11.2, 11.4, 11.7, 11.9_

  - [ ] 13.4 Write README for kiro-project-sync action
    - Document purpose, inputs, usage examples
    - Include single-repo and cross-repo examples
    - Document required permissions
    - _Requirements: 11.1, 11.2, 11.5, 11.7, 11.9_

  - [ ] 13.5 Write main project README
    - Document all four actions
    - Include complete workflow example using all actions
    - Document zero third-party dependencies constraint
    - Include troubleshooting guide
    - _Requirements: 11.8, 11.10, 15.5_

  - [ ] 13.6 Write custom agent examples
    - Create example custom agents for PR, issue, and project sync
    - Document agent directory structure and configuration
    - Explain agent hierarchy
    - _Requirements: 11.6, 11.7_


- [ ] 14. Implement self-integration workflows
  - [ ] 14.1 Create PR review workflow (`.github/workflows/self-pr-review.yml`)
    - Use kiro-cli-setup action
    - Use kiro-pr-review action on project PRs
    - Configure with default agent
    - _Requirements: 12.1, 12.2, 12.5_

  - [ ] 14.2 Create issue review workflow (`.github/workflows/self-issue-review.yml`)
    - Use kiro-cli-setup action
    - Use kiro-issue-review action on project issues
    - Configure with default agent
    - _Requirements: 12.1, 12.3, 12.6_

  - [ ] 14.3 Create project sync workflow (`.github/workflows/self-project-sync.yml`)
    - Use kiro-cli-setup action
    - Use kiro-project-sync action on project specs
    - Configure with default agent
    - _Requirements: 12.1, 12.4, 12.7_

  - [ ] 14.4 Verify self-integration workflows
    - Test workflows on actual PRs, issues, and project sync
    - Validate that actions work correctly on the project itself
    - _Requirements: 12.8_

- [ ] 15. Build and distribution
  - [ ] 15.1 Configure build process
    - Set up TypeScript compilation
    - Configure @vercel/ncc for bundling
    - Create build scripts for all actions
    - _Requirements: 15.1, 15.2, 15.3_

  - [ ] 15.2 Verify zero third-party dependencies
    - Audit bundled output for each action
    - Ensure only @actions/* and Node.js built-ins are included
    - Create automated dependency check
    - _Requirements: 15.1, 15.2, 15.3, 15.6, 15.7_

  - [ ] 15.3 Write property test for dependency audit
    - **Property 41: Zero Third-Party Dependencies**
    - **Validates: Requirements 15.1, 15.2, 15.3, 15.6**

  - [ ] 15.4 Create distribution workflow
    - Build all actions
    - Commit dist/ directories
    - Tag releases
    - _Requirements: 15.1, 15.2, 15.3_

- [ ] 16. Final checkpoint - Complete test suite
  - Run all property tests with 100+ iterations
  - Run all unit tests
  - Run all integration tests
  - Verify self-integration workflows work
  - Verify zero third-party dependencies
  - Ensure all 41 correctness properties are tested
  - Ask the user if questions arise

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- Self-integration serves as acceptance testing
- Focus on highest quality results with thorough testing at each step

## Git Commit Requirements

**IMPORTANT**: Each completed task MUST be accompanied by a git commit following these rules:

1. **Commit Scope**: Include all work for the task (code, tests, docs, config) plus the tasks.md update marking the task complete
2. **Commit Message Format**: Follow Conventional Commits with task reference
   - Format: `<type>(<scope>): <task-id> <task-title>`
   - Example: `feat(shared): 2.1 Create download utility`
   - Example: `test(shared): 2.2 Write property test for download utility`
3. **Task Updates**: Always include the tasks.md file with the task checkbox marked as complete `[x]`
4. **Atomic Commits**: Each sub-task gets its own commit - do not combine multiple tasks
5. **No Unrelated Changes**: Commits should only contain changes related to the specific task

**Commit Type Guidelines**:
- `feat`: New functionality (implementation tasks)
- `test`: Test additions or modifications
- `docs`: Documentation changes
- `build`: Build system or tooling changes
- `chore`: Maintenance tasks (editorconfig, pre-commit setup)

_Requirements: 14.1, 14.2, 14.3, 14.4, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7_
