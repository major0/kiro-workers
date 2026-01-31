# Requirements Document

## Introduction

The Kiro Workers is a collection of four discrete GitHub Actions that integrate Kiro's AI capabilities into GitHub workflows. The suite consists of:
1. **kiro-cli-setup**: Sets up the Kiro CLI in GitHub Actions environments
2. **kiro-pr-review**: Performs AI-powered code reviews on pull requests
3. **kiro-issue-review**: Analyzes and processes GitHub issues
4. **kiro-project-sync**: Synchronizes Kiro specs with GitHub Projects and issues

Each action is independently configurable with isolated permissions and supports flexible prompting through default prompts, repository-level configuration files, and per-workflow prompt overrides.

## Glossary

- **GitHub_Action**: A workflow automation tool that runs in GitHub's CI/CD environment
- **Kiro_CLI**: The command-line interface for Kiro's AI-powered development tools
- **Setup_Action**: The kiro-cli-setup action that installs the Kiro CLI
- **PR_Review_Action**: The kiro-pr-review action that analyzes pull requests
- **Issue_Review_Action**: The kiro-issue-review action that analyzes issues
- **Project_Sync_Action**: The kiro-project-sync action that synchronizes specs with GitHub Projects
- **Pull_Request**: A GitHub feature for proposing and reviewing code changes
- **Issue**: A GitHub feature for tracking bugs, enhancements, and tasks
- **Default_Prompt**: A built-in generic prompt provided by the action
- **Repository_Prompt**: A custom prompt stored in `.github/kiro-action/` directory
- **Workflow_Prompt**: A prompt specified directly in the workflow YAML file
- **Prompt_Hierarchy**: The order of precedence for prompt selection (workflow > repository > default)
- **Default_Agent**: A built-in agent with default prompts and configuration provided by the action
- **Custom_Agent**: A user-defined agent with custom prompts, configuration, and code stored in `.github/kiro/`
- **Agent_Configuration**: Files and code that define an agent's behavior, stored in agent-specific directories
- **PR_Agent_Directory**: The `.github/kiro/pull-request/` directory containing PR agent configurations
- **Issue_Agent_Directory**: The `.github/kiro/issue/` directory containing issue agent configurations
- **Project_Agent_Directory**: The `.github/kiro/project/` directory containing project sync agent configurations
- **GitHub_Project**: A GitHub Projects board for tracking work items
- **Spec_Task**: A task defined in `.kiro/specs/*/tasks.md` files
- **Cross_Repository_Management**: The ability to manage GitHub Projects across multiple repositories
- **Authentication_Token**: A credential used to authorize GitHub API operations
- **Action_Permissions**: The specific GitHub permissions required by each action

## Requirements

### Requirement 1: Kiro CLI Setup Action

**User Story:** As a repository maintainer, I want to install the Kiro CLI in GitHub Actions, so that other Kiro actions can use it in my workflows.

#### Acceptance Criteria

1. WHEN the Setup_Action executes, THE Setup_Action SHALL download the appropriate Kiro_CLI binary for the runner's operating system
2. WHEN the Kiro_CLI is downloaded, THE Setup_Action SHALL verify the binary integrity using checksums
3. WHEN the binary is verified, THE Setup_Action SHALL make the Kiro_CLI executable and available in the workflow PATH
4. IF the Kiro_CLI installation fails, THEN THE Setup_Action SHALL report a clear error message and exit with a non-zero status code
5. WHEN the installation completes successfully, THE Setup_Action SHALL log the installed Kiro_CLI version
6. WHERE a specific Kiro_CLI version is requested, THE Setup_Action SHALL install that version and cache it under that version identifier
7. WHERE no version is specified, THE Setup_Action SHALL query the Kiro release API to determine the latest version
8. WHEN the latest version is determined, THE Setup_Action SHALL cache the binary under that specific version identifier
9. WHEN caching is enabled, THE Setup_Action SHALL check for a cached binary matching the resolved version before downloading
10. THE Setup_Action SHALL use the resolved version number (not "latest") as the cache key to ensure cache validity

### Requirement 2: Pull Request Review Action - Core Functionality

