# PRD: Comprehensive Refactoring and Refinement

## Overview

Major refactoring of the claude-init CLI tool to improve code quality, maintainability, performance, and user experience across all features. This includes extracting abstractions, splitting monolithic functions, adding comprehensive test coverage, and updating all documentation.

## Goals

1. **Improve Code Quality** - Clean architecture, consistent patterns, proper error handling
2. **Enhance Maintainability** - Small focused functions, clear separation of concerns, centralized configuration
3. **Add Comprehensive Tests** - Unit tests for all modules, integration tests for CLI commands
4. **Update Documentation** - CLAUDE.md, README, inline comments, API documentation

## User Stories

### US-001: Create Centralized Configuration Manager
**As a** developer
**I want** all configuration values centralized in one place
**So that** I can easily modify settings without hunting through multiple files

**Acceptance Criteria:**
- [ ] Create `scripts/utils/config-manager.js` with all constants
- [ ] Extract hardcoded values: 70% compact threshold, 2h cache TTL, 10 max iterations, 15/10 dependency limits
- [ ] Support environment variable overrides for all config values
- [ ] Export typed configuration object with defaults
- [ ] Update all files to import from config-manager
- [ ] Add validation for config values
- [ ] Typecheck passes

**Priority:** 1 (Foundation for other refactoring)

---

### US-002: Create FileSystem Helper Utility
**As a** developer
**I want** common file operations abstracted into a utility
**So that** I can reduce code duplication and ensure consistent error handling

**Acceptance Criteria:**
- [ ] Create `scripts/utils/fs-helper.js`
- [ ] Implement `readDirRecursive(path, options)` with filtering
- [ ] Implement `ensureDirs(paths[])` for batch directory creation
- [ ] Implement `findFilesByPattern(dir, pattern, options)` with caching
- [ ] Implement `safeReadJson(path, defaultValue)` with error handling
- [ ] Implement `safeWriteFile(path, content)` with directory creation
- [ ] Add proper error messages for all operations
- [ ] Replace scattered fs operations in project-analyzer.js, setup-project.js
- [ ] Typecheck passes

**Priority:** 1 (Foundation for other refactoring)

---

### US-003: Create Template Engine Class
**As a** developer
**I want** a robust template engine replacing fragile regex substitution
**So that** template rendering is reliable and testable

**Acceptance Criteria:**
- [ ] Create `scripts/utils/template-engine.js`
- [ ] Support `{{variable}}` placeholder syntax
- [ ] Support `{{#if condition}}...{{/if}}` conditionals
- [ ] Support `{{#each items}}...{{/each}}` loops
- [ ] Validate all placeholders have values (warn on missing)
- [ ] Provide clear error messages for malformed templates
- [ ] Replace regex-based substitution in setup-project.js, run-ralph.js
- [ ] Typecheck passes

**Priority:** 2 (Depends on US-001, US-002)

---

### US-004: Extract Analyzer Registry
**As a** developer
**I want** analyzer configurations in separate data files
**So that** adding new frameworks/tools doesn't require code changes

**Acceptance Criteria:**
- [ ] Create `scripts/data/dependency-purposes.js` - extract 150+ line map
- [ ] Create `scripts/data/test-frameworks.js` - extract TEST_FRAMEWORKS config
- [ ] Create `scripts/data/linting-tools.js` - extract LINTING_TOOLS config
- [ ] Create `scripts/data/build-tools.js` - extract build tool detection
- [ ] Update project-analyzer.js to import from data files
- [ ] Add schema validation for data file structure
- [ ] Document how to add new frameworks/tools
- [ ] Typecheck passes

**Priority:** 2 (Depends on US-001)

---

### US-005: Refactor setup-project.js - Split Main Function
**As a** developer
**I want** the 192-line main() function split into focused phases
**So that** each setup phase is testable and maintainable

**Acceptance Criteria:**
- [ ] Create `scripts/setup/phases.js` with phase functions
- [ ] Extract `validateSetupEnvironment()` - check permissions, target dir
- [ ] Extract `gatherConfiguration()` - prompts and defaults
- [ ] Extract `runSetupPhases()` - orchestrate file creation
- [ ] Extract `displaySetupResults()` - show summary and next steps
- [ ] main() should be <30 lines orchestrating phases
- [ ] Each phase function <50 lines
- [ ] Maintain backward compatibility with all CLI options
- [ ] Typecheck passes

**Priority:** 3 (Depends on US-001, US-002, US-003)

---

