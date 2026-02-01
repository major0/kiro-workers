# Kiro Workers

> **Experimental Project**: A suite of GitHub Actions for seamless Kiro CLI integration in your workflows

> ⚠️ **Important**: This is an independent, experimental project and is **NOT** officially part of, endorsed by, or affiliated with AWS or kiro.dev in any way. This is a small, community-driven effort to explore GitHub Actions integration with Kiro CLI.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Kiro Workers is a collection of four discrete GitHub Actions that bring the power of Kiro CLI directly into your GitHub workflows. These actions enable automated code review, issue analysis, and project management with zero third-party dependencies—using only official `@actions/*` packages and Node.js built-ins.

**What is Kiro CLI?** Kiro is an AI-powered development assistant that helps teams maintain code quality, validate specifications, and manage project tasks. These actions integrate Kiro's capabilities into your GitHub workflow automation.

## Actions Suite

### 🔧 [kiro-cli-setup](./actions/kiro-cli-setup/)

Downloads, verifies, caches, and installs the Kiro CLI binary in your workflow environment.

**Key Features:**

- Automatic version resolution (latest or specific version)
- Checksum verification for security
- Intelligent caching to speed up workflows
- Multiple authentication methods (direct token or AWS Secrets Manager)
- Cross-platform support (Linux, macOS, Windows)

### 🔍 [kiro-pr-review](./actions/kiro-pr-review/)

Analyzes pull requests using Kiro CLI with configurable agents to validate changes against specifications.

**Key Features:**

- Automatic PR context gathering (changed files, diffs, linked issues)
- Spec validation against `.kiro/specs/` directory
- Configurable review agents (workflow override, custom, or default)
- Intelligent comment posting with analysis results
- Links to related issues and specifications

### 📋 [kiro-issue-review](./actions/kiro-issue-review/)

Analyzes GitHub issues with duplicate detection and scope validation against project specifications.

**Key Features:**

- Automatic issue context gathering
- Duplicate issue detection with semantic similarity
- Scope validation against project specs
- Configurable review agents
- Helpful comment posting with recommendations

### 🔄 [kiro-project-sync](./actions/kiro-project-sync/)

Synchronizes Kiro spec tasks to GitHub Projects with bidirectional status updates.

**Key Features:**

- Automatic task discovery from `.kiro/specs/*/tasks.md` files
- Task-to-issue mapping and creation
- Bidirectional status synchronization
- GitHub Projects integration
- Cross-repository support for monorepo workflows

## Key Features

### 🔒 Zero Third-Party Dependencies

All actions are built using only:

- Official `@actions/*` packages from GitHub
- Node.js built-in modules (`crypto`, `https`, `fs`, `path`, `child_process`)

This approach minimizes supply chain risk and ensures maximum security and reliability.

### 🎯 Configurable Agent System

Each action supports a flexible three-tier agent hierarchy:

1. **Workflow Prompt Override**: Specify custom prompts directly in your workflow YAML
2. **Custom Agent**: Define your own agent in `.github/kiro/{type}/` with custom prompts and configuration
3. **Default Agent**: Sensible defaults that work out of the box

### 🔄 Self-Integration (Dogfooding)

This project uses its own actions for PR reviews, issue analysis, and project management—validating functionality through real-world usage.

### 🌐 Cross-Platform Support

All actions work seamlessly on:

- Linux (x64, arm64)
- macOS (x64, arm64)
- Windows (x64, arm64)

## Quick Start

### Using the Actions (No Installation Required!)

You don't need to clone or install anything to use these actions. Simply reference them in your GitHub workflow files:

```yaml
name: Kiro Integration

on:
  pull_request:
  issues:
    types: [opened, edited]

jobs:
  pr-review:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Kiro CLI
        uses: <owner>/kiro-workers/actions/kiro-cli-setup@v1.0.0
        with:
          kiro-token: ${{ secrets.KIRO_TOKEN }}

      - name: Review Pull Request
        uses: <owner>/kiro-workers/actions/kiro-pr-review@v1.0.0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

That's it! The actions run directly in your workflow - no cloning or setup needed.

### Basic Workflow Example

Here's a complete workflow that uses all four actions:

```yaml
name: Kiro Integration