**User Story:** As a developer, I want AI-powered analysis of my pull requests, so that I can receive automated feedback on code changes.

#### Acceptance Criteria

1. WHEN the PR_Review_Action executes, THE PR_Review_Action SHALL verify that the Kiro_CLI is available in the PATH
2. WHEN analyzing a pull request, THE PR_Review_Action SHALL retrieve the pull request context including changed files and diffs
3. WHEN analyzing a pull request, THE PR_Review_Action SHALL check if the PR description references related or closing issues
4. WHEN linked issues are found, THE PR_Review_Action SHALL retrieve the issue content and evaluate if the PR changes address the issue
5. WHEN the Kiro_CLI is invoked, THE PR_Review_Action SHALL pass the pull request context and linked issue context to the Kiro_CLI
6. WHEN the Kiro_CLI completes analysis, THE PR_Review_Action SHALL capture the output
7. WHEN output is captured, THE PR_Review_Action SHALL post the results as comments on the pull request
8. IF the Kiro_CLI is not found, THEN THE PR_Review_Action SHALL report an error instructing users to add the Setup_Action first

### Requirement 3: Pull Request Review Action - Permissions

**User Story:** As a repository maintainer, I want the PR review action to have only the permissions it needs, so that I can maintain security.

#### Acceptance Criteria

1. THE PR_Review_Action SHALL require read permissions for repository contents
2. THE PR_Review_Action SHALL require read permissions for pull requests
3. THE PR_Review_Action SHALL require write permissions for pull request comments
4. THE PR_Review_Action SHALL document all required permissions in its README
5. WHEN insufficient permissions are granted, THE PR_Review_Action SHALL report a clear permission error

### Requirement 4: Pull Request Review Action - Agent Configuration

**User Story:** As a repository maintainer, I want to customize PR review agents with prompts and configuration, so that the action fits my team's needs.

#### Acceptance Criteria

1. THE PR_Review_Action SHALL include a Default_Agent with a default prompt that validates PR changes against `.kiro/` specs
2. WHEN the Default_Agent is used, THE PR_Review_Action SHALL check if the changed files relate to any specs in `.kiro/specs/`
3. WHEN related specs are found, THE PR_Review_Action SHALL validate that the changes comply with the spec requirements and design
4. THE PR_Review_Action SHALL check for Custom_Agent configuration in the PR_Agent_Directory
5. WHERE a Custom_Agent exists in `.github/kiro/pull-request/`, THE PR_Review_Action SHALL load the custom agent configuration
6. WHEN loading a Custom_Agent, THE PR_Review_Action SHALL read prompts, configuration files, and any custom code from the PR_Agent_Directory
7. WHERE a Workflow_Prompt is provided as an action input, THE PR_Review_Action SHALL override the agent's default prompt
8. THE PR_Review_Action SHALL follow the agent hierarchy: custom agent with workflow prompt > custom agent with default prompt > default agent
9. WHEN loading a Custom_Agent fails, THE PR_Review_Action SHALL fall back to the Default_Agent and log a warning
10. THE PR_Review_Action SHALL pass the selected agent configuration to the Kiro_CLI for analysis

### Requirement 5: Issue Review Action - Core Functionality

**User Story:** As a repository maintainer, I want AI-powered analysis of issues, so that I can automate issue triage and management.

#### Acceptance Criteria

1. WHEN the Issue_Review_Action executes, THE Issue_Review_Action SHALL verify that the Kiro_CLI is available in the PATH
2. WHEN analyzing an issue, THE Issue_Review_Action SHALL retrieve the issue context including title, body, and labels
3. WHEN analyzing an issue, THE Issue_Review_Action SHALL check if `.kiro/specs/` exists in the repository
4. WHEN specs exist, THE Issue_Review_Action SHALL validate that the issue is within the scope of the current requirements
5. WHEN analyzing an issue, THE Issue_Review_Action SHALL retrieve all existing issues (open and closed) from the repository
6. WHEN existing issues are retrieved, THE Issue_Review_Action SHALL check for potential duplicates using semantic similarity
7. WHEN the Kiro_CLI is invoked, THE Issue_Review_Action SHALL pass the issue context, spec context, and existing issues to the Kiro_CLI
8. WHEN the Kiro_CLI completes analysis, THE Issue_Review_Action SHALL capture the output
9. WHEN output is captured, THE Issue_Review_Action SHALL post the results as a comment on the issue
10. WHEN potential duplicates are found, THE Issue_Review_Action SHALL include links to the duplicate issues in the comment
11. IF the Kiro_CLI is not found, THEN THE Issue_Review_Action SHALL report an error instructing users to add the Setup_Action first

