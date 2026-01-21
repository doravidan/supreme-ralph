/**
 * RALPH Setup Module
 *
 * Handles all RALPH autonomous development agent setup,
 * including file generation, skill installation, and PRD creation.
 *
 * @module setup/ralph-setup
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { ui } from '../utils/design-system.js';
import {
  generateIntelligentPrd,
  generatePrdMarkdown
} from '../utils/spec-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_PATH = path.join(__dirname, '..', '..', 'templates');

/**
 * Extract project context from analysis for RALPH CLAUDE.md
 *
 * @param {object} config - Project configuration
 * @param {object|null} analysis - Project analysis results
 * @returns {object} Context object with all template variables
 */
export function buildRalphContext(config, analysis = null) {
  const context = {
    language: config.language || 'typescript',
    framework: config.framework || 'none',
    testFramework: 'unknown',
    moduleSystem: 'unknown',
    namingStyle: 'camelCase',
    importOrder: 'Not specified',
    codebasePatterns: '(Patterns will be discovered and logged in progress.txt)',
    srcDir: '',
    testDir: '',
    entryPoint: '',
    hasTypes: config.language === 'typescript',
    strictTypes: false,
    buildCommand: config.buildCommand || 'npm run build',
    testCommand: config.testCommand || 'npm test',
    lintCommand: config.lintCommand || 'npm run lint',
    typecheckCommand: 'echo "No typecheck"'
  };

  if (analysis) {
    context.language = analysis.techStack.language;
    context.framework = analysis.techStack.framework;
    context.testFramework = analysis.patterns.testing.framework;
    context.moduleSystem = analysis.conventions.moduleSystem;
    context.namingStyle = analysis.conventions.namingStyle;
    context.importOrder = analysis.conventions.importOrder.length > 0
      ? analysis.conventions.importOrder.join(' -> ')
      : 'Not specified';
    context.hasTypes = analysis.patterns.types.language === 'TypeScript';
    context.strictTypes = analysis.patterns.types.strict;

    if (analysis.structure.directories.src.exists) {
      context.srcDir = 'src';
    }
    if (analysis.patterns.testing.location) {
      context.testDir = analysis.patterns.testing.location;
    }
    if (analysis.structure.entryPoints.length > 0) {
      context.entryPoint = analysis.structure.entryPoints[0];
    }

    // Build discovered patterns list
    const patterns = [];
    if (context.moduleSystem !== 'unknown') {
      patterns.push(`- Use ${context.moduleSystem} (${context.moduleSystem === 'ES modules' ? 'import/export' : 'require/module.exports'})`);
    }
    if (context.namingStyle) {
      patterns.push(`- File naming: ${context.namingStyle}`);
    }
    if (analysis.patterns.linting.tool !== 'none') {
      patterns.push(`- Code must pass ${analysis.patterns.linting.tool} checks`);
    }
    if (context.testFramework !== 'unknown') {
      patterns.push(`- Tests use ${context.testFramework} framework`);
    }
    if (context.hasTypes) {
      patterns.push(`- All new code must be TypeScript${context.strictTypes ? ' (strict mode)' : ''}`);
    }
    if (analysis.conventions.importOrder.length > 0) {
      patterns.push(`- Import order: ${analysis.conventions.importOrder.join(' -> ')}`);
    }
    if (context.srcDir) {
      patterns.push(`- Source code goes in \`${context.srcDir}/\``);
    }
    if (context.testDir) {
      patterns.push(`- Tests go in \`${context.testDir}/\``);
    }

    context.codebasePatterns = patterns.length > 0 ? patterns.join('\n') : '(See PROJECT_SPEC.md for details)';

    // Update commands from analysis
    if (analysis.scripts?.build) {
      context.buildCommand = 'npm run build';
    }
    if (analysis.scripts?.test) {
      context.testCommand = 'npm test';
    }
    if (analysis.scripts?.lint) {
      context.lintCommand = 'npm run lint';
    }
  }

  // Build typecheck command
  if (context.hasTypes) {
    context.typecheckCommand = analysis?.scripts?.typecheck
      ? 'npm run typecheck'
      : 'npx tsc --noEmit';
  }

  // Build project context string
  context.projectContext = `
This is a ${context.language} project${context.framework !== 'none' ? ` using ${context.framework}` : ''}.
${analysis?.overview?.description ? `\nDescription: ${analysis.overview.description}` : ''}

Build: \`${context.buildCommand}\`
Test: \`${context.testCommand}\`
Lint: \`${context.lintCommand}\`
${context.hasTypes ? `Typecheck: \`${context.typecheckCommand}\`` : ''}
`;

  return context;
}

/**
 * Generate RALPH CLAUDE.md content from template
 *
 * @param {string} template - CLAUDE.md template content
 * @param {object} context - Context object from buildRalphContext
 * @returns {string} Rendered CLAUDE.md content
 */
export function generateRalphClaudeMd(template, context) {
  // Apply template replacements
  let content = template
    .replace(/\{\{typecheckCommand\}\}/g, context.typecheckCommand)
    .replace(/\{\{lintCommand\}\}/g, context.lintCommand)
    .replace(/\{\{testCommand\}\}/g, context.testCommand)
    .replace(/\{\{buildCommand\}\}/g, context.buildCommand)
    .replace(/\{\{branchName\}\}/g, 'ralph/feature-name')
    .replace(/\{\{projectContext\}\}/g, context.projectContext)
    .replace(/\{\{language\}\}/g, context.language)
    .replace(/\{\{framework\}\}/g, context.framework !== 'none' ? context.framework : 'None')
    .replace(/\{\{moduleSystem\}\}/g, context.moduleSystem)
    .replace(/\{\{testFramework\}\}/g, context.testFramework)
    .replace(/\{\{namingStyle\}\}/g, context.namingStyle)
    .replace(/\{\{importOrder\}\}/g, context.importOrder)
    .replace(/\{\{codebasePatterns\}\}/g, context.codebasePatterns);

  // Handle conditional sections
  if (context.hasTypes) {
    content = content.replace(/\{\{#if hasTypes\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  } else {
    content = content.replace(/\{\{#if hasTypes\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  }

  if (context.strictTypes) {
    content = content.replace(/\{\{#if strictTypes\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  } else {
    content = content.replace(/\{\{#if strictTypes\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  }

  if (context.srcDir) {
    content = content.replace(/\{\{#if srcDir\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1').replace(/\{\{srcDir\}\}/g, context.srcDir);
  } else {
    content = content.replace(/\{\{#if srcDir\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  }

  if (context.testDir) {
    content = content.replace(/\{\{#if testDir\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1').replace(/\{\{testDir\}\}/g, context.testDir);
  } else {
    content = content.replace(/\{\{#if testDir\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  }

  if (context.entryPoint) {
    content = content.replace(/\{\{#if entryPoint\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1').replace(/\{\{entryPoint\}\}/g, context.entryPoint);
  } else {
    content = content.replace(/\{\{#if entryPoint\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  }

  return content;
}

/**
 * Write RALPH core files (ralph.sh, CLAUDE.md, example)
 *
 * @param {string} targetPath - Target project directory
 * @param {object} config - Project configuration
 * @param {object|null} analysis - Project analysis results
 * @returns {Promise<void>}
 */
export async function writeRalphFiles(targetPath, config, analysis = null) {
  const ralphDir = path.join(targetPath, 'scripts', 'ralph');
  await fs.ensureDir(ralphDir);

  // Create tasks directory for PRDs
  await fs.ensureDir(path.join(targetPath, 'tasks'));

  // Copy ralph.sh template
  const ralphShTemplate = await fs.readFile(
    path.join(TEMPLATES_PATH, 'ralph', 'ralph.sh.template'),
    'utf-8'
  );
  await fs.writeFile(path.join(ralphDir, 'ralph.sh'), ralphShTemplate, 'utf-8');
  await fs.chmod(path.join(ralphDir, 'ralph.sh'), '755');
  ui.successText(`  ${ui.icons.success} Created scripts/ralph/ralph.sh`);

  // Generate CLAUDE.md
  const claudeMdTemplate = await fs.readFile(
    path.join(TEMPLATES_PATH, 'ralph', 'CLAUDE.md.template'),
    'utf-8'
  );
  const context = buildRalphContext(config, analysis);
  const ralphClaudeMd = generateRalphClaudeMd(claudeMdTemplate, context);
  await fs.writeFile(path.join(ralphDir, 'CLAUDE.md'), ralphClaudeMd, 'utf-8');
  ui.successText(`  ${ui.icons.success} Created scripts/ralph/CLAUDE.md${analysis ? ' (with project context)' : ''}`);

  // Copy example prd.json
  await fs.copy(
    path.join(TEMPLATES_PATH, 'ralph', 'prd.json.example'),
    path.join(ralphDir, 'prd.json.example')
  );
  ui.successText(`  ${ui.icons.success} Created scripts/ralph/prd.json.example`);

  // Create progress.txt template
  const progressTemplate = `# Progress Log

