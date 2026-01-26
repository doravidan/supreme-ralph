---
name: gsd:memory
description: Query and manage persistent knowledge graph
argument-hint: "<action> [query]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Manage the persistent knowledge graph that accumulates learnings across sessions. Query past decisions, patterns, and insights to inform current work.
</objective>

<execution_context>
@~/.claude/ultra/memory/manager.js
@.planning/memory/ (if exists)
</execution_context>

<context>
$ARGUMENTS
</context>

<memory_structure>

The memory system stores three types of knowledge:

## Entities
Code components discovered during development:
- Files, functions, classes, modules
- APIs, endpoints, services
- Configuration patterns

```json
{
  "id": "entity-uuid",
  "type": "function|class|file|api|pattern",
  "name": "authenticateUser",
  "location": "src/auth/service.ts:45",
  "description": "Validates credentials and returns JWT",
  "tags": ["auth", "security", "jwt"],
  "discovered": "2026-01-26T10:00:00Z"
}
```

## Relationships
Connections between entities:
- "depends_on", "calls", "implements", "extends"
- "configures", "validates", "transforms"

```json
{
  "from": "entity-uuid-1",
  "to": "entity-uuid-2",
  "type": "calls",
  "context": "authenticateUser calls tokenService.sign"
}
```

## Insights
Learnings and patterns discovered:
- What worked, what didn't
- Performance findings
- Architecture decisions

```json
{
  "id": "insight-uuid",
  "type": "pattern|decision|warning|optimization",
  "title": "Use jose for JWT, not jsonwebtoken",
  "content": "jsonwebtoken has CommonJS issues in ESM projects...",
  "tags": ["jwt", "esm", "dependencies"],
  "confidence": 0.9,
  "discovered": "2026-01-26T10:00:00Z"
}
```

</memory_structure>

<actions>

## query [term]
Search across all memory for matching content.

```
/gsd:memory query authentication
→ Found 3 entities, 2 relationships, 1 insight matching "authentication"
```

## insights
Show all recorded insights, optionally filtered by tag.

```
/gsd:memory insights
/gsd:memory insights --tag security
```

## entities
List discovered entities, optionally filtered.

```
/gsd:memory entities
/gsd:memory entities --type function
/gsd:memory entities --tag auth
```

## add-insight [type]
Record a new insight from current work.

```
/gsd:memory add-insight pattern
→ Prompts for title, content, tags
```

**Insight types:**
- `pattern` - Reusable solution
- `decision` - Architecture choice with rationale
- `warning` - Pitfall to avoid
- `optimization` - Performance improvement

## add-entity
Record a new code entity.

```
/gsd:memory add-entity
→ Prompts for type, name, location, description, tags
```

## export
Export memory to JSON file for backup/sharing.

```
/gsd:memory export
→ Writes .planning/memory-export-2026-01-26.json
```

## import [file]
Import memory from JSON file.

```
/gsd:memory import .planning/memory-export.json
→ Imported 15 entities, 8 relationships, 5 insights
```

## cleanup
Remove stale entities (files that no longer exist).

```
/gsd:memory cleanup
→ Removed 3 entities referencing deleted files
```

## stats
Show memory statistics.

```
/gsd:memory stats
→ 45 entities, 23 relationships, 12 insights
→ Most common tags: auth (8), api (6), database (5)
```

</actions>

<process>

1. **Parse action and arguments**
   Extract action and optional query/filters.

2. **Load memory**
   Read from `.planning/memory/` directory:
   - `entities.json`
   - `relationships.json`
   - `insights.json`

3. **Execute action**
   Query, filter, or modify as requested.

4. **Present results**
   Format output for readability with relevant context.

5. **Persist changes** (if modified)
   Write updated JSON files.

</process>

<integration_with_gsd>

Memory integrates with GSD workflow:

**During research phase:**
- Query for relevant past learnings
- Include matching insights in researcher context

**During planning:**
- Check for entity relationships
- Apply learned patterns to new plans

**During execution:**
- Record new entities as code is written
- Log insights when solutions are found

**After verification:**
- Record what worked/failed as insights
- Update entity relationships

</integration_with_gsd>

<success_criteria>
- [ ] Memory operation completed
- [ ] Results clearly presented
- [ ] Changes persisted (if applicable)
</success_criteria>