### Requirement 6: Issue Review Action - Permissions

**User Story:** As a repository maintainer, I want the issue review action to have only the permissions it needs, so that I can maintain security.

#### Acceptance Criteria

1. THE Issue_Review_Action SHALL require read permissions for repository contents
2. THE Issue_Review_Action SHALL require read permissions for issues
3. THE Issue_Review_Action SHALL require write permissions for issue comments
4. THE Issue_Review_Action SHALL document all required permissions in its README
5. WHEN insufficient permissions are granted, THE Issue_Review_Action SHALL report a clear permission error

### Requirement 7: Issue Review Action - Agent Configuration

**User Story:** As a repository maintainer, I want to customize issue review agents with prompts and configuration, so that the action fits my team's workflow.

#### Acceptance Criteria

1. THE Issue_Review_Action SHALL include a Default_Agent with a default prompt that validates issues against `.kiro/` specs and checks for duplicates
2. WHEN the Default_Agent is used, THE Issue_Review_Action SHALL validate the issue scope against existing specs
3. WHEN the Default_Agent is used, THE Issue_Review_Action SHALL check for duplicate issues across all repository issues
4. THE Issue_Review_Action SHALL check for Custom_Agent configuration in the Issue_Agent_Directory
5. WHERE a Custom_Agent exists in `.github/kiro/issue/`, THE Issue_Review_Action SHALL load the custom agent configuration
6. WHEN loading a Custom_Agent, THE Issue_Review_Action SHALL read prompts, configuration files, and any custom code from the Issue_Agent_Directory
7. WHERE a Workflow_Prompt is provided as an action input, THE Issue_Review_Action SHALL override the agent's default prompt
8. THE Issue_Review_Action SHALL follow the agent hierarchy: custom agent with workflow prompt > custom agent with default prompt > default agent
9. WHEN loading a Custom_Agent fails, THE Issue_Review_Action SHALL fall back to the Default_Agent and log a warning
10. THE Issue_Review_Action SHALL pass the selected agent configuration to the Kiro_CLI for analysis

### Requirement 7.1: Project Sync Action - Core Functionality

**User Story:** As a project manager, I want to automatically sync Kiro specs to GitHub Projects, so that I can track implementation progress.

#### Acceptance Criteria

1. WHEN the Project_Sync_Action executes, THE Project_Sync_Action SHALL verify that the Kiro_CLI is available in the PATH
2. WHEN syncing, THE Project_Sync_Action SHALL scan all `.kiro/specs/*/tasks.md` files in the repository
3. WHEN Spec_Tasks are found, THE Project_Sync_Action SHALL parse each task and its metadata
4. WHEN a GitHub_Project is configured, THE Project_Sync_Action SHALL create or update issues for each Spec_Task
5. WHEN creating issues, THE Project_Sync_Action SHALL include task description, requirements references, and spec context
6. WHEN updating issues, THE Project_Sync_Action SHALL sync task status changes from the spec files
7. WHEN issues are created or updated, THE Project_Sync_Action SHALL add them to the configured GitHub_Project
8. THE Project_Sync_Action SHALL maintain bidirectional sync between spec tasks and GitHub issues
9. IF the Kiro_CLI is not found, THEN THE Project_Sync_Action SHALL report an error instructing users to add the Setup_Action first

### Requirement 7.2: Project Sync Action - Cross-Repository Management

**User Story:** As an organization administrator, I want to manage GitHub Projects across multiple repositories, so that I can track work across my entire codebase.

#### Acceptance Criteria