Started: ${new Date().toISOString().split('T')[0]}

## Codebase Patterns
(Patterns will be added as they are discovered during iterations)

---

`;
  await fs.writeFile(path.join(ralphDir, 'progress.txt.template'), progressTemplate, 'utf-8');
  ui.successText(`  ${ui.icons.success} Created scripts/ralph/progress.txt.template`);
}

/**
 * Setup RALPH skills in .claude/skills directory
 *
 * @param {string} targetPath - Target project directory
 * @returns {Promise<void>}
 */
export async function setupRalphSkills(targetPath) {
  const skills = [
    { name: 'prd', path: 'prd' },
    { name: 'ralph', path: 'ralph' },
    { name: 'ralph-run', path: 'ralph-run' }
  ];

  for (const skill of skills) {
    const skillDir = path.join(targetPath, '.claude', 'skills', skill.name);
    await fs.ensureDir(skillDir);
    await fs.copy(
      path.join(TEMPLATES_PATH, 'ralph', 'skills', skill.path, 'SKILL.md'),
      path.join(skillDir, 'SKILL.md')
    );
    ui.successText(`  ${ui.icons.success} Created .claude/skills/${skill.name}/SKILL.md`);
  }
}

/**
 * Add RALPH command to .claude/commands
 *
 * @param {string} targetPath - Target project directory
 * @returns {Promise<void>}
 */
export async function writeRalphCommand(targetPath) {
  const ralphCommand = `---