### US-006: Refactor setup-project.js - Extract Template Writers
**As a** developer
**I want** the repetitive writeRules/writeCommands/writeAgents/writeSkills functions unified
**So that** adding new template types is simple

**Acceptance Criteria:**
- [ ] Create `scripts/setup/template-writer.js`
- [ ] Implement generic `writeTemplates(type, templates, targetPath, variables)`
- [ ] Support types: rules, commands, agents, skills, hooks
- [ ] Use template-engine.js for variable substitution
- [ ] Consolidate error handling and logging
- [ ] Remove duplicate try-catch blocks
- [ ] Update setup-project.js to use template-writer
- [ ] Typecheck passes

**Priority:** 3 (Depends on US-003)

---

### US-007: Refactor setup-project.js - Extract RALPH Setup
**As a** developer
**I want** the 270-line writeRalph() function split into modules
**So that** RALPH setup is maintainable and extensible

**Acceptance Criteria:**
- [ ] Create `scripts/setup/ralph-setup.js`
- [ ] Extract `generateRalphClaudeMd(config)` - CLAUDE.md generation
- [ ] Extract `writeRalphFiles(targetPath)` - file copying
- [ ] Extract `setupRalphSkills(targetPath)` - skill setup
- [ ] Extract `generateIntelligentPRD(analysis)` - PRD generation
- [ ] Each function <60 lines
- [ ] Reuse template-engine.js and template-writer.js
- [ ] Typecheck passes

**Priority:** 3 (Depends on US-003, US-006)

---

### US-008: Refactor project-analyzer.js - Add Caching
**As a** developer
**I want** analysis results cached during a session
**So that** repeated analysis calls don't re-scan the filesystem

**Acceptance Criteria:**
- [ ] Add caching layer for `analyzeProject()` results
- [ ] Cache `findMarkdownFiles()` results per directory
- [ ] Cache `detectDirectoryPurpose()` results
- [ ] Add `clearCache()` method for forced refresh
- [ ] Cache invalidation based on file modification times
- [ ] Reduce duplicate file reads by 80%+
- [ ] Typecheck passes

**Priority:** 4 (Depends on US-002)

---

### US-009: Refactor project-analyzer.js - Fix Silent Error Handling
**As a** developer
**I want** errors logged at debug level instead of swallowed
**So that** I can debug issues when analysis fails

**Acceptance Criteria:**
- [ ] Create debug logging utility with levels (debug, info, warn, error)
- [ ] Replace all `catch (e) { // Ignore }` with debug logging
- [ ] Track partial failures in analysis result object
- [ ] Add `analysis.warnings[]` array for non-fatal issues
- [ ] Log warnings summary at end of analysis
- [ ] Never silently drop errors
- [ ] Typecheck passes

**Priority:** 4 (Depends on US-001)

---

### US-010: Refactor news-aggregator.js - Replace Regex XML Parsing
**As a** developer
**I want** proper XML parsing instead of fragile regex
**So that** RSS parsing doesn't break on edge cases

**Acceptance Criteria:**
- [ ] Add `fast-xml-parser` or similar lightweight XML parser dependency
- [ ] Rewrite `parseRSSFeed()` using proper XML parser
- [ ] Handle malformed XML gracefully with meaningful errors
- [ ] Support both RSS 2.0 and Atom feed formats
- [ ] Add unit tests for various feed formats
- [ ] Typecheck passes

**Priority:** 5 (Independent)

---

### US-011: Refactor news-aggregator.js - Add Retry Logic
**As a** developer
**I want** automatic retry for failed network requests
**So that** transient failures don't cause empty results

**Acceptance Criteria:**
- [ ] Create `scripts/utils/http-client.js` with retry logic
- [ ] Support configurable retry count (default: 3)
- [ ] Support exponential backoff
- [ ] Support timeout configuration
- [ ] Handle partial failures in Promise.all (allSettled pattern)
- [ ] Update news-aggregator.js to use http-client
- [ ] Typecheck passes

**Priority:** 5 (Depends on US-001)

---

### US-012: Refactor send-email-summary.js - Extract HTML Templates
**As a** developer
**I want** email HTML templates in separate files
**So that** email styling can be modified without code changes

**Acceptance Criteria:**
- [ ] Create `templates/email/newsletter.html` template
- [ ] Create `templates/email/styles.css` for email styles
- [ ] Use template-engine.js for variable substitution
- [ ] Support inline CSS conversion for email compatibility
- [ ] Reduce send-email-summary.js by removing inline HTML (150+ lines)
- [ ] Typecheck passes

**Priority:** 6 (Depends on US-003)

