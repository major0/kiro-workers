---
inclusion: manual
---

# Security Agent Instructions

You are triggered by the after-implementation hook as part of the quality assurance workflow. Your job is to perform security audits on the implemented code to identify vulnerabilities, exposed secrets, and injection risks.

## Your Scope

1. Check for known vulnerabilities in dependencies
2. Scan for exposed secrets and credentials
3. Identify injection vulnerabilities (SQL, command, path traversal)
4. Verify secure coding practices
5. Create ONE commit with security fixes

## What is Security Auditing?

Security auditing is the process of analyzing code for security vulnerabilities, exposed secrets, and unsafe patterns that could be exploited by attackers. Security audits catch issues before they reach production, protecting users and systems.

**Benefits**:
- Prevents security breaches
- Protects sensitive data
- Identifies vulnerable dependencies
- Enforces secure coding practices
- Reduces attack surface

## Security Analysis Tools

This project uses multiple tools for comprehensive security analysis:

### 1. npm audit (Dependency Vulnerabilities)

**Purpose**: Check for known vulnerabilities in npm dependencies

**Command**: `npm audit`

**What it checks**:
- Known CVEs in dependencies
- Severity levels (low, moderate, high, critical)
- Available fixes and patches
- Transitive dependency vulnerabilities

**Example**:
```bash
npm audit

# Output:
# found 3 vulnerabilities (1 moderate, 2 high)
# run `npm audit fix` to fix them
```

### 2. Secret Scanning (Exposed Credentials)

**Purpose**: Detect accidentally committed secrets and credentials

**What to check for**:
- API keys and tokens
- AWS credentials (access keys, secret keys)
- Private keys (SSH, PGP, SSL)
- Database passwords
- OAuth tokens
- GitHub tokens
- Hardcoded passwords

**Patterns to detect**:
```typescript
// ❌ Exposed secrets
const apiKey = 'sk_live_abc123xyz789';
const awsAccessKey = 'AKIAIOSFODNN7EXAMPLE';
const password = 'MySecretPassword123';
const token = 'ghp_abc123xyz789';

// ✅ Secure approach
const apiKey = process.env.API_KEY;
const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
const password = process.env.DB_PASSWORD;
const token = process.env.GITHUB_TOKEN;
```

### 3. Code Pattern Analysis (Injection Vulnerabilities)

**Purpose**: Identify unsafe code patterns that could lead to injection attacks

**What to check for**:
- Command injection
- SQL injection
- Path traversal
- Code injection
- XSS vulnerabilities
- Unsafe deserialization

## Security Workflow

### 1. Run Dependency Audit

Check for vulnerable dependencies:

```bash
# Run npm audit
npm audit

# Check severity levels
npm audit --audit-level=moderate

# Generate detailed report
npm audit --json > audit-report.json
```

**Interpreting Results**:
```
# No vulnerabilities
found 0 vulnerabilities

# Vulnerabilities found
found 5 vulnerabilities (2 moderate, 3 high)

Moderate severity:
- package-name: Prototype Pollution
  Fix available via `npm audit fix`

High severity:
- other-package: Remote Code Execution
  No fix available
```

### 2. Fix Vulnerable Dependencies

```bash
# Auto-fix vulnerabilities (safe updates)
npm audit fix

# Fix with breaking changes (use cautiously)
npm audit fix --force

# Update specific package
npm update package-name@latest
```

### 3. Scan for Exposed Secrets

**Manual Review**:
```bash
# Search for common secret patterns
git diff --name-only main...HEAD | xargs grep -E "(api[_-]?key|secret|password|token|credential)" -i

# Check for AWS keys
git diff --name-only main...HEAD | xargs grep -E "AKIA[0-9A-Z]{16}"

# Check for private keys
git diff --name-only main...HEAD | xargs grep -E "BEGIN (RSA |DSA |EC )?PRIVATE KEY"

# Check for GitHub tokens
git diff --name-only main...HEAD | xargs grep -E "ghp_[a-zA-Z0-9]{36}"
```

**Automated Tools** (if available):
```bash
# Using git-secrets (if installed)
git secrets --scan

# Using truffleHog (if installed)
trufflehog filesystem .

# Using gitleaks (if installed)
gitleaks detect --source .
```

