/**
 * Spec Generator - Generate PROJECT_SPEC.md from project analysis
 *
 * Creates a comprehensive specification document that RALPH can use
 * to generate intelligent, context-aware PRDs and user stories.
 */

import fs from 'fs-extra';
import path from 'path';
import { buildDirectoryTree } from './project-analyzer.js';

/**
 * Generate PROJECT_SPEC.md content from analysis
 */
export async function generateProjectSpec(targetPath, analysis) {
  const spec = [];

  // Header
  spec.push(`# Project Specification: ${analysis.overview.name}`);
  spec.push('');
  spec.push(`> Generated: ${new Date().toISOString().split('T')[0]}`);
  spec.push(`> Analyzed by: claude-init`);
  spec.push('');

  // Overview section
  spec.push('## Overview');
  spec.push('');
  if (analysis.overview.description) {
    spec.push(analysis.overview.description);
    spec.push('');
  }
  if (analysis.overview.purpose) {
    spec.push(`**Purpose:** ${analysis.overview.purpose}`);
    spec.push('');
  }
  if (analysis.overview.version && analysis.overview.version !== '0.0.0') {
    spec.push(`**Version:** ${analysis.overview.version}`);
    spec.push('');
  }

  // Tech Stack section
  spec.push('## Tech Stack');
  spec.push('');
  spec.push('| Component | Value |');
  spec.push('|-----------|-------|');
  spec.push(`| Language | ${analysis.techStack.language} |`);
  if (analysis.techStack.framework !== 'none') {
    spec.push(`| Framework | ${analysis.techStack.framework} |`);
  }
  if (analysis.techStack.runtime) {
    spec.push(`| Runtime | ${analysis.techStack.runtime} |`);
  }
  spec.push(`| Package Manager | ${analysis.techStack.packageManager} |`);
  spec.push('');

  // Directory Structure section
  spec.push('## Directory Structure');
  spec.push('');
  spec.push('```');
  const tree = await buildDirectoryTree(targetPath, 3);
  spec.push(tree);
  spec.push('```');
  spec.push('');

  // Key Directories
  spec.push('### Key Directories');
  spec.push('');
  if (analysis.structure.directories.src.exists) {
    spec.push(`- **src/** - ${analysis.structure.directories.src.purpose || 'Source code'}`);
  }
  if (analysis.structure.directories.tests.exists) {
    const testInfo = analysis.structure.directories.tests.framework !== 'unknown'
      ? ` (${analysis.structure.directories.tests.framework})`
      : '';
    spec.push(`- **tests/** - Test files${testInfo}`);
  }
  if (analysis.structure.directories.docs.exists) {
    spec.push(`- **docs/** - Documentation (${analysis.structure.directories.docs.files.length} files)`);
  }
  if (analysis.structure.directories.config.exists) {
    spec.push(`- **config/** - Configuration files`);
  }
  spec.push('');

  // Entry Points
  if (analysis.structure.entryPoints.length > 0) {
    spec.push('### Entry Points');
    spec.push('');
    for (const entry of analysis.structure.entryPoints) {
      spec.push(`- \`${entry}\``);
    }
    spec.push('');
  }

  // Dependencies section
  if (analysis.dependencies.production.length > 0 || analysis.dependencies.development.length > 0) {
    spec.push('## Dependencies');
    spec.push('');

    if (analysis.dependencies.production.length > 0) {
      spec.push('### Production');
      spec.push('');
      // Show top 15 most important
      const prodDeps = analysis.dependencies.production.slice(0, 15);
      for (const dep of prodDeps) {
        spec.push(`- \`${dep.name}\` (${dep.version}) - ${dep.purpose}`);
      }
      if (analysis.dependencies.production.length > 15) {
        spec.push(`- ... and ${analysis.dependencies.production.length - 15} more`);
      }
      spec.push('');
    }

    if (analysis.dependencies.development.length > 0) {
      spec.push('### Development');
      spec.push('');
      // Show top 10 most important
      const devDeps = analysis.dependencies.development.slice(0, 10);
      for (const dep of devDeps) {
        spec.push(`- \`${dep.name}\` (${dep.version}) - ${dep.purpose}`);
      }
      if (analysis.dependencies.development.length > 10) {
        spec.push(`- ... and ${analysis.dependencies.development.length - 10} more`);
      }
      spec.push('');
    }
  }

  // Scripts section
  if (Object.keys(analysis.scripts).length > 0) {
    spec.push('## Available Scripts');
    spec.push('');
    spec.push('| Script | Command |');
    spec.push('|--------|---------|');

    // Prioritize common scripts
    const priorityScripts = ['build', 'dev', 'start', 'test', 'lint', 'format', 'typecheck'];
    const sortedScripts = Object.entries(analysis.scripts).sort(([a], [b]) => {
      const aIdx = priorityScripts.indexOf(a);
      const bIdx = priorityScripts.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.localeCompare(b);
    });

    for (const [name, command] of sortedScripts.slice(0, 12)) {
      // Truncate long commands
      const displayCommand = command.length > 60 ? command.substring(0, 57) + '...' : command;
      spec.push(`| \`${name}\` | \`${displayCommand}\` |`);
    }
    if (sortedScripts.length > 12) {
      spec.push(`| ... | ${sortedScripts.length - 12} more scripts |`);
    }
    spec.push('');
  }

  // Code Patterns section
  spec.push('## Code Patterns & Conventions');
  spec.push('');

  // Testing
  spec.push('### Testing');
  spec.push('');
  spec.push(`- **Framework:** ${analysis.patterns.testing.framework}`);
  if (analysis.patterns.testing.location) {
    spec.push(`- **Location:** \`${analysis.patterns.testing.location}/\``);
  }
  spec.push(`- **Coverage:** ${analysis.patterns.testing.coverage ? 'Configured' : 'Not configured'}`);
  spec.push('');

  // Type System
  spec.push('### Type System');
  spec.push('');
  if (analysis.patterns.types.language !== 'none') {
    spec.push(`- **Language:** ${analysis.patterns.types.language}`);
    spec.push(`- **Strict Mode:** ${analysis.patterns.types.strict ? 'Yes' : 'No'}`);
  } else {
    spec.push('- No static type system detected');
  }
  spec.push('');

  // Code Style
  spec.push('### Code Style');
  spec.push('');
  spec.push(`- **Naming Convention:** ${analysis.conventions.namingStyle}`);
  spec.push(`- **Module System:** ${analysis.conventions.moduleSystem}`);
  if (analysis.patterns.linting.tool !== 'none') {
    spec.push(`- **Linting:** ${analysis.patterns.linting.tool} (\`${analysis.patterns.linting.config}\`)`);
  }
  if (analysis.patterns.formatting.tool !== 'none') {
    spec.push(`- **Formatting:** ${analysis.patterns.formatting.tool}`);
  }
  if (analysis.conventions.importOrder.length > 0) {
    spec.push(`- **Import Order:** ${analysis.conventions.importOrder.join(' → ')}`);
  }
  spec.push('');

  // Documentation section
  if (analysis.documentation.files.length > 0) {
    spec.push('## Existing Documentation');
    spec.push('');

    for (const doc of analysis.documentation.files.slice(0, 10)) {
      spec.push(`### ${doc.title}`);
      spec.push(`**Path:** \`${doc.path}\``);
      spec.push('');
      if (doc.summary) {
        spec.push(doc.summary);
        spec.push('');
      }
    }

    if (analysis.documentation.files.length > 10) {
      spec.push(`*... and ${analysis.documentation.files.length - 10} more documentation files*`);
      spec.push('');
    }

    // Existing specs/PRDs
    if (analysis.documentation.existingSpecs.length > 0) {
      spec.push('### Existing Specifications');
      spec.push('');
      spec.push('The following specification/PRD files were found:');
      spec.push('');
      for (const specFile of analysis.documentation.existingSpecs) {
        spec.push(`- \`${specFile}\``);
      }
      spec.push('');
    }
  }

  // RALPH Patterns section
  spec.push('## Codebase Patterns for RALPH');
  spec.push('');
  spec.push('These patterns were discovered during analysis and should be followed:');
  spec.push('');

  const patterns = generateDiscoveredPatterns(analysis);
  for (const pattern of patterns) {
    spec.push(`- ${pattern}`);
  }
  spec.push('');

  // Quality Gates section
  spec.push('## Quality Gates');
  spec.push('');
  spec.push('RALPH should run these checks before marking stories complete:');
  spec.push('');
  spec.push('```bash');

  // Add typecheck if TypeScript
  if (analysis.patterns.types.language === 'TypeScript') {
    if (analysis.scripts.typecheck) {
      spec.push(`# Typecheck: npm run typecheck`);
    } else {
      spec.push(`# Typecheck: npx tsc --noEmit`);
    }
  }

  // Add lint
  if (analysis.scripts.lint) {
    spec.push(`# Lint: npm run lint`);
  } else if (analysis.patterns.linting.tool !== 'none') {
    spec.push(`# Lint: npx ${analysis.patterns.linting.tool} .`);
  }

  // Add test
  if (analysis.scripts.test) {
    spec.push(`# Test: npm test`);
  } else if (analysis.patterns.testing.framework !== 'unknown') {
    spec.push(`# Test: npx ${analysis.patterns.testing.framework}`);
  }

  spec.push('```');
  spec.push('');

  // Footer
  spec.push('---');
  spec.push('');
  spec.push('*This specification was auto-generated by claude-init. Review and customize as needed.*');

  return spec.join('\n');
}