description: Run RALPH autonomous development loop
allowed-tools: Bash
---

# RALPH - Autonomous Development Agent

Run the RALPH autonomous agent loop to implement features from a PRD.

## Prerequisites

1. Create a PRD using the /prd skill:
   \`/prd Create a PRD for [your feature]\`

2. Convert to prd.json using the /ralph skill:
   \`/ralph-convert tasks/prd-[feature].md\`

3. Run RALPH:
   \`./scripts/ralph/ralph.sh [max_iterations]\`

## How It Works

RALPH:
1. Reads prd.json and picks the highest priority incomplete story
2. Implements ONLY that story
3. Runs quality checks (typecheck, lint, tests)
4. Commits if all checks pass
5. Marks the story complete
6. Repeats until all stories are done

## Commands

- \`./scripts/ralph/ralph.sh 20\` - Run up to 20 iterations
- Check \`progress.txt\` for logs and patterns
- Check \`prd.json\` for story status
`;

  await fs.writeFile(
    path.join(targetPath, '.claude', 'commands', 'ralph.md'),
    ralphCommand,
    'utf-8'
  );
  ui.successText(`  ${ui.icons.success} Created .claude/commands/ralph.md`);
}

/**
 * Generate a basic PRD from feature description (fallback)
 *
 * @param {string} featureDescription - Feature description
 * @param {object} config - Project configuration
 * @returns {object} PRD object
 */
export function generateBasicPrd(featureDescription, config) {
  const slug = featureDescription
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30);

  const userStories = [
    {
      id: 'US-001',
      title: 'Set up data models and types',
      description: `As a developer, I want to define the data models and types for ${featureDescription} so that I have a solid foundation to build on`,
      acceptanceCriteria: [
        'TypeScript interfaces/types are defined',
        'Types are exported for use in other modules',
        'Typecheck passes'
      ],
      priority: 1,
      passes: false,
      notes: ''
    },
    {
      id: 'US-002',
      title: 'Implement core logic',
      description: `As a developer, I want to implement the core business logic for ${featureDescription} so that the feature works correctly`,
      acceptanceCriteria: [
        'Core functions are implemented',
        'Error handling is in place',
        'Unit tests are written',
        'Typecheck passes',
        'Tests pass'
      ],
      priority: 2,
      passes: false,
      notes: ''
    },
    {
      id: 'US-003',
      title: 'Add integration and API',
      description: `As a user, I want ${featureDescription} to be accessible through the application interface`,
      acceptanceCriteria: [
        'Integration with existing code is complete',
        'API/interface is defined and working',
        'Input validation is implemented',
        'Typecheck passes',
        'Tests pass'
      ],
      priority: 3,
      passes: false,
      notes: ''
    },
    {
      id: 'US-004',
      title: 'Polish and documentation',
      description: `As a developer, I want ${featureDescription} to be well-documented and production-ready`,
      acceptanceCriteria: [
        'Code is clean and well-commented where needed',
        'Error messages are user-friendly',
        'Edge cases are handled',
        'Typecheck passes',
        'All tests pass'
      ],
      priority: 4,
      passes: false,
      notes: ''
    }
  ];

  return {
    project: featureDescription,
    branchName: `ralph/${slug}`,
    description: `Implementation of: ${featureDescription}`,
    createdAt: new Date().toISOString().split('T')[0],
    userStories
  };
}

/**
 * Write initial PRD if requested
 *
 * @param {string} targetPath - Target project directory
 * @param {object} config - Project configuration
 * @param {object|null} analysis - Project analysis results
 * @returns {Promise<object|undefined>} PRD object if created
 */