on:
  pull_request:
  issues:
    types: [opened, edited]
  schedule:
    - cron: '0 0 * * *' # Daily project sync

jobs:
  setup-kiro:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Kiro CLI
        uses: ./actions/kiro-cli-setup
        with:
          version: 'latest'
          cache-enabled: 'true'
          kiro-token: ${{ secrets.KIRO_TOKEN }}

  pr-review:
    needs: setup-kiro
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Kiro CLI
        uses: ./actions/kiro-cli-setup
        with:
          kiro-token: ${{ secrets.KIRO_TOKEN }}

      - name: Review Pull Request
        uses: ./actions/kiro-pr-review
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}

  issue-review:
    needs: setup-kiro
    if: github.event_name == 'issues'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Kiro CLI
        uses: ./actions/kiro-cli-setup
        with:
          kiro-token: ${{ secrets.KIRO_TOKEN }}

      - name: Review Issue
        uses: ./actions/kiro-issue-review
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          check-duplicates: 'true'

  project-sync:
    needs: setup-kiro
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Kiro CLI
        uses: ./actions/kiro-cli-setup
        with:
          kiro-token: ${{ secrets.KIRO_TOKEN }}

      - name: Sync to GitHub Projects
        uses: ./actions/kiro-project-sync
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          project-id: 'PVT_kwDOABcD1234'
          sync-mode: 'bidirectional'
```

### Authentication Setup

#### Option 1: Direct Token (Recommended)

1. Obtain a Kiro authentication token from your Kiro account
2. Add it to your repository secrets as `KIRO_TOKEN`
3. Reference it in your workflow: `kiro-token: ${{ secrets.KIRO_TOKEN }}`

#### Option 2: AWS Secrets Manager (For AWS-Integrated Workflows)

1. Store your Kiro token in AWS Secrets Manager
2. Configure GitHub OIDC for AWS authentication
3. Use AWS parameters in the setup action:

```yaml
- name: Setup Kiro CLI
  uses: ./actions/kiro-cli-setup
  with:
    aws-region: 'us-east-1'
    aws-secret-name: 'kiro-token'
