---
name: gsd:copilot
description: Generate GitHub Copilot configuration files for cross-tool compatibility
argument-hint: "<action> [options]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

<objective>
Generate GitHub Copilot-compatible configuration files (.github/) from project analysis.
This enables the same project context to work with both Claude Code (via GSD commands)
and GitHub Copilot (via .github/ configuration files).
</objective>

<execution_context>
@.planning/PROJECT.md (if exists)
@PROJECT_SPEC.md (if exists)
@CLAUDE.md (if exists)
@package.json (if exists)
</execution_context>

<context>
$ARGUMENTS
</context>

<copilot_structure>

## Generated File Structure

```
.github/
├── copilot-instructions.md           # Repo-wide instructions (from PROJECT_SPEC.md)
├── instructions/
│   ├── javascript.instructions.md    # JS-specific (applyTo: "**/*.js")
│   ├── typescript.instructions.md    # TS-specific (applyTo: "**/*.ts")
│   ├── python.instructions.md        # Python-specific (applyTo: "**/*.py")
│   ├── tests.instructions.md         # Test-specific (applyTo: "**/tests/**")
│   └── docs.instructions.md          # Docs-specific (applyTo: "**/*.md")
├── prompts/
│   ├── review-code.prompt.md         # /review-code command
│   ├── add-tests.prompt.md           # /add-tests command
│   ├── explain.prompt.md             # /explain command
│   ├── refactor.prompt.md            # /refactor command
│   └── debug.prompt.md               # /debug command
└── agents/
    ├── code-reviewer.agent.md        # Code review specialist
    ├── test-writer.agent.md          # Test generation agent
    └── debugger.agent.md             # Debugging agent
```

</copilot_structure>

<actions>

## generate (default)
Generate all Copilot configuration files from existing GSD setup.

```
/gsd:copilot generate
→ Analyzing project...
→ Created .github/copilot-instructions.md
→ Created .github/instructions/javascript.instructions.md
→ Created .github/prompts/review-code.prompt.md
→ Created .github/agents/code-reviewer.agent.md
→ Done: 12 files created
```

## sync
Sync existing GSD files to Copilot format (update only changed files).

```
/gsd:copilot sync
→ Comparing GSD and Copilot configs...
→ Updated .github/copilot-instructions.md (PROJECT_SPEC changed)
→ 1 file updated, 11 unchanged
```

## instructions
Generate only the main instructions file.

```
/gsd:copilot instructions
→ Created .github/copilot-instructions.md
```

## paths
Generate path-specific instruction files based on detected languages.

```
/gsd:copilot paths
→ Detected: JavaScript, TypeScript, CSS
→ Created .github/instructions/javascript.instructions.md
→ Created .github/instructions/typescript.instructions.md
→ Created .github/instructions/styles.instructions.md
```

## prompts
Generate reusable prompt templates.

```
/gsd:copilot prompts
→ Created .github/prompts/review-code.prompt.md
→ Created .github/prompts/add-tests.prompt.md
→ Created .github/prompts/explain.prompt.md
→ Created .github/prompts/refactor.prompt.md
→ Created .github/prompts/debug.prompt.md
```

## agents
Generate agent definition files.

```
/gsd:copilot agents
→ Created .github/agents/code-reviewer.agent.md
→ Created .github/agents/test-writer.agent.md
→ Created .github/agents/debugger.agent.md
```

## status
Show current Copilot configuration status.

```
/gsd:copilot status
→ Main instructions: .github/copilot-instructions.md (✓ exists, 45 lines)
→ Path instructions: 3 files in .github/instructions/
→ Prompts: 5 files in .github/prompts/
→ Agents: 3 files in .github/agents/
→ Last sync: 2 hours ago
```

## clean
Remove all generated Copilot files.

```
/gsd:copilot clean
→ Remove all Copilot configuration files? [y/N]
→ Removed .github/copilot-instructions.md
→ Removed .github/instructions/ (3 files)
→ Removed .github/prompts/ (5 files)
→ Removed .github/agents/ (3 files)
```

</actions>

<generation_rules>

## Source Mapping

