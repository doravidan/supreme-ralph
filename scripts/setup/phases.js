/**
 * Setup Phases Module
 *
 * Extracts the main setup phases from setup-project.js into
 * testable, focused functions.
 *
 * @module setup/phases
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';
import { ui } from '../utils/design-system.js';
import {
  hasUpdatesSinceLastSetup,
  markProjectSetup,
  loadMetadata
} from '../utils/diff-checker.js';
import { registerProject } from '../utils/project-registry.js';
import { analyzeProject } from '../utils/project-analyzer.js';
import { writeProjectSpec } from '../utils/spec-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KNOWLEDGE_BASE_PATH = path.join(__dirname, '..', '..', 'knowledge-base');

/**
 * Phase 1: Validate the setup environment
 * - Check target directory permissions
 * - Verify knowledge base exists
 * - Check for updates
 *
 * @param {string} targetPath - Target project directory
 * @param {object} options - CLI options
 * @returns {Promise<{valid: boolean, kbExists: boolean, hasUpdates: boolean, updateInfo: object|null}>}
 */
export async function validateSetupEnvironment(targetPath, options = {}) {
  const result = {
    valid: true,
    kbExists: false,
    hasUpdates: false,
    updateInfo: null,
    errors: []
  };

  // Check target directory is writable
  try {
    await fs.ensureDir(targetPath);
    const testFile = path.join(targetPath, '.claude-init-test');
    await fs.writeFile(testFile, 'test');
    await fs.remove(testFile);
  } catch (error) {
    result.valid = false;
    result.errors.push(`Cannot write to target directory: ${error.message}`);
    return result;
  }

  // Check knowledge base exists
  result.kbExists = await fs.pathExists(KNOWLEDGE_BASE_PATH);

  if (!result.kbExists) {
    ui.warningText('Knowledge base not found. Run "npm run sync-knowledge" first.');
    ui.muted('Continuing with built-in templates...\n');
  } else {
    // Check for updates
    const updateInfo = await hasUpdatesSinceLastSetup(KNOWLEDGE_BASE_PATH);
    result.hasUpdates = updateInfo.hasUpdates;
    result.updateInfo = updateInfo;
  }

  return result;
}

/**
 * Phase 2: Check for and report knowledge base updates
 *
 * @param {object} updateInfo - Update information from validateSetupEnvironment
 * @param {object} options - CLI options
 * @returns {Promise<boolean>} - Whether to proceed with setup
 */
export async function checkKnowledgeBaseUpdates(updateInfo, options = {}) {
  if (!updateInfo || !updateInfo.hasUpdates) {
    // No updates, show current version
    const metadata = await loadMetadata(KNOWLEDGE_BASE_PATH).catch(() => ({}));
    if (metadata.version) {
      ui.success(`Using knowledge base v${metadata.version} (synced: ${metadata.lastSync || 'Never'})`);
    }
    return true;
  }

  // Show update information
  console.log(ui.colors.warningBold(`\n${ui.icons.warning} Knowledge base has been updated since last project setup!`));
  ui.muted(`   Last setup: ${updateInfo.lastSetup}`);
  ui.muted(`   Changes: ${updateInfo.message}`);
  ui.blank();

  if (updateInfo.summary) {
    if (updateInfo.summary.added && updateInfo.summary.added.length > 0) {
      ui.successText(`   New docs: ${updateInfo.summary.added.join(', ')}`);
    }
    if (updateInfo.summary.modified && updateInfo.summary.modified.length > 0) {
      ui.warningText(`   Updated: ${updateInfo.summary.modified.join(', ')}`);
    }
  }
  ui.blank();

  // If --yes flag, proceed automatically
  if (options.yes) {
    return true;
  }

  // Ask user if they want to proceed
  const { proceed } = await inquirer.prompt([{
    type: 'confirm',
    name: 'proceed',
    message: 'Continue with setup using updated knowledge base?',
    default: true
  }]);

  if (!proceed) {
    ui.muted('Run "npm run view-changes" to see what\'s new.');
    return false;
  }

  return true;
}