```

## Documentation

Each action has detailed documentation in its respective directory:

- [kiro-cli-setup Documentation](./actions/kiro-cli-setup/README.md)
- [kiro-pr-review Documentation](./actions/kiro-pr-review/README.md)
- [kiro-issue-review Documentation](./actions/kiro-issue-review/README.md)
- [kiro-project-sync Documentation](./actions/kiro-project-sync/README.md)

### Custom Agents

Learn how to create custom agents for tailored behavior:

- [Custom Agent Guide](./docs/custom-agents.md) _(coming soon)_
- [Agent Configuration Reference](./docs/agent-config.md) _(coming soon)_

## Experimental Status

⚠️ **This project is experimental** and is being developed to evaluate the integration of Kiro CLI with GitHub Actions. While functional, the APIs and behavior may change as we gather feedback and refine the implementation.

**Important Disclaimers:**

- **Not officially affiliated**: This project is NOT part of, endorsed by, or affiliated with AWS or kiro.dev
- **Independent effort**: This is a small, community-driven experimental project
- **APIs may change**: APIs and behavior may change between versions
- **Features in validation**: Some features are still being validated
- **Documentation evolving**: Documentation is actively being improved
- **Community contributions welcome**: We welcome feedback and contributions

**Production Use:** While the actions are functional, we recommend thorough testing in your environment before relying on them for critical workflows. This is an independent experiment, not an official product.

## Architecture

### Project Structure

```
kiro-workers/
├── actions/
│   ├── kiro-cli-setup/       # CLI installation action
│   ├── kiro-pr-review/        # PR review action
│   ├── kiro-issue-review/     # Issue review action
│   └── kiro-project-sync/     # Project sync action
├── shared/
│   ├── utils/                 # Shared utility modules
│   └── types/                 # Shared TypeScript types
├── .github/
│   ├── workflows/             # Self-integration workflows
│   └── kiro/                  # Default agents
└── docs/                      # Additional documentation
```

### Design Principles

1. **Zero Third-Party Dependencies**: Only `@actions/*` and Node.js built-ins
2. **Modular Architecture**: Shared utilities for common functionality
3. **Configurable Agents**: Flexible three-tier hierarchy for customization
4. **Comprehensive Error Handling**: Clear messages and graceful degradation
5. **Self-Integration**: Dogfooding for validation and continuous improvement

## Contributing

We welcome contributions! If you want to **contribute to developing these actions**, see [DEVELOPMENT.md](./DEVELOPMENT.md) for setup instructions.

**Note**: You only need to clone this repository if you're contributing code. To use the actions in your workflows, just reference them as shown in the Quick Start section above.

### How to Contribute

1. **Report Issues**: Found a bug or have a feature request? [Open an issue](../../issues/new)
2. **Submit PRs**: Have a fix or improvement? See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup
3. **Share Feedback**: Let us know how you're using these actions and what could be better
4. **Improve Documentation**: Help us make the docs clearer and more comprehensive

### Development Setup

**For Contributors Only** - See [CONTRIBUTING.md](./CONTRIBUTING.md) for complete development setup instructions.

Quick overview:

```bash
# Clone the repository
git clone https://github.com/your-org/kiro-workers.git
cd kiro-workers

# Install dependencies
npm install

# Build all actions
npm run build

# Run tests
npm test

# Run property-based tests
npm run test:properties
```

### Commit Guidelines

**For Contributors** - This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(setup): add AWS Secrets Manager support
fix(pr-review): handle PRs with no changed files
docs(readme): update authentication examples
test(shared): add property tests for checksum verification
```

### Code Quality

**For Contributors** - All code must meet these standards:

- **TypeScript**: All code is written in TypeScript with strict type checking
- **Testing**: Comprehensive unit tests and property-based tests
- **Linting**: Pre-commit hooks ensure code quality (see [CONTRIBUTING.md](./CONTRIBUTING.md))
- **Documentation**: All public APIs must be documented

## Requirements

### For Users (Using the Actions)

- **GitHub Actions Runner**: Linux, macOS, or Windows
- **Kiro CLI**: Automatically installed by `kiro-cli-setup` action
- **Permissions**: Varies by action (see individual action documentation)

No local installation required - actions run in your GitHub workflows.

### For Contributors (Developing the Actions)

- **Node.js**: 20.x or later
- **npm**: 9.x or later
- **Python**: 3.7+ (for pre-commit hooks)
- **Git**: Latest version

See [DEVELOPMENT.md](./DEVELOPMENT.md) for complete setup instructions.

## Troubleshooting

### Common Issues

**Kiro CLI not found**

- Ensure `kiro-cli-setup` action runs before other Kiro actions
- Check that the setup action completed successfully

**Authentication failures**

- Verify your `KIRO_TOKEN` secret is set correctly
- For AWS Secrets Manager, ensure OIDC is configured properly

**Rate limit errors**

- GitHub API rate limits may affect actions on busy repositories
- Actions automatically retry with exponential backoff

**Custom agent not loading**

- Verify agent files exist in `.github/kiro/{type}/` directory
- Check agent configuration JSON is valid
- Review workflow logs for specific error messages

For more help, see the [Troubleshooting Guide](./docs/troubleshooting.md) _(coming soon)_ or [open an issue](../../issues/new).

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgments

- Built with [GitHub Actions Toolkit](https://github.com/actions/toolkit)
- Integrates with Kiro CLI (this project is NOT officially affiliated with kiro.dev)
- Inspired by the need for better AI-assisted code review and project management

**Disclaimer**: This project is an independent, experimental effort and is not officially part of, endorsed by, or affiliated with AWS or kiro.dev in any way.

## Support

### For Users

- **Documentation**: See individual action READMEs and docs directory
- **Issues**: [GitHub Issues](../../issues) for bugs or feature requests
- **Discussions**: [GitHub Discussions](../../discussions) for questions

### For Contributors

- **Contributing Guide**: [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Workflow Documentation**: [.github/workflows/README.md](./.github/workflows/README.md)

---

**Note**: This is an experimental project under active development. Star ⭐ the repository to follow progress!
