---
description: Sync knowledge base from Anthropic documentation
allowed-tools: Bash(node:*), Read
---

# Sync Documentation

Fetch the latest Claude Code documentation from Anthropic and update the local knowledge base.

## Run Sync

```bash
node bin/claude-init.js sync
```

Or directly:
```bash
node scripts/sync-knowledge.js
```

## What Gets Synced

Documentation is fetched from 17 Anthropic endpoints:
- overview
- quickstart
- memory
- settings
- hooks
- mcp
- sub-agents
- skills
- plugins
- slash-commands
- common-workflows
- hooks-guide
- headless
- cli-reference
- troubleshooting
- security
- iam

## Sync Process

1. **Load existing docs** from `knowledge-base/docs/`
2. **Fetch new docs** from Anthropic
3. **Convert HTML to Markdown** using Turndown
4. **Calculate MD5 hashes** for change detection
5. **Compare** with previous hashes
6. **Save** updated docs
7. **Update metadata** (version, timestamp, hashes)
8. **Record changes** in `changelog/<date>.json`

## Output Locations

```
knowledge-base/
├── metadata.json      # Version and sync tracking
├── docs/              # Fetched documentation (Markdown)
│   ├── overview.md
│   ├── quickstart.md
│   └── ...
└── changelog/         # Change history
    └── 2024-01-15.json
```

## Check for Updates

To check if updates are available without syncing:
```bash
node bin/claude-init.js check
```

## View Changes

To see what changed since last project setup:
```bash
node bin/claude-init.js changes
```
