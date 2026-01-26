---
name: gsd:security
description: Configure command allowlists and filesystem boundaries
argument-hint: "<action>"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Generate and manage security configuration based on detected project stack. Creates command allowlists and filesystem boundaries to ensure safe autonomous execution.
</objective>

<execution_context>
@~/.claude/ultra/security/analyzer.js
@~/.claude/ultra/security/boundaries.js
@package.json (if exists)
@.planning/security.json (if exists)
</execution_context>

<context>
$ARGUMENTS
</context>

<security_layers>

## 1. Command Allowlists
Stack-specific commands that are pre-approved for autonomous execution.

**Node.js stack:**
```json
{
  "allowed": [
    "npm test", "npm run build", "npm run lint",
    "npx vitest", "npx eslint", "npx prettier"
  ]
}
```

**Python stack:**
```json
{
  "allowed": [
    "python -m pytest", "python -m mypy",
    "pip install", "ruff check", "black --check"
  ]
}
```

**Go stack:**
```json
{
  "allowed": [
    "go test", "go build", "go vet",
    "golangci-lint run"
  ]
}
```

## 2. Filesystem Boundaries
Rules for file access during execution.

```json
{
  "never_touch": [
    ".env", ".env.*",
    "credentials.json", "secrets/",
    "*.pem", "*.key"
  ],
  "read_only": [
    "package-lock.json",
    "yarn.lock", "pnpm-lock.yaml",
    "go.sum"
  ],
  "warn_before_modify": [
    "package.json",
    ".github/workflows/",
    "Dockerfile"
  ]
}
```

## 3. Intervention Controls
When to pause for human review.

```json
{
  "pause_on": [
    "database migrations",
    "API key changes",
    "deployment scripts"
  ],
  "require_confirmation": [
    "deleting files",
    "modifying CI/CD",
    "external API calls"
  ]
}
```

</security_layers>

<actions>

## scan
Analyze project and detect stack for security recommendations.

```
/gsd:security scan
→ Detected: Node.js (TypeScript), React, PostgreSQL
→ Recommended allowlist: 15 commands
→ Recommended boundaries: 8 patterns
```

## config
Generate security configuration based on scan.

```
/gsd:security config
→ Created .planning/security.json
→ Review and customize as needed
```

**Output file structure:**
```json
{
  "version": "1.0",
  "stack": ["node", "typescript", "react"],
  "commands": {
    "allowed": [...],
    "blocked": [...]
  },
  "filesystem": {
    "never_touch": [...],
    "read_only": [...],
    "warn_before_modify": [...]
  },
  "intervention": {
    "pause_on": [...],
    "require_confirmation": [...]
  }
}
```

## validate [command]
Check if a command is allowed by current config.

```
/gsd:security validate "npm run build"
→ ✓ Allowed (matches: npm run *)

/gsd:security validate "rm -rf /"
→ ✗ Blocked (destructive command)
```

## boundaries
Show current filesystem boundaries.

```
/gsd:security boundaries
→ Never touch: .env, secrets/, *.key
→ Read only: package-lock.json, yarn.lock
→ Warn before: package.json, Dockerfile
```

## add-allowed [pattern]
Add command pattern to allowlist.

```
/gsd:security add-allowed "docker compose up"
→ Added to allowed commands
```

## add-boundary [type] [pattern]
Add filesystem boundary rule.

```
/gsd:security add-boundary never_touch ".secrets/"
→ Added to never_touch list
```

## apply
Apply security config to Claude Code settings.

```
/gsd:security apply
→ Updated .claude/settings.json with:
→   permissions.allow: 15 patterns
→   permissions.deny: 5 patterns
```

</actions>

<stack_detection>

Detection based on:
- `package.json` → Node.js, dependencies
- `requirements.txt` / `pyproject.toml` → Python
- `go.mod` → Go
- `Cargo.toml` → Rust
- `pom.xml` / `build.gradle` → Java
- `Dockerfile` → Docker
- `.github/workflows/` → GitHub Actions

Each stack adds its standard commands and boundaries.

</stack_detection>

<process>

1. **Parse action**
   Determine which security operation to perform.

2. **Load existing config** (if any)
   Read from `.planning/security.json`.

3. **For scan/config:**
   - Detect project files
   - Identify stack components
   - Generate recommendations
   - Write config file

4. **For validate/boundaries:**
   - Load current rules
   - Check against patterns
   - Report result

5. **For apply:**
   - Read security config
   - Transform to Claude settings format
   - Update `.claude/settings.json`

</process>

<success_criteria>
- [ ] Stack correctly detected
- [ ] Security config generated/updated
- [ ] No sensitive files exposed
- [ ] Appropriate commands allowed
</success_criteria>

<examples>

**Full setup flow:**
```
/gsd:security scan
→ Detected Node.js (TypeScript), Prisma, Docker

/gsd:security config
→ Created .planning/security.json with 18 allowed commands

/gsd:security apply
→ Updated Claude Code settings
→ Safe for autonomous execution
```

**Check specific command:**
```
/gsd:security validate "prisma migrate dev"
→ ✓ Allowed (database migration command)
→ ⚠ Note: Intervention recommended for migrations
```

</examples>