/**
 * Generate discovered patterns list for RALPH
 */
function generateDiscoveredPatterns(analysis) {
  const patterns = [];

  // Module system
  if (analysis.conventions.moduleSystem === 'ES modules') {
    patterns.push('Use ES modules (`import`/`export`) - NOT CommonJS');
  } else if (analysis.conventions.moduleSystem === 'CommonJS') {
    patterns.push('Use CommonJS (`require`/`module.exports`)');
  }

  // Naming conventions
  if (analysis.conventions.namingStyle.includes('kebab')) {
    patterns.push('Use kebab-case for file names (e.g., `my-component.js`)');
  } else if (analysis.conventions.namingStyle.includes('snake')) {
    patterns.push('Use snake_case for file names');
  } else if (analysis.conventions.namingStyle.includes('Pascal')) {
    patterns.push('Use PascalCase for component files (e.g., `MyComponent.tsx`)');
  }

  // Framework-specific patterns
  if (analysis.techStack.framework === 'React' || analysis.techStack.framework === 'Next.js') {
    patterns.push('React components use functional components with hooks');
  }
  if (analysis.techStack.framework === 'Express' || analysis.techStack.framework === 'Fastify') {
    patterns.push('API routes follow RESTful conventions');
  }

  // Testing patterns
  if (analysis.patterns.testing.framework !== 'unknown') {
    patterns.push(`Tests use ${analysis.patterns.testing.framework} framework`);
    if (analysis.patterns.testing.location) {
      patterns.push(`Test files go in \`${analysis.patterns.testing.location}/\` directory`);
    }
  }

  // Type patterns
  if (analysis.patterns.types.language === 'TypeScript') {
    patterns.push('All new code must be TypeScript');
    if (analysis.patterns.types.strict) {
      patterns.push('TypeScript strict mode is enabled - no `any` types');
    }
  }

  // Linting patterns
  if (analysis.patterns.linting.tool !== 'none') {
    patterns.push(`Code must pass ${analysis.patterns.linting.tool} checks`);
  }

  // Import order
  if (analysis.conventions.importOrder.length > 0) {
    patterns.push(`Import order: ${analysis.conventions.importOrder.join(' → ')}`);
  }

  // Source directory
  if (analysis.structure.directories.src.exists) {
    patterns.push('New source files go in `src/` directory');
  }

  // Add common patterns if nothing specific detected
  if (patterns.length < 3) {
    patterns.push('Keep functions small and focused');
    patterns.push('Use descriptive variable and function names');
    patterns.push('Handle errors appropriately');
  }

  return patterns;
}