---

### US-013: Refactor run-ralph.js - Unify Template Handling
**As a** developer
**I want** RALPH to use the same template engine as setup
**So that** template replacement logic isn't duplicated

**Acceptance Criteria:**
- [ ] Update run-ralph.js to use template-engine.js
- [ ] Remove duplicate template replacement code (lines 172-182)
- [ ] Add validation for prd.json schema before running
- [ ] Improve error recovery for file operations
- [ ] Typecheck passes

**Priority:** 6 (Depends on US-003)

---

### US-014: Refactor design-system.js - Add Theme Support
**As a** developer
**I want** customizable color themes for CLI output
**So that** users can adjust colors for their terminal

**Acceptance Criteria:**
- [ ] Add theme configuration (default, light, dark, no-color)
- [ ] Support `NO_COLOR` environment variable standard
- [ ] Add comprehensive icon set covering all use cases
- [ ] Export theme-aware color functions
- [ ] Update all CLI scripts to use theme-aware colors
- [ ] Typecheck passes

**Priority:** 7 (Independent)

---

### US-015: Add Unit Tests - Core Utilities
**As a** developer
**I want** unit tests for all utility modules
**So that** refactoring doesn't introduce regressions

**Acceptance Criteria:**
- [ ] Set up test framework (vitest or jest)
- [ ] Add tests for config-manager.js (100% coverage)
- [ ] Add tests for fs-helper.js (100% coverage)
- [ ] Add tests for template-engine.js (100% coverage)
- [ ] Add tests for http-client.js (100% coverage)
- [ ] Tests pass

**Priority:** 8 (Depends on US-001, US-002, US-003, US-011)

---

### US-016: Add Unit Tests - Project Analyzer
**As a** developer
**I want** tests for project-analyzer with various project types
**So that** analysis works correctly for all supported frameworks

**Acceptance Criteria:**
- [ ] Create test fixtures for: React, Vue, Node.js, Python, Go projects
- [ ] Test dependency detection accuracy
- [ ] Test framework detection for all supported frameworks
- [ ] Test convention detection (naming, structure)
- [ ] Test edge cases: empty project, corrupted package.json, missing files
- [ ] Achieve 80%+ coverage for project-analyzer.js
- [ ] Tests pass

**Priority:** 8 (Depends on US-004, US-008, US-009)

---

### US-017: Add Unit Tests - News Aggregation
**As a** developer
**I want** tests for news fetching with mocked responses
**So that** feed parsing is reliable

**Acceptance Criteria:**
- [ ] Mock RSS feed responses for testing
- [ ] Mock Hacker News API responses
- [ ] Mock Reddit API responses
- [ ] Test filtering logic (Claude/Anthropic only)
- [ ] Test cache behavior
- [ ] Test error handling for network failures
- [ ] Achieve 80%+ coverage for news-aggregator.js
- [ ] Tests pass

**Priority:** 9 (Depends on US-010, US-011)

---

### US-018: Add Integration Tests - CLI Commands
**As a** developer
**I want** integration tests for all CLI commands
**So that** the user-facing interface is verified

**Acceptance Criteria:**
- [ ] Test `claude-init setup --yes` in temp directory
- [ ] Test `claude-init setup --feature "test"` creates PRD
- [ ] Test `claude-init ralph --status` output
- [ ] Test `claude-init news --refresh --limit 5`
- [ ] Test `claude-init sync` basic operation
- [ ] Test error messages for invalid options
- [ ] Tests pass

**Priority:** 9 (Depends on US-005, US-006, US-007)

---

### US-019: Update CLAUDE.md Documentation
**As a** user
**I want** CLAUDE.md to reflect the refactored architecture
**So that** I understand how to work with the codebase

**Acceptance Criteria:**
- [ ] Update architecture diagram with new modules
- [ ] Document new utility modules (config-manager, fs-helper, template-engine, http-client)
- [ ] Document data files structure (dependency-purposes, test-frameworks, etc.)
- [ ] Update code patterns section with new patterns
- [ ] Document configuration options and environment variables
- [ ] Document testing approach and commands
- [ ] Typecheck passes (if any code examples)

**Priority:** 10 (After all refactoring)

---

### US-020: Update README and Add API Documentation
**As a** user
**I want** comprehensive README and API docs
**So that** I can understand and extend the tool

**Acceptance Criteria:**
- [ ] Update README.md with current features and usage
- [ ] Add CONTRIBUTING.md with development setup
- [ ] Add API.md documenting all public functions
- [ ] Add ARCHITECTURE.md with data flow diagrams
- [ ] Add extension guides: "Adding a News Source", "Adding a Framework"
- [ ] Typecheck passes (if any code examples)