export async function writeInitialPrd(targetPath, config, analysis = null) {
  if (!config.createInitialPrd || !config.initialFeature) {
    return;
  }

  let prd;
  let isIntelligent = false;

  if (analysis) {
    ui.muted('  Generating intelligent PRD based on project analysis...');
    prd = generateIntelligentPrd(config.initialFeature, analysis, analysis.documentation.files);
    isIntelligent = true;
  } else {
    prd = generateBasicPrd(config.initialFeature, config);
  }

  // Write prd.json
  await fs.writeJson(path.join(targetPath, 'prd.json'), prd, { spaces: 2 });
  const storyCount = prd.userStories.length;
  ui.successText(`  ${ui.icons.success} Created prd.json for: "${config.initialFeature}" (${storyCount} ${isIntelligent ? 'intelligent' : 'basic'} stories)`);

  // Create progress.txt
  let progressContent = `# Progress Log - ${prd.branchName}

Started: ${prd.createdAt}
Feature: ${config.initialFeature}

## Project Context
`;

  if (analysis) {
    progressContent += `- Language: ${analysis.techStack.language}
- Framework: ${analysis.techStack.framework !== 'none' ? analysis.techStack.framework : 'None'}
- Test Framework: ${analysis.patterns.testing.framework}
- Types: ${analysis.patterns.types.language !== 'none' ? analysis.patterns.types.language : 'None'}

`;
  }

  progressContent += `## Codebase Patterns
`;

  if (analysis) {
    if (analysis.conventions.moduleSystem) {
      progressContent += `- Module system: ${analysis.conventions.moduleSystem}\n`;
    }
    if (analysis.conventions.namingStyle) {
      progressContent += `- Naming convention: ${analysis.conventions.namingStyle}\n`;
    }
    if (analysis.patterns.linting.tool !== 'none') {
      progressContent += `- Linting: ${analysis.patterns.linting.tool}\n`;
    }
    if (analysis.conventions.importOrder.length > 0) {
      progressContent += `- Import order: ${analysis.conventions.importOrder.join(' -> ')}\n`;
    }
    if (analysis.structure.directories.src.exists) {
      progressContent += `- Source code in: src/\n`;
    }
    if (analysis.patterns.testing.location) {
      progressContent += `- Tests in: ${analysis.patterns.testing.location}/\n`;
    }
  } else {
    progressContent += `(Patterns will be added as they are discovered during iterations)\n`;
  }

  progressContent += `
---

`;

  await fs.writeFile(path.join(targetPath, 'progress.txt'), progressContent, 'utf-8');
  ui.successText(`  ${ui.icons.success} Created progress.txt${analysis ? ' (pre-populated with patterns)' : ''}`);

  // Generate markdown version
  let prdMarkdownContent;
  if (isIntelligent) {
    prdMarkdownContent = generatePrdMarkdown(prd);
  } else {
    prdMarkdownContent = `# PRD: ${config.initialFeature}

## Overview
${prd.description}

## Branch
\`${prd.branchName}\`

## User Stories

${prd.userStories.map(story => `### ${story.id}: ${story.title}
**As a** developer/user
**I want** ${story.description.split('I want to ')[1]?.split(' so that')[0] || story.title}
**So that** ${story.description.split('so that ')[1] || 'the feature works as expected'}

**Acceptance Criteria:**
${story.acceptanceCriteria.map(c => `- [ ] ${c}`).join('\n')}

**Priority:** ${story.priority}
`).join('\n')}

## Notes
- Generated automatically by claude-init setup
- Customize this PRD and prd.json as needed
- Run \`./scripts/ralph/ralph.sh 20\` to start autonomous development
`;
  }

  const slug = prd.branchName.replace('ralph/', '');
  await fs.writeFile(path.join(targetPath, 'tasks', `prd-${slug}.md`), prdMarkdownContent, 'utf-8');
  ui.successText(`  ${ui.icons.success} Created tasks/prd-${slug}.md`);

  return prd;
}

/**
 * Main RALPH setup function - orchestrates all RALPH setup
 *
 * @param {string} targetPath - Target project directory
 * @param {object} config - Project configuration
 * @param {object|null} analysis - Project analysis results
 * @returns {Promise<void>}
 */
export async function writeRalph(targetPath, config, analysis = null) {
  // Write core RALPH files
  await writeRalphFiles(targetPath, config, analysis);

  // Setup skills
  await setupRalphSkills(targetPath);

  // Write command
  await writeRalphCommand(targetPath);
}

export default {
  buildRalphContext,
  generateRalphClaudeMd,
  writeRalphFiles,
  setupRalphSkills,
  writeRalphCommand,
  generateBasicPrd,
  writeInitialPrd,
  writeRalph
};