/**
 * Write PROJECT_SPEC.md to the target directory
 */
export async function writeProjectSpec(targetPath, analysis) {
  const content = await generateProjectSpec(targetPath, analysis);
  const specPath = path.join(targetPath, 'PROJECT_SPEC.md');

  await fs.writeFile(specPath, content, 'utf-8');

  return specPath;
}

/**
 * Generate intelligent PRD based on analysis
 */
export function generateIntelligentPrd(featureDescription, analysis, existingDocs = []) {
  const slug = featureDescription
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30);

  // Determine story pattern based on tech stack
  const storyPattern = getStoryPattern(analysis.techStack, featureDescription);

  // Generate context-aware stories
  const userStories = generateContextAwareStories(
    featureDescription,
    storyPattern,
    analysis
  );

  // Build PRD
  const prd = {
    project: featureDescription,
    branchName: `ralph/${slug}`,
    description: `Implementation of: ${featureDescription}\n\nBased on: PROJECT_SPEC.md`,
    createdAt: new Date().toISOString().split('T')[0],
    projectContext: {
      name: analysis.overview.name,
      language: analysis.techStack.language,
      framework: analysis.techStack.framework,
      hasTypes: analysis.patterns.types.language === 'TypeScript',
      testFramework: analysis.patterns.testing.framework
    },
    techStack: analysis.techStack,
    existingPatterns: extractPatternsSummary(analysis),
    userStories
  };

  return prd;
}