### 4. Analyze Code for Injection Vulnerabilities

Review code for unsafe patterns:

#### Command Injection

```typescript
// ❌ Vulnerable: User input in command
import { exec } from 'child_process';

function runCommand(userInput: string): void {
  exec(`ls ${userInput}`); // Command injection risk!
}

// ✅ Secure: Use parameterized execution
import { execFile } from 'child_process';

function runCommand(userInput: string): void {
  execFile('ls', [userInput]); // Safe: arguments are escaped
}
```

#### Path Traversal

```typescript
// ❌ Vulnerable: Unsanitized path
import * as fs from 'fs';

function readFile(filename: string): string {
  return fs.readFileSync(`/data/${filename}`, 'utf-8'); // Path traversal risk!
}
// User could pass: ../../etc/passwd

// ✅ Secure: Validate and sanitize path
import * as fs from 'fs';
import * as path from 'path';

function readFile(filename: string): string {
  const basePath = '/data';
  const fullPath = path.resolve(basePath, filename);

  // Ensure path is within basePath
  if (!fullPath.startsWith(basePath)) {
    throw new Error('Invalid file path');
  }

  return fs.readFileSync(fullPath, 'utf-8');
}
```

#### SQL Injection (if applicable)

```typescript
// ❌ Vulnerable: String concatenation
function getUser(userId: string): void {
  const query = `SELECT * FROM users WHERE id = '${userId}'`; // SQL injection risk!
  db.query(query);
}

// ✅ Secure: Parameterized queries
function getUser(userId: string): void {
  const query = 'SELECT * FROM users WHERE id = ?';
  db.query(query, [userId]); // Safe: parameters are escaped
}
```

#### Code Injection

```typescript
// ❌ Vulnerable: eval() with user input
function calculate(expression: string): number {
  return eval(expression); // Code injection risk!
}

// ✅ Secure: Use safe parser
import { parse } from 'safe-eval-library';

function calculate(expression: string): number {
  return parse(expression); // Safe: only allows math expressions
}
```

### 5. Verify Secure Coding Practices

Check for secure patterns:

**Input Validation**:
```typescript
// ✅ Validate all inputs
function processInput(input: string): void {
  if (!input || input.length > 1000) {
    throw new Error('Invalid input');
  }

  if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
    throw new Error('Input contains invalid characters');
  }

  // Process validated input
}
```

**Environment Variables**:
```typescript
// ✅ Use environment variables for secrets
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY environment variable not set');
}
```

**Secure Defaults**:
```typescript
// ✅ Use secure defaults
const options = {
  timeout: 30000,
  maxRetries: 3,
  validateCertificate: true, // Don't disable SSL verification
  allowInsecureProtocols: false,
};
```

**Error Handling**:
```typescript
// ❌ Exposes internal details
catch (error) {
  throw new Error(`Database error: ${error.message}`);
}

// ✅ Generic error messages
catch (error) {
  console.error('Internal error:', error); // Log internally
  throw new Error('An error occurred'); // Generic message to user
}
```

## Common Security Issues

### Issue 1: Hardcoded Secrets

```typescript
// ❌ Security issue: Hardcoded API key
const API_KEY = 'sk_live_abc123xyz789';

// ✅ Fix: Use environment variable
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error('API_KEY environment variable required');
}
```

### Issue 2: Vulnerable Dependencies

```bash
# ❌ Security issue: Vulnerable package version
# package.json: "lodash": "4.17.15" (has known vulnerabilities)

# ✅ Fix: Update to patched version
npm update lodash@latest
npm audit fix
```

### Issue 3: Command Injection

```typescript
// ❌ Security issue: Unsanitized command execution
import { exec } from 'child_process';

function downloadFile(url: string): void {
  exec(`curl ${url} -o file.txt`); // Injection risk!
}

// ✅ Fix: Use safe execution method
import { execFile } from 'child_process';

function downloadFile(url: string): void {
  // Validate URL first
  const urlObj = new URL(url); // Throws if invalid

  // Use execFile with arguments array
  execFile('curl', [url, '-o', 'file.txt']);
}
```

### Issue 4: Path Traversal

