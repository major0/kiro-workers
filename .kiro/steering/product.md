# Product Overview

Kiro Workers is a suite of GitHub Actions that integrate Kiro CLI capabilities into GitHub workflows. The project provides four discrete actions for automated code review, issue analysis, and project management.

## Core Actions

1. **kiro-cli-setup**: Downloads, verifies, caches, and installs the Kiro CLI binary in workflow environments
2. **kiro-pr-review**: Analyzes pull requests using Kiro CLI with configurable agents to validate changes against specifications
3. **kiro-issue-review**: Analyzes GitHub issues with duplicate detection and scope validation against project specs
4. **kiro-project-sync**: Synchronizes Kiro spec tasks to GitHub Projects with bidirectional status updates

## Key Principles

- **Zero third-party dependencies**: Only `@actions/*` packages and Node.js built-ins to minimize supply chain risk
- **Configurable agent system**: Three-tier hierarchy (workflow override > custom agent > default agent) for flexible behavior
- **Self-integration**: The project uses its own actions for validation (dogfooding)
- **Cross-platform support**: Works on Linux, macOS, and Windows runners

## Project Status

This is an **experimental, independent project** that is NOT officially affiliated with AWS or kiro.dev. APIs and behavior may change as the project evolves.