/**
 * Get story pattern based on tech stack
 */
function getStoryPattern(techStack, feature) {
  const featureLower = feature.toLowerCase();

  // Detect feature type
  const isAPI = featureLower.includes('api') || featureLower.includes('endpoint') || featureLower.includes('route');
  const isAuth = featureLower.includes('auth') || featureLower.includes('login') || featureLower.includes('user');
  const isUI = featureLower.includes('ui') || featureLower.includes('component') || featureLower.includes('page');
  const isData = featureLower.includes('data') || featureLower.includes('model') || featureLower.includes('database');

  // Framework-specific patterns
  if (techStack.framework === 'React' || techStack.framework === 'Next.js') {
    if (isUI) return 'react-ui';
    if (isAPI && techStack.framework === 'Next.js') return 'nextjs-api';
    return 'react-feature';
  }

  if (techStack.framework === 'Express' || techStack.framework === 'Fastify' || techStack.framework === 'NestJS') {
    if (isAPI) return 'backend-api';
    if (isAuth) return 'backend-auth';
    return 'backend-feature';
  }

  if (techStack.framework === 'FastAPI' || techStack.framework === 'Django' || techStack.framework === 'Flask') {
    return 'python-api';
  }

  // Language-based fallback
  if (techStack.language === 'typescript' || techStack.language === 'javascript') {
    if (isAPI) return 'node-api';
    return 'node-feature';
  }

  if (techStack.language === 'python') {
    return 'python-feature';
  }

  if (techStack.language === 'go') {
    return 'go-feature';
  }

  return 'generic';
}

/**
 * Generate context-aware user stories
 */