/**
 * Phase 3: Run deep project analysis
 *
 * @param {string} targetPath - Target project directory
 * @returns {Promise<object|null>} - Analysis results or null on failure
 */
export async function runProjectAnalysis(targetPath) {
  ui.subheader('Analyzing project...', 'search');
  ui.blank();

  const analysisSpinner = ui.spinner('Scanning directory structure...').start();

  try {
    const analysis = await analyzeProject(targetPath);

    analysisSpinner.text = 'Analyzing dependencies...';
    // Analysis already includes dependencies

    analysisSpinner.text = 'Detecting patterns...';
    // Analysis already includes patterns

    analysisSpinner.text = 'Finding documentation...';
    // Analysis already includes documentation

    analysisSpinner.succeed('Project analysis complete!');

    // Show analysis summary
    ui.blank();
    ui.muted(`  Language: ${analysis.techStack.language}`);
    if (analysis.techStack.framework !== 'none') {
      ui.muted(`  Framework: ${analysis.techStack.framework}`);
    }
    ui.muted(`  Package Manager: ${analysis.techStack.packageManager}`);
    if (analysis.patterns.testing.framework !== 'unknown') {
      ui.muted(`  Test Framework: ${analysis.patterns.testing.framework}`);
    }
    if (analysis.patterns.types.language !== 'none') {
      ui.muted(`  Types: ${analysis.patterns.types.language}${analysis.patterns.types.strict ? ' (strict)' : ''}`);
    }
    if (analysis.documentation.files.length > 0) {
      ui.muted(`  Documentation: ${analysis.documentation.files.length} .md files found`);
    }
    ui.blank();

    return analysis;
  } catch (error) {
    analysisSpinner.fail('Analysis failed');
    ui.warningText(`  Could not analyze project: ${error.message}`);
    ui.muted('  Continuing with manual configuration...');
    return null;
  }
}

/**
 * Phase 4: Generate PROJECT_SPEC.md from analysis
 *
 * @param {string} targetPath - Target project directory
 * @param {object} analysis - Project analysis results
 * @returns {Promise<string|null>} - Path to spec file or null on failure
 */
export async function generateProjectSpec(targetPath, analysis) {
  if (!analysis) return null;

  try {
    const specPath = await writeProjectSpec(targetPath, analysis);
    ui.successText(`  ${ui.icons.success} Created PROJECT_SPEC.md (comprehensive project analysis)`);
    return specPath;
  } catch (error) {
    ui.warningText(`  Could not create PROJECT_SPEC.md: ${error.message}`);
    return null;
  }
}

/**
 * Phase 5: Finalize setup - mark project and register
 *
 * @param {string} targetPath - Target project directory
 * @param {object} config - Project configuration
 * @returns {Promise<{project: object, isNew: boolean}>}
 */
export async function finalizeSetup(targetPath, config) {
  // Mark project setup in metadata
  await markProjectSetup(KNOWLEDGE_BASE_PATH).catch(() => {});

  // Load KB metadata for version tracking
  const kbMetadata = await loadMetadata(KNOWLEDGE_BASE_PATH).catch(() => ({}));

  // Register project in global tracking
  const { project, isNew } = await registerProject({
    targetPath,
    projectName: config.projectName,
    projectDescription: config.projectDescription,
    language: config.language,
    framework: config.framework,
    setupHooks: config.setupHooks,
    setupAgents: config.setupAgents,
    setupCommands: config.setupCommands,
    setupRules: config.setupRules,
    setupSkills: config.setupSkills,
    kbVersion: kbMetadata.version
  });

  return { project, isNew };
}

/**
 * Phase 6: Display setup summary
 *
 * @param {object} config - Project configuration
 * @param {object} analysis - Project analysis (may be null)
 * @param {object} registration - Registration result from finalizeSetup
 */