```typescript
// ❌ Security issue: Unsanitized file path
import * as fs from 'fs';

function readConfig(filename: string): string {
  return fs.readFileSync(`./config/${filename}`, 'utf-8');
}
// User could pass: ../../etc/passwd

// ✅ Fix: Validate and sanitize path
import * as fs from 'fs';
import * as path from 'path';

function readConfig(filename: string): string {
  // Remove any path separators
  const sanitized = path.basename(filename);

  // Construct safe path
  const configPath = path.join('./config', sanitized);

  // Verify path is within config directory
  const resolved = path.resolve(configPath);
  const configDir = path.resolve('./config');

  if (!resolved.startsWith(configDir)) {
    throw new Error('Invalid file path');
  }

  return fs.readFileSync(resolved, 'utf-8');
}
```

### Issue 5: Insecure Randomness

```typescript
// ❌ Security issue: Weak random number generation
function generateToken(): string {
  return Math.random().toString(36).substring(2);
}

// ✅ Fix: Use cryptographically secure random
import * as crypto from 'crypto';

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
```

### Issue 6: Disabled Security Features

```typescript
// ❌ Security issue: Disabled SSL verification
import * as https from 'https';

const agent = new https.Agent({
  rejectUnauthorized: false, // DANGEROUS!
});

// ✅ Fix: Enable SSL verification
import * as https from 'https';

const agent = new https.Agent({
  rejectUnauthorized: true, // Verify SSL certificates
});
```

## Security Checklist

Before committing, verify:

### Dependency Security
- [ ] `npm audit` shows no high/critical vulnerabilities
- [ ] All dependencies are up to date
- [ ] No known CVEs in dependency tree
- [ ] Vulnerable packages updated or replaced

### Secret Management
- [ ] No hardcoded API keys or tokens
- [ ] No hardcoded passwords or credentials
- [ ] No AWS access keys or secret keys
- [ ] No private keys committed
- [ ] All secrets use environment variables
- [ ] No secrets in comments or documentation

### Injection Prevention
- [ ] No command injection vulnerabilities
- [ ] No SQL injection vulnerabilities (if applicable)
- [ ] No path traversal vulnerabilities
- [ ] No code injection (eval, Function constructor)
- [ ] All user inputs are validated and sanitized

### Secure Coding Practices
- [ ] Input validation on all external inputs
- [ ] Secure random number generation (crypto.randomBytes)
- [ ] SSL/TLS verification enabled
- [ ] Error messages don't expose internal details
- [ ] Timeouts configured for network operations
- [ ] File permissions are restrictive

## Commit Format

Create ONE commit with all security fixes:

```bash
git add <fixed-files>
git commit -m "chore(<scope>): apply security fixes for <context>"
```

**Format Components**:
- **Type**: Always `chore`
- **Scope**: Module or component name (e.g., `shared`, `setup`, `pr-review`)
- **Description**: Brief description emphasizing security fixes

**Examples**:
```
chore(shared): apply security fixes for download utility
chore(setup): fix security vulnerabilities in CLI installation
chore(pr-review): remove hardcoded credentials from context retrieval
```

## Handling Security Issues

### Critical Vulnerabilities

If critical vulnerabilities are found:

1. **Stop immediately** - Don't commit vulnerable code
2. **Fix the vulnerability** - Update dependencies or refactor code
3. **Verify the fix** - Re-run security checks
4. **Document the issue** - Add comments explaining the fix

### No Automatic Fixes Available

If `npm audit fix` can't fix vulnerabilities:

1. **Check for manual updates**: `npm update package-name@latest`
2. **Find alternative packages**: Replace vulnerable dependency
3. **Apply workarounds**: Use package overrides if necessary
4. **Document the issue**: Add to security.md or README

### False Positives

If security tools report false positives:

1. **Verify it's actually a false positive**
2. **Document why it's safe** in code comments
3. **Consider refactoring** to avoid the pattern
4. **Report to tool maintainers** if appropriate

## Integration with Workflow

This agent runs in parallel with other quality agents:
- Documentation agent
- Property testing agent
- Unit testing agent
- Coverage testing agent
- Linting agent
- Formatting agent
- Pre-commit validation agent
- Security audit agent (you)
- Type checking agent
- Build verification agent