1. WHERE Cross_Repository_Management is enabled, THE Project_Sync_Action SHALL support syncing to organization-level GitHub Projects
2. WHEN syncing across repositories, THE Project_Sync_Action SHALL tag issues with their source repository
3. WHEN multiple repositories sync to the same project, THE Project_Sync_Action SHALL avoid creating duplicate issues
4. THE Project_Sync_Action SHALL use issue labels or custom fields to track which spec and repository each issue belongs to
5. WHEN a task exists in multiple repositories, THE Project_Sync_Action SHALL create separate issues for each repository

### Requirement 7.3: Project Sync Action - Permissions

**User Story:** As a repository maintainer, I want the project sync action to have only the permissions it needs, so that I can maintain security.

#### Acceptance Criteria

1. THE Project_Sync_Action SHALL require read permissions for repository contents
2. THE Project_Sync_Action SHALL require write permissions for issues
3. THE Project_Sync_Action SHALL require write permissions for projects
4. WHERE Cross_Repository_Management is enabled, THE Project_Sync_Action SHALL require organization-level permissions
5. THE Project_Sync_Action SHALL document all required permissions in its README
6. WHEN insufficient permissions are granted, THE Project_Sync_Action SHALL report a clear permission error

### Requirement 7.4: Project Sync Action - Agent Configuration

**User Story:** As a repository maintainer, I want to customize project sync behavior, so that it fits my team's workflow.

#### Acceptance Criteria

1. THE Project_Sync_Action SHALL include a Default_Agent that syncs all tasks to a single GitHub_Project
2. THE Project_Sync_Action SHALL check for Custom_Agent configuration in the Project_Agent_Directory
3. WHERE a Custom_Agent exists in `.github/kiro/project/`, THE Project_Sync_Action SHALL load the custom agent configuration
4. WHEN loading a Custom_Agent, THE Project_Sync_Action SHALL read configuration for project mapping, issue templates, and sync rules
5. WHERE a Workflow_Prompt is provided as an action input, THE Project_Sync_Action SHALL override the agent's default behavior
6. THE Project_Sync_Action SHALL follow the agent hierarchy: custom agent with workflow config > custom agent with default config > default agent
7. WHEN loading a Custom_Agent fails, THE Project_Sync_Action SHALL fall back to the Default_Agent and log a warning
8. THE Project_Sync_Action SHALL pass the selected agent configuration to the Kiro_CLI for sync operations

### Requirement 8: Authentication and Token Management

**User Story:** As a repository maintainer, I want each action to handle authentication properly, so that they can interact with GitHub securely.

#### Acceptance Criteria

1. THE PR_Review_Action SHALL accept a GitHub authentication token as an input parameter
2. THE Issue_Review_Action SHALL accept a GitHub authentication token as an input parameter
3. THE Project_Sync_Action SHALL accept a GitHub authentication token as an input parameter
4. WHEN a token is not provided, THE actions SHALL attempt to use the default GITHUB_TOKEN
5. WHEN configuring the Kiro_CLI, THE actions SHALL pass the authentication token for GitHub API access
6. WHEN the authentication token is invalid or expired, THE actions SHALL report an authentication error and exit
7. WHEN accessing private repositories, THE actions SHALL use the provided token to authenticate all API requests
8. WHERE Cross_Repository_Management is enabled, THE Project_Sync_Action SHALL require a token with organization-level permissions

### Requirement 9: Error Handling and Logging

**User Story:** As a repository maintainer, I want clear error messages and logs from all actions, so that I can troubleshoot issues quickly.

#### Acceptance Criteria

1. WHEN any error occurs, THE actions SHALL log detailed error information to the workflow logs
2. WHEN the Kiro_CLI returns an error, THE actions SHALL capture and report the error message
3. WHEN GitHub API rate limits are exceeded, THE actions SHALL report the rate limit status
4. WHEN network errors occur, THE actions SHALL retry transient failures with exponential backoff
5. IF critical errors prevent completion, THEN THE actions SHALL exit with a non-zero status code
6. THE actions SHALL log progress information at key stages of execution
7. WHERE debug mode is enabled, THE actions SHALL log additional diagnostic information

### Requirement 10: Action Configuration and Inputs

**User Story:** As a repository maintainer, I want to configure each action's behavior, so that they work optimally for my repository.