| Project Source | Copilot Target |
|----------------|----------------|
| PROJECT_SPEC.md | .github/copilot-instructions.md |
| .planning/PROJECT.md | .github/copilot-instructions.md (merged) |
| package.json | Build commands in copilot-instructions.md |
| Detected languages | .github/instructions/*.instructions.md |
| Default templates | .github/prompts/*.prompt.md |
| Default templates | .github/agents/*.agent.md |

## copilot-instructions.md Template

```markdown
# Project Guidelines

## Overview
[From PROJECT_SPEC.md or .planning/PROJECT.md]

## Tech Stack
[Detected from package.json, requirements.txt, go.mod, etc.]
- Runtime: [detected]
- Framework: [detected]
- Testing: [detected]
- Linting: [detected]

## Build Commands
[From package.json scripts or detected build system]
- `npm run build` - Build the project
- `npm test` - Run all tests
- `npm run lint` - Check code style

## Code Conventions
[From PROJECT_SPEC.md or detected patterns]

## Architecture
[From PROJECT_SPEC.md directory structure]
- `/src` - Source code
- `/tests` - Test files
- `/docs` - Documentation

## Quality Standards
[Default quality standards]
```

## Path Instructions Template

```markdown
---
applyTo: "**/*.{ext}"
---

# [Language] Code Guidelines

## Module System
[Language-specific import patterns]

## Conventions
[Language-specific conventions]

## Patterns
[Project-specific patterns]

## Anti-patterns
[What to avoid]
```

## Prompt Template

```markdown
---
description: '[Action description]'
---

[Prompt content with context]

Focus on: ${input:focus:specific area to focus on}

[Expected output format]
```

## Agent Template

```markdown
---
name: "[agent-name]"
description: "[Agent purpose]"
tools:
  - "read"
  - "search"
  - "[other tools]"
---

## Role
[Agent role description]

## Responsibilities
[Bullet list of responsibilities]

## Guidelines
[Specific guidelines]

## Output Format
[Expected output format]
```

</generation_rules>

<language_detection>

Detect languages and generate appropriate instruction files:

| Pattern | Language | Instruction File |
|---------|----------|------------------|
| *.js | JavaScript | javascript.instructions.md |
| *.ts | TypeScript | typescript.instructions.md |
| *.tsx | TypeScript React | typescript-react.instructions.md |
| *.py | Python | python.instructions.md |
| *.go | Go | go.instructions.md |
| *.rs | Rust | rust.instructions.md |
| *.java | Java | java.instructions.md |
| *.rb | Ruby | ruby.instructions.md |
| *.php | PHP | php.instructions.md |
| *.cs | C# | csharp.instructions.md |
| *.css, *.scss | Styles | styles.instructions.md |
| **/tests/** | Tests | tests.instructions.md |
| **/*.md | Docs | docs.instructions.md |

</language_detection>

<process>

1. **Parse action**
   Determine operation: generate, sync, instructions, paths, prompts, agents, status, clean

2. **Analyze project**
   - Read PROJECT_SPEC.md, .planning/PROJECT.md, package.json
   - Detect languages via glob patterns (*.js, *.ts, *.py, etc.)
   - Analyze existing project structure
   - Check for existing .github/ Copilot files

3. **Generate files**
   Based on action, create appropriate files:
   - Transform GSD format to Copilot format
   - Add YAML frontmatter where required
   - Preserve project-specific content

4. **Report results**
   List all files created/updated with statistics.

</process>

<success_criteria>
- [ ] Copilot files generated successfully
- [ ] Content accurately reflects project setup
- [ ] YAML frontmatter valid for all applicable files
- [ ] No breaking changes to existing GSD configuration
</success_criteria>

<examples>

**Full generation:**
```
/gsd:copilot generate
→ Analyzing project...
→ Found: package.json, PROJECT_SPEC.md
→ Detected: TypeScript, React, CSS
→
→ Created:
→   .github/copilot-instructions.md (128 lines)
→   .github/instructions/typescript.instructions.md
→   .github/instructions/typescript-react.instructions.md
→   .github/instructions/styles.instructions.md
→   .github/instructions/tests.instructions.md
→   .github/prompts/review-code.prompt.md
→   .github/prompts/add-tests.prompt.md
→   .github/prompts/explain.prompt.md
→   .github/prompts/refactor.prompt.md
→   .github/prompts/debug.prompt.md
→   .github/agents/code-reviewer.agent.md
→   .github/agents/test-writer.agent.md
→   .github/agents/debugger.agent.md
→
→ Done: 13 files created
→ GitHub Copilot configuration ready
```

**Sync after changes:**
```
/gsd:copilot sync
→ Comparing configurations...
→ PROJECT_SPEC.md changed → updating copilot-instructions.md
→
→ Updated 1 file, 12 unchanged
```

</examples>