export function displaySetupSummary(config, analysis, registration) {
  console.log(ui.colors.success(`\n${ui.icons.complete} Claude Code project initialized successfully!\n`));

  // Show project registration status
  if (registration.isNew) {
    ui.success('Project registered in global tracking');
  } else {
    ui.success(`Project updated (setup #${registration.project.setupCount})`);
  }
  ui.blank();

  // List created files
  ui.muted('Created files:');
  ui.muted('  - CLAUDE.md');
  ui.muted('  - .claude/settings.json');

  if (config.setupRules !== false) {
    ui.muted('  - .claude/rules/*.md');
  }
  if (config.setupCommands !== false) {
    ui.muted('  - .claude/commands/*.md');
  }
  if (config.setupAgents !== false) {
    ui.muted('  - .claude/agents/*.md');
  }
  if (config.setupSkills !== false) {
    ui.muted('  - .claude/skills/*/SKILL.md');
  }
  if (config.setupHooks !== false) {
    ui.muted('  - .claude/hooks/hooks.json');
  }
  if (config.setupRalph !== false) {
    if (analysis) {
      ui.muted('  - PROJECT_SPEC.md');
    }
    ui.muted('  - scripts/ralph/ralph.sh');
    ui.muted('  - scripts/ralph/CLAUDE.md');
    ui.muted('  - .claude/skills/prd/SKILL.md');
    ui.muted('  - .claude/skills/ralph/SKILL.md');
    if (config.createInitialPrd) {
      ui.muted('  - prd.json');
      ui.muted('  - progress.txt');
      ui.muted('  - tasks/prd-*.md');
    }
  }
  if (config.includeGitHub || config.includeDatabase) {
    ui.muted('  - .mcp.json');
  }
}

/**
 * Phase 7: Display next steps guidance
 *
 * @param {object} config - Project configuration
 * @param {object} analysis - Project analysis (may be null)
 */
export function displayNextSteps(config, analysis) {
  ui.subheader('Next steps', 'docs');

  // If PRD was created, show RALPH-first workflow
  if (config.createInitialPrd && config.initialFeature) {
    console.log(ui.colors.success('\n  \ud83d\ude80 RALPH is ready to build your feature!\n'));
    ui.muted(`  Feature: "${config.initialFeature}"`);
    const storyType = analysis ? 'intelligent' : 'basic';
    ui.muted(`  PRD created with ${storyType} user stories based on project analysis`);
    if (analysis) {
      ui.muted('  PROJECT_SPEC.md generated with comprehensive project documentation');
    }
    ui.blank();
    ui.muted('  To start autonomous development:');
    console.log(ui.colors.primary('    ./scripts/ralph/ralph.sh 20'));
    ui.blank();
    ui.muted('  Or review/customize first:');
    if (analysis) {
      ui.muted('    1. Review PROJECT_SPEC.md (project analysis)');
      ui.muted('    2. Edit prd.json to adjust user stories');
      ui.muted('    3. Edit progress.txt to add known patterns');
      ui.muted('    4. Run ./scripts/ralph/ralph.sh 20');
    } else {
      ui.muted('    1. Edit prd.json to adjust user stories');
      ui.muted('    2. Edit progress.txt to add known patterns');
      ui.muted('    3. Run ./scripts/ralph/ralph.sh 20');
    }
  } else {
    ui.muted('  1. Review and customize CLAUDE.md for your project');
    ui.muted('  2. Add project-specific rules in .claude/rules/');
    ui.muted('  3. Customize commands in .claude/commands/');
    ui.muted('  4. Run "claude" in your project directory to start');
    if (config.setupRalph !== false) {
      ui.blank();
      ui.muted('  RALPH Autonomous Agent:');
      ui.muted('    - Create a PRD: /prd Create a PRD for [feature]');
      ui.muted('    - Convert to JSON: /ralph-convert tasks/prd-[name].md');
      ui.muted('    - Run RALPH: ./scripts/ralph/ralph.sh 20');
    }
  }
  ui.blank();
}

export default {
  validateSetupEnvironment,
  checkKnowledgeBaseUpdates,
  runProjectAnalysis,
  generateProjectSpec,
  finalizeSetup,
  displaySetupSummary,
  displayNextSteps
};