**Priority:** 10 (After all refactoring)

---

## Functional Requirements

### FR-001: Backward Compatibility
All CLI commands and options must work identically after refactoring. No breaking changes to user-facing interface.

### FR-002: No New Dependencies (Minimal)
Prefer refactoring with existing dependencies. Only add:
- Test framework (vitest)
- XML parser (fast-xml-parser) - if needed

### FR-003: Error Recovery
All operations must have proper error handling with:
- Meaningful error messages
- Recovery suggestions
- Debug logging for troubleshooting

### FR-004: Performance
Refactoring must not degrade performance. Target improvements:
- 50% reduction in duplicate file reads
- Caching for repeated operations
- Faster startup time

## Non-Goals

- Adding new features (only refactoring existing)
- Changing CLI command names or options
- Migrating to TypeScript (future consideration)
- Adding GUI or web interface
- Supporting additional package managers beyond npm

## Technical Considerations

### Architecture After Refactoring

```
scripts/
├── setup-project.js          # Slim orchestrator (<100 lines)
├── run-ralph.js              # Slim orchestrator (<100 lines)
├── fetch-news.js             # Unchanged (CLI entry)
├── send-email-summary.js     # Slim, uses templates
├── sync-knowledge.js         # Unchanged
├── setup/                    # NEW: Setup modules
│   ├── phases.js             # Setup phase functions
│   ├── template-writer.js    # Generic template writing
│   └── ralph-setup.js        # RALPH-specific setup
├── utils/                    # Refactored utilities
│   ├── config-manager.js     # NEW: Centralized config
│   ├── fs-helper.js          # NEW: File operations
│   ├── template-engine.js    # NEW: Template rendering
│   ├── http-client.js        # NEW: HTTP with retry
│   ├── logger.js             # NEW: Debug logging
│   ├── project-analyzer.js   # Refactored, uses data/
│   ├── spec-generator.js     # Unchanged
│   ├── news-aggregator.js    # Refactored, uses http-client
│   ├── news-sources.js       # Unchanged
│   ├── news-fetcher.js       # Unchanged
│   ├── project-registry.js   # Unchanged
│   ├── design-system.js      # Enhanced with themes
│   ├── content-summarizer.js # Unchanged
│   └── diff-checker.js       # Unchanged
├── data/                     # NEW: Configuration data
│   ├── dependency-purposes.js
│   ├── test-frameworks.js
│   ├── linting-tools.js
│   └── build-tools.js
└── __tests__/                # NEW: Test files
    ├── config-manager.test.js
    ├── fs-helper.test.js
    ├── template-engine.test.js
    ├── project-analyzer.test.js
    ├── news-aggregator.test.js
    └── cli.integration.test.js
```

### Dependency Changes

```json
{
  "devDependencies": {
    "vitest": "^1.0.0"
  },
  "dependencies": {
    "fast-xml-parser": "^4.0.0"
  }
}
```

## Success Metrics

- [ ] All 20 user stories completed and passing
- [ ] 80%+ test coverage for utility modules
- [ ] Zero breaking changes to CLI interface
- [ ] setup-project.js reduced from 1410 lines to <300 lines
- [ ] project-analyzer.js reduced from 1104 lines to <500 lines
- [ ] All hardcoded values moved to config-manager
- [ ] No silent error swallowing (catch blocks logged)

## Open Questions

None - all requirements are defined based on code analysis.

## Story Dependency Graph

```
US-001 (Config Manager)     US-002 (FS Helper)
    │                           │
    ├───────────┬───────────────┤
    │           │               │
    v           v               v
US-004      US-003          US-008
(Registry)  (Template)      (Caching)
    │           │               │
    │           ├───────┬───────┤
    │           │       │       │
    │           v       v       v
    │       US-006  US-007  US-009
    │       (Writers)(RALPH)(Errors)
    │           │       │
    │           └───┬───┘
    │               │
    │               v
    │           US-005 (Split Main)
    │               │
    │               v
    └──────────>US-015-018 (Tests)
                    │
                    v
                US-019-020 (Docs)

Independent tracks:
US-010 (XML Parser) ──> US-017 (News Tests)
US-011 (HTTP Client) ─┘
US-012 (Email Templates)
US-013 (RALPH Templates)
US-014 (Design System)
```

---

**Created:** 2026-01-21
**Author:** Claude Code
**Status:** Ready for Implementation