function generateContextAwareStories(feature, pattern, analysis) {
  const hasTypes = analysis.patterns.types.language === 'TypeScript';
  const testFramework = analysis.patterns.testing.framework;
  const linter = analysis.patterns.linting.tool;

  // Base acceptance criteria
  const typecheckCriteria = hasTypes ? 'TypeScript compiles without errors' : null;
  const lintCriteria = linter !== 'none' ? `Code passes ${linter} checks` : null;
  const testCriteria = testFramework !== 'unknown' ? `Tests pass (${testFramework})` : 'Tests pass';

  // Story templates by pattern
  const storyTemplates = {
    'react-ui': [
      {
        title: 'Define component types and interfaces',
        description: `Define TypeScript interfaces and types for ${feature}`,
        criteria: ['Component props interface defined', 'State types defined', typecheckCriteria].filter(Boolean)
      },
      {
        title: 'Create base component structure',
        description: `Create the main React component for ${feature}`,
        criteria: ['Functional component created', 'Props properly typed', 'Basic JSX structure in place', typecheckCriteria].filter(Boolean)
      },
      {
        title: 'Implement component logic and state',
        description: `Add state management and business logic to ${feature}`,
        criteria: ['useState/useReducer for state', 'Event handlers implemented', 'Side effects handled with useEffect', testCriteria]
      },
      {
        title: 'Add styling and polish',
        description: `Style the component and handle edge cases for ${feature}`,
        criteria: ['Styles applied', 'Loading states handled', 'Error states handled', lintCriteria, testCriteria].filter(Boolean)
      }
    ],
    'backend-api': [
      {
        title: 'Define data models and types',
        description: `Create TypeScript interfaces and data models for ${feature}`,
        criteria: ['Request/response types defined', 'Database models defined if needed', typecheckCriteria].filter(Boolean)
      },
      {
        title: 'Implement core service logic',
        description: `Create service layer with business logic for ${feature}`,
        criteria: ['Service functions implemented', 'Error handling in place', 'Input validation added', testCriteria]
      },
      {
        title: 'Create API routes/controllers',
        description: `Implement REST endpoints for ${feature}`,
        criteria: ['Routes defined', 'Controllers connected to services', 'Proper HTTP status codes', 'Request validation middleware', testCriteria]
      },
      {
        title: 'Add integration tests and documentation',
        description: `Write integration tests and document the API for ${feature}`,
        criteria: ['Integration tests pass', 'API documented', lintCriteria, 'All tests pass'].filter(Boolean)
      }
    ],
    'backend-auth': [
      {
        title: 'Define user and auth types',
        description: `Create TypeScript interfaces for User, Session, and tokens`,
        criteria: ['User interface defined', 'Session/Token types defined', 'Auth request/response types', typecheckCriteria].filter(Boolean)
      },
      {
        title: 'Implement password hashing',
        description: `Create secure password hashing utilities`,
        criteria: ['Password hash function', 'Password verify function', 'Uses bcrypt or argon2', 'Unit tests pass']
      },
      {
        title: 'Create token management',
        description: `Implement JWT or session token handling`,
        criteria: ['Token generation', 'Token verification', 'Token refresh logic', 'Expiration handling', testCriteria]
      },
      {
        title: 'Add auth routes',
        description: `Create login, register, and logout endpoints`,
        criteria: ['POST /auth/register', 'POST /auth/login', 'POST /auth/logout', 'Input validation', testCriteria]
      },
      {
        title: 'Implement auth middleware',
        description: `Create middleware to protect routes`,
        criteria: ['Auth middleware extracts token', 'Validates and decodes token', 'Attaches user to request', 'Returns 401 on failure', testCriteria]
      },
      {
        title: 'Add protected route tests',
        description: `Test auth flow end-to-end`,
        criteria: ['Registration flow tested', 'Login flow tested', 'Protected routes tested', 'All tests pass', lintCriteria].filter(Boolean)
      }
    ],
    'node-feature': [
      {
        title: 'Define types and interfaces',
        description: `Create TypeScript types for ${feature}`,
        criteria: ['Interfaces defined', 'Types exported', typecheckCriteria].filter(Boolean)
      },
      {
        title: 'Implement core functionality',
        description: `Build the main logic for ${feature}`,
        criteria: ['Core functions implemented', 'Error handling added', 'Edge cases handled', testCriteria]
      },
      {
        title: 'Add integration and exports',
        description: `Integrate ${feature} with the rest of the codebase`,
        criteria: ['Exported from appropriate module', 'Integrated with existing code', lintCriteria, 'All tests pass'].filter(Boolean)
      }
    ],
    'python-api': [
      {
        title: 'Define Pydantic models',
        description: `Create data models and schemas for ${feature}`,
        criteria: ['Request models defined', 'Response models defined', 'Validation rules set', 'Type hints complete']
      },
      {
        title: 'Implement service layer',
        description: `Create business logic for ${feature}`,
        criteria: ['Service functions created', 'Database operations if needed', 'Error handling', 'Unit tests pass']
      },
      {
        title: 'Create API endpoints',
        description: `Implement REST routes for ${feature}`,
        criteria: ['Routes defined', 'Connected to services', 'Proper status codes', 'OpenAPI docs updated', testCriteria]
      },
      {
        title: 'Add tests and documentation',
        description: `Complete testing and documentation for ${feature}`,
        criteria: ['pytest tests pass', 'API documented', 'Type checking passes', 'All tests pass']
      }
    ],
    'generic': [
      {
        title: 'Set up data structures',
        description: `Define data structures and types for ${feature}`,
        criteria: ['Types/interfaces defined', 'Data models created', typecheckCriteria || 'Code compiles'].filter(Boolean)
      },
      {
        title: 'Implement core logic',
        description: `Build the main functionality for ${feature}`,
        criteria: ['Core functions implemented', 'Error handling in place', testCriteria]
      },
      {
        title: 'Add integration and API',
        description: `Make ${feature} accessible through the application`,
        criteria: ['Integration complete', 'API/interface defined', 'Input validation', testCriteria]
      },
      {
        title: 'Polish and document',
        description: `Finalize ${feature} with documentation and cleanup`,
        criteria: ['Code cleaned up', 'Documentation added', lintCriteria || 'Code style consistent', 'All tests pass'].filter(Boolean)
      }
    ]
  };

  // Get template or fall back to generic
  const template = storyTemplates[pattern] || storyTemplates['generic'];

  // Generate stories with IDs and priorities
  return template.map((story, index) => ({
    id: `US-${String(index + 1).padStart(3, '0')}`,
    title: story.title,
    description: story.description,
    acceptanceCriteria: story.criteria,
    priority: index + 1,
    passes: false,
    notes: ''
  }));
}

