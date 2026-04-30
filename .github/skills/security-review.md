---
description: Security review of code changes
argument-hint: [file-or-directory]
---

# Skill: Security Review

> **System Rule**: This skill operates in a GitHub-native execution environment. It does NOT assume Jira, Confluence, or external ticketing systems. All outputs map to GitHub Issues + GitHub Projects structure only.

## Purpose
Perform a security-focused code review on specified files, directory, or staged changes.

---

## GitHub Workflow Mapping

| Original Concept | GitHub-Native Equivalent |
|------------------|--------------------------|
| Security findings | GitHub Issues with `security` label |
| Vulnerability tracking | GitHub Security Advisories |
| Code scanning | GitHub Actions workflows |

---

## Inputs
- `$ARGUMENTS` — file path, directory, or blank (defaults to staged changes)

---

## Execution Flow

### Phase 1: Scope

Determine what to review:

1. If file path given → review that file
2. If directory given → review all source files
3. If no input → review staged changes: `git diff --cached --name-only`
4. If nothing staged → review unstaged: `git diff --name-only`

Identify file types and frameworks for focused review.

### Phase 2: Analyze

#### Check Each Category

Review against these security categories:

#### 1. Injection Vulnerabilities
- **SQL Injection**: Raw SQL with string concatenation/template literals
- **Command Injection**: `exec()`, `spawn()`, `child_process` with user input
- **XSS**: Unescaped user input in HTML/JSX, `dangerouslySetInnerHTML`
- **NoSQL Injection**: Unsanitized query objects
- **Path Traversal**: User input in file paths without sanitization

#### 2. Authentication & Authorization
- Missing auth checks on protected routes
- Hardcoded credentials, tokens, or API keys
- Insecure session management
- Missing CSRF protection
- Overly permissive CORS

#### 3. Data Exposure
- Sensitive data in logs (passwords, tokens, PII)
- API responses leaking internals (stack traces, DB schemas)
- Secrets in source code or configs
- Missing input validation

#### 4. Dependency & Configuration
- Known vulnerable dependencies
- Insecure default configurations
- Missing security headers
- Debug mode in production

#### 5. Cryptography
- Weak hashing (MD5, SHA1 for passwords)
- Hardcoded encryption keys
- Insecure random for security values
- Missing HTTPS enforcement

#### 6. Error Handling
- Verbose errors exposing internals
- Unhandled promise rejections
- Missing error boundaries
- Silent catch blocks

### Phase 3: Report

For each finding, report:

```markdown
### [SEVERITY] Finding Title

**Category**: Injection | Auth | Data Exposure | Dependency | Crypto | Error Handling  
**Severity**: Critical | High | Medium | Low | Info  
**File**: `path/to/file.ts:LINE`

**Issue**: What the problem is (1-2 sentences)

**Risk**: What could go wrong (1-2 sentences)

**Fix**:
```typescript
// Suggested fix
```

**Reference**: OWASP or relevant security guidance
```

#### Severity Definitions

| Severity | Meaning | Action |
|----------|---------|--------|
| **Critical** | Exploitable vulnerability, data breach risk | Block merge, fix immediately |
| **High** | Significant security weakness | Fix before merge |
| **Medium** | Defense-in-depth issue | Fix soon, OK to merge with tracking |
| **Low** | Best practice deviation | Address when convenient |
| **Info** | Observation, no immediate risk | Consider for future |

### Phase 4: Summary

```markdown
## Security Review Complete

**Scope**: {files reviewed}  
**Findings**: {total count}

| Severity | Count |
|----------|-------|
| Critical | {n} |
| High     | {n} |
| Medium   | {n} |
| Low      | {n} |
| Info     | {n} |

### Verdict
{PASS | PASS WITH NOTES | FAIL}

### Action Items
1. {Most important fix}
2. {Second most important}
3. ...

### What Looks Good
- {Positive security patterns observed}
```

---

## GitHub Integration

For security findings:

1. Create GitHub Issues for Critical/High findings:
   ```markdown
   **Security Issue**: [Brief title]
   - Severity: {Critical/High}
   - File: `path/to/file.ts:LINE`
   - Risk: {description}
   - Fix: {suggestion}
   ```

2. Add `security` and appropriate severity labels

3. For Critical findings, add to GitHub Security Advisories

4. Update GitHub Project to track remediation

---

## Tips

- Focus on actual changes, not pre-existing issues (unless Critical)
- Be specific: include file paths and line numbers
- Suggest fixes, don't just flag problems
- Consider context: internal tool vs public-facing API
- Check dependencies for known CVEs
- Flag patterns that could become problems at scale
