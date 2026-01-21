---
description: Validate all template files for syntax errors
allowed-tools: Bash(node:*), Read, Glob
---

# Validate Templates

Check all template files for syntax errors and common issues.

## Run Validation

```bash
node bin/claude-init.js validate
```

Or directly:
```bash
node scripts/validate-templates.js
```

## Manual Validation Checks

### 1. Template Block Matching
Ensure all conditional blocks are properly closed:
- `{{#if variable}}` must have matching `{{/if}}`
- `{{#unless variable}}` must have matching `{{/unless}}`

### 2. Variable Usage
Check that variables used in templates are:
- Defined in the template generator config
- Using consistent naming (camelCase)

### 3. Common Variables
Valid variables include:
- `projectName`
- `projectDescription`
- `techStack`
- `buildCommand`
- `testCommand`
- `lintCommand`
- `devCommand`
- `language`
- `framework`

### 4. YAML Frontmatter
For templates with frontmatter, validate:
- Proper `---` delimiters
- Valid YAML syntax
- Required fields present

## Template Locations

```
templates/
├── CLAUDE.md.template
├── CLAUDE.local.md.template
├── settings/
│   ├── settings.json.template
│   └── settings.local.json.template
├── rules/
│   ├── code-style.md.template
│   ├── security.md.template
│   ├── testing.md.template
│   └── documentation.md.template
├── commands/
│   ├── review.md.template
│   ├── test.md.template
│   ├── commit.md.template
│   └── deploy.md.template
├── agents/
│   ├── code-reviewer.md.template
│   ├── debugger.md.template
│   └── researcher.md.template
├── skills/
│   └── code-review/SKILL.md.template
├── hooks/
│   └── hooks.json.template
└── mcp/
    └── .mcp.json.template
```

## Fix Issues

When issues are found:
1. Open the affected template file
2. Fix the syntax error
3. Re-run validation to confirm