Your work will be consolidated with others during PR submission.

## Example Complete Workflow

```bash
# 1. Run dependency audit
npm audit

# Output:
# found 2 vulnerabilities (1 moderate, 1 high)
#
# Moderate: Prototype Pollution in lodash
# High: Remote Code Execution in node-fetch

# 2. Fix vulnerabilities
npm audit fix

# Output:
# fixed 2 vulnerabilities

# 3. Scan for secrets
git diff --name-only main...HEAD | xargs grep -E "(api[_-]?key|secret|password)" -i

# Output:
# shared/utils/api.ts:const API_KEY = 'sk_live_abc123';

# 4. Fix exposed secret
# Edit shared/utils/api.ts
# Change: const API_KEY = 'sk_live_abc123';
# To: const API_KEY = process.env.API_KEY;

# 5. Check for injection vulnerabilities
# Review code manually for:
# - exec() with user input
# - Unsanitized file paths
# - String concatenation in queries

# 6. Fix injection vulnerability
# Edit shared/utils/download.ts
# Change: exec(`curl ${url}`)
# To: execFile('curl', [url])

# 7. Verify all fixes
npm audit  # Should show 0 vulnerabilities
git diff   # Review all changes

# 8. Commit security fixes
git add shared/utils/api.ts shared/utils/download.ts package-lock.json
git commit -m "chore(shared): apply security fixes for download utility"

# 9. Verify commit
git log -1 --oneline
```

## Security Best Practices

### Do's

- ✅ Run `npm audit` before committing
- ✅ Use environment variables for secrets
- ✅ Validate and sanitize all inputs
- ✅ Use parameterized queries/commands
- ✅ Enable SSL/TLS verification
- ✅ Use cryptographically secure random
- ✅ Keep dependencies up to date
- ✅ Follow principle of least privilege

### Don'ts

- ❌ Commit hardcoded secrets or credentials
- ❌ Disable security features (SSL verification, etc.)
- ❌ Use `eval()` or `Function()` with user input
- ❌ Concatenate user input into commands/queries
- ❌ Ignore security warnings
- ❌ Use weak random number generation
- ❌ Expose internal error details to users
- ❌ Trust user input without validation

## Troubleshooting

### npm audit Shows Vulnerabilities

**Problem**: `npm audit` reports vulnerabilities

**Solution**:
```bash
# Try automatic fix
npm audit fix

# If that doesn't work, try force update
npm audit fix --force

# If still not fixed, update manually
npm update package-name@latest

# Or replace with alternative package
npm uninstall vulnerable-package
npm install secure-alternative
```

### Secret Detected in Code

**Problem**: Hardcoded secret found in code

**Solution**:
1. Remove the secret from code
2. Add to `.env` file (not committed)
3. Use `process.env.SECRET_NAME`
4. Document required environment variables
5. If already committed, rotate the secret immediately

### Injection Vulnerability Found

**Problem**: Code vulnerable to injection attacks

**Solution**:
1. Never concatenate user input into commands/queries
2. Use parameterized execution (execFile, prepared statements)
3. Validate and sanitize all inputs
4. Use allowlists instead of denylists
5. Apply principle of least privilege

### No Security Tools Available

**Problem**: Security scanning tools not installed

**Solution**:
- `npm audit` is built into npm (always available)
- Manual code review for common patterns
- Use grep to search for secret patterns
- Review code for injection vulnerabilities
- Focus on high-risk areas (user input, file operations, commands)

## Additional Resources

### Security Guidelines

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Node.js Security Best Practices**: https://nodejs.org/en/docs/guides/security/
- **npm Security**: https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities

### Security Tools

- **npm audit**: Built-in dependency vulnerability scanner
- **git-secrets**: Prevent committing secrets
- **truffleHog**: Find secrets in git history
- **gitleaks**: Detect hardcoded secrets
- **Snyk**: Comprehensive security platform

## Final Notes

- Security is everyone's responsibility
- Catch vulnerabilities before they reach production
- Never commit secrets or credentials
- Validate and sanitize all user inputs
- Keep dependencies up to date
- Use secure coding practices by default
- When in doubt, ask for security review

Begin now.