/**
 * Extract patterns summary for PRD
 */
function extractPatternsSummary(analysis) {
  return {
    moduleSystem: analysis.conventions.moduleSystem,
    namingStyle: analysis.conventions.namingStyle,
    testFramework: analysis.patterns.testing.framework,
    linter: analysis.patterns.linting.tool,
    hasTypes: analysis.patterns.types.language === 'TypeScript',
    strictTypes: analysis.patterns.types.strict
  };
}

/**
 * Generate PRD markdown file
 */
export function generatePrdMarkdown(prd) {
  const lines = [];

  lines.push(`# PRD: ${prd.project}`);
  lines.push('');
  lines.push('## Overview');
  lines.push('');
  lines.push(prd.description);
  lines.push('');
  lines.push('## Project Context');
  lines.push('');
  lines.push(`- **Project:** ${prd.projectContext.name}`);
  lines.push(`- **Language:** ${prd.projectContext.language}`);
  if (prd.projectContext.framework !== 'none') {
    lines.push(`- **Framework:** ${prd.projectContext.framework}`);
  }
  lines.push(`- **Types:** ${prd.projectContext.hasTypes ? 'TypeScript' : 'JavaScript'}`);
  lines.push(`- **Testing:** ${prd.projectContext.testFramework}`);
  lines.push('');
  lines.push('## Branch');
  lines.push('');
  lines.push(`\`${prd.branchName}\``);
  lines.push('');
  lines.push('## User Stories');
  lines.push('');

  for (const story of prd.userStories) {
    lines.push(`### ${story.id}: ${story.title}`);
    lines.push('');
    lines.push(story.description);
    lines.push('');
    lines.push('**Acceptance Criteria:**');
    for (const criteria of story.acceptanceCriteria) {
      lines.push(`- [ ] ${criteria}`);
    }
    lines.push('');
    lines.push(`**Priority:** ${story.priority}`);
    lines.push('');
  }

  lines.push('## Quality Gates');
  lines.push('');
  lines.push('All stories must pass these checks before completion:');
  lines.push('');
  if (prd.existingPatterns.hasTypes) {
    lines.push('- [ ] TypeScript compiles without errors');
  }
  if (prd.existingPatterns.linter !== 'none') {
    lines.push(`- [ ] ${prd.existingPatterns.linter} passes`);
  }
  if (prd.existingPatterns.testFramework !== 'unknown') {
    lines.push(`- [ ] Tests pass (${prd.existingPatterns.testFramework})`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*Generated by claude-init with intelligent project analysis*');
  lines.push(`*Run \`./scripts/ralph/ralph.sh 20\` to start autonomous development*`);

  return lines.join('\n');
}

export default {
  generateProjectSpec,
  writeProjectSpec,
  generateIntelligentPrd,
  generatePrdMarkdown
};