#### Acceptance Criteria

1. THE Setup_Action SHALL accept an optional version input for specifying the Kiro_CLI version
2. THE PR_Review_Action SHALL accept optional inputs for custom prompts, file patterns, and configuration options
3. THE Issue_Review_Action SHALL accept optional inputs for custom prompts and configuration options
4. THE Project_Sync_Action SHALL accept optional inputs for project ID, sync mode, and cross-repository settings
5. THE actions SHALL provide sensible default values for all optional inputs
6. WHEN invalid configuration is provided, THE actions SHALL report clear validation errors
7. THE actions SHALL document all available inputs in their action.yml metadata files

### Requirement 11: Comprehensive Documentation

**User Story:** As a repository maintainer, I want complete documentation for all four actions, so that I can understand how to use and configure them.

#### Acceptance Criteria

1. THE project SHALL include a README.md file for each action (Setup_Action, PR_Review_Action, Issue_Review_Action, Project_Sync_Action)
2. WHEN documenting each action, THE documentation SHALL include a description, usage examples, and input parameters
3. THE PR_Review_Action documentation SHALL include examples of the Default_Agent and Custom_Agent configurations
4. THE Issue_Review_Action documentation SHALL include examples of the Default_Agent and Custom_Agent configurations
5. THE Project_Sync_Action documentation SHALL include examples of single-repository and cross-repository sync configurations
6. THE documentation SHALL include examples of creating custom agents in `.github/kiro/pull-request/`, `.github/kiro/issue/`, and `.github/kiro/project/`
7. THE documentation SHALL explain the agent hierarchy and how workflow prompts override agent defaults
8. THE documentation SHALL include a complete workflow example showing all four actions working together
9. THE documentation SHALL document all required permissions for each action
10. THE documentation SHALL include troubleshooting guidance for common issues
11. THE documentation SHALL include instructions for storing the Kiro CLI access token in GitHub Secrets
12. THE documentation SHALL include examples of using GitHub OIDC to authenticate with AWS
13. THE documentation SHALL include examples of retrieving the Kiro CLI token from AWS Secrets Manager
14. THE documentation SHALL explain security best practices for token management in both approaches

### Requirement 12: Self-Integration (Dogfooding)

**User Story:** As a project maintainer, I want the GitHub Kiro Action project to use its own actions, so that we validate functionality and demonstrate real-world usage.

#### Acceptance Criteria

1. THE project SHALL include a GitHub workflow that uses the Setup_Action to install the Kiro_CLI
2. THE project SHALL include a GitHub workflow that uses the PR_Review_Action to review pull requests on the project itself
3. THE project SHALL include a GitHub workflow that uses the Issue_Review_Action to analyze issues on the project itself
4. THE project SHALL include a GitHub workflow that uses the Project_Sync_Action to sync the project's own specs to a GitHub_Project
5. THE project SHALL include a Default_Agent configuration in `.github/kiro/pull-request/` for PR reviews
6. THE project SHALL include a Default_Agent configuration in `.github/kiro/issue/` for issue analysis
7. THE project SHALL include a Default_Agent configuration in `.github/kiro/project/` for project sync
8. WHEN the project's own workflows run, THE actions SHALL successfully analyze the project's code, issues, and sync tasks
9. THE self-integration workflows SHALL serve as living examples in the documentation

### Requirement 13: Development Tooling Configuration

**User Story:** As a contributor, I want consistent code formatting and quality checks, so that the codebase remains maintainable.

#### Acceptance Criteria

1. THE project SHALL include an .editorconfig file that defines formatting rules for all file types in the repository
2. THE .editorconfig file SHALL specify rules for indentation, line endings, charset, and trailing whitespace
3. THE project SHALL include a .pre-commit-config.yaml file that configures pre-commit hooks
4. THE pre-commit configuration SHALL include hooks for all file types checked into the repository
5. THE pre-commit configuration SHALL include hooks for trailing whitespace, end-of-file fixes, and YAML validation
6. WHERE language-specific files exist, THE pre-commit configuration SHALL include appropriate linters and formatters
7. THE project documentation SHALL include instructions for setting up pre-commit hooks for contributors
