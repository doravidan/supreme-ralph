/**
 * Security Analyzer
 *
 * Analyzes project to generate allowed commands based on detected stack.
 * Creates .ralph/security.json with command allowlist.
 *
 * @module security-analyzer
 */

import fs from 'fs-extra';
import path from 'path';

// Security configuration path
const SECURITY_FILE = '.ralph/security.json';

// Stack-specific command allowlists
const STACK_COMMANDS = {
  node: {
    name: 'Node.js',
    detection: ['package.json'],
    commands: [
      'node',
      'npm',
      'npx',
      'yarn',
      'pnpm',
      'nvm'
    ],
    scripts: [
      'npm run',
      'npm test',
      'npm start',
      'npm run build',
      'npm run lint',
      'npm run typecheck',
      'yarn run',
      'pnpm run'
    ]
  },

  typescript: {
    name: 'TypeScript',
    detection: ['tsconfig.json', 'tsconfig.*.json'],
    commands: [
      'tsc',
      'ts-node',
      'tsx'
    ],
    scripts: []
  },

  python: {
    name: 'Python',
    detection: ['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile'],
    commands: [
      'python',
      'python3',
      'pip',
      'pip3',
      'pipenv',
      'poetry',
      'pytest',
      'black',
      'flake8',
      'mypy',
      'ruff'
    ],
    scripts: []
  },

  go: {
    name: 'Go',
    detection: ['go.mod', 'go.sum'],
    commands: [
      'go',
      'go build',
      'go test',
      'go run',
      'go mod',
      'golangci-lint'
    ],
    scripts: []
  },

  rust: {
    name: 'Rust',
    detection: ['Cargo.toml', 'Cargo.lock'],
    commands: [
      'cargo',
      'cargo build',
      'cargo test',
      'cargo run',
      'cargo check',
      'rustc',
      'rustfmt',
      'clippy'
    ],
    scripts: []
  },

  java: {
    name: 'Java',
    detection: ['pom.xml', 'build.gradle', 'build.gradle.kts'],
    commands: [
      'java',
      'javac',
      'mvn',
      'gradle',
      './gradlew',
      './mvnw'
    ],
    scripts: []
  },

  docker: {
    name: 'Docker',
    detection: ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml'],
    commands: [
      'docker',
      'docker-compose',
      'docker build',
      'docker run',
      'docker-compose up',
      'docker-compose down'
    ],
    scripts: []
  },

  git: {
    name: 'Git',
    detection: ['.git'],
    commands: [
      'git',
      'git status',
      'git add',
      'git commit',
      'git push',
      'git pull',
      'git checkout',
      'git branch',
      'git merge',
      'git log',
      'git diff',
      'git worktree'
    ],
    scripts: []
  }
};

// Test framework commands
const TEST_COMMANDS = {
  vitest: ['vitest', 'vitest run', 'vitest watch'],
  jest: ['jest', 'jest --watch'],
  mocha: ['mocha'],
  ava: ['ava'],
  tap: ['tap'],
  pytest: ['pytest', 'pytest -v'],
  gotest: ['go test'],
  cargo_test: ['cargo test'],
  junit: ['mvn test', 'gradle test']
};

// Linting commands
const LINT_COMMANDS = {
  eslint: ['eslint', 'eslint --fix'],
  prettier: ['prettier', 'prettier --write'],
  biome: ['biome', 'biome check', 'biome format'],
  ruff: ['ruff', 'ruff check', 'ruff format'],
  golangci: ['golangci-lint', 'golangci-lint run'],
  clippy: ['cargo clippy']
};

// Dangerous commands that should NEVER be allowed
const BLOCKED_COMMANDS = [
  'rm -rf /',
  'rm -rf /*',
  'rm -rf ~',
  'rm -rf $HOME',
  'sudo rm',
  ':(){:|:&};:',  // Fork bomb
  'mkfs',
  'dd if=/dev/zero',
  'chmod -R 777 /',
  'curl | sh',
  'wget | sh',
  'eval',
  '> /dev/sda',
  'shutdown',
  'reboot',
  'halt',
  'poweroff'
];

/**
 * Detect project stack from files
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Array>} Detected stacks
 */
async function detectStack(projectRoot = process.cwd()) {
  const detected = [];

  for (const [stackId, stack] of Object.entries(STACK_COMMANDS)) {
    for (const file of stack.detection) {
      const filePath = path.join(projectRoot, file);

      // Handle glob patterns
      if (file.includes('*')) {
        const pattern = file.replace('*', '');
        const files = await fs.readdir(projectRoot).catch(() => []);
        if (files.some(f => f.includes(pattern.replace('.', '')))) {
          detected.push(stackId);
          break;
        }
      } else if (await fs.pathExists(filePath)) {
        detected.push(stackId);
        break;
      }
    }
  }

  // Always include git if .git exists
  if (!detected.includes('git') && await fs.pathExists(path.join(projectRoot, '.git'))) {
    detected.push('git');
  }

  return detected;
}

/**
 * Detect test framework from package.json or config files
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<string|null>} Detected test framework
 */
async function detectTestFramework(projectRoot = process.cwd()) {
  const packagePath = path.join(projectRoot, 'package.json');

  if (await fs.pathExists(packagePath)) {
    const pkg = await fs.readJson(packagePath);
    const deps = {
      ...pkg.dependencies,
      ...pkg.devDependencies
    };

    if (deps.vitest) return 'vitest';
    if (deps.jest) return 'jest';
    if (deps.mocha) return 'mocha';
    if (deps.ava) return 'ava';
    if (deps.tap) return 'tap';
  }

  // Check for Python
  if (await fs.pathExists(path.join(projectRoot, 'pytest.ini')) ||
      await fs.pathExists(path.join(projectRoot, 'pyproject.toml'))) {
    return 'pytest';
  }

  return null;
}

/**
 * Detect lint tools from package.json or config files
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Array>} Detected lint tools
 */
async function detectLintTools(projectRoot = process.cwd()) {
  const detected = [];
  const packagePath = path.join(projectRoot, 'package.json');

  if (await fs.pathExists(packagePath)) {
    const pkg = await fs.readJson(packagePath);
    const deps = {
      ...pkg.dependencies,
      ...pkg.devDependencies
    };

    if (deps.eslint) detected.push('eslint');
    if (deps.prettier) detected.push('prettier');
    if (deps['@biomejs/biome'] || deps.biome) detected.push('biome');
  }

  // Check for Python linters
  if (await fs.pathExists(path.join(projectRoot, 'ruff.toml')) ||
      await fs.pathExists(path.join(projectRoot, '.ruff.toml'))) {
    detected.push('ruff');
  }

  return detected;
}

/**
 * Generate security configuration
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object>} Security configuration
 */
async function generateSecurityConfig(projectRoot = process.cwd()) {
  const stacks = await detectStack(projectRoot);
  const testFramework = await detectTestFramework(projectRoot);
  const lintTools = await detectLintTools(projectRoot);

  // Build allowed commands list
  const allowedCommands = new Set();

  // Add stack-specific commands
  for (const stackId of stacks) {
    const stack = STACK_COMMANDS[stackId];
    if (stack) {
      stack.commands.forEach(cmd => allowedCommands.add(cmd));
      stack.scripts.forEach(cmd => allowedCommands.add(cmd));
    }
  }

  // Add test framework commands
  if (testFramework && TEST_COMMANDS[testFramework]) {
    TEST_COMMANDS[testFramework].forEach(cmd => allowedCommands.add(cmd));
  }

  // Add lint tool commands
  for (const tool of lintTools) {
    if (LINT_COMMANDS[tool]) {
      LINT_COMMANDS[tool].forEach(cmd => allowedCommands.add(cmd));
    }
  }

  // Add common safe commands
  const safeCommands = [
    'ls', 'pwd', 'cat', 'head', 'tail', 'wc',
    'echo', 'mkdir', 'touch', 'cp', 'mv',
    'find', 'grep', 'sed', 'awk',
    'curl', 'wget'  // For downloading deps
  ];
  safeCommands.forEach(cmd => allowedCommands.add(cmd));

  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    detectedStacks: stacks.map(s => STACK_COMMANDS[s]?.name || s),
    testFramework,
    lintTools,
    allowedCommands: [...allowedCommands].sort(),
    blockedPatterns: BLOCKED_COMMANDS,
    customAllowed: [],  // User can add more here
    customBlocked: []   // User can block more here
  };
}

/**
 * Write security configuration to file
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object>} Written configuration
 */
async function writeSecurityConfig(projectRoot = process.cwd()) {
  const config = await generateSecurityConfig(projectRoot);

  const securityPath = path.join(projectRoot, SECURITY_FILE);
  await fs.ensureDir(path.dirname(securityPath));
  await fs.writeJson(securityPath, config, { spaces: 2 });

  return config;
}

/**
 * Load security configuration
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object|null>} Security configuration or null
 */
async function loadSecurityConfig(projectRoot = process.cwd()) {
  const securityPath = path.join(projectRoot, SECURITY_FILE);

  if (await fs.pathExists(securityPath)) {
    return await fs.readJson(securityPath);
  }

  return null;
}

/**
 * Validate a command against security rules
 * @param {string} command - Command to validate
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<{allowed: boolean, reason: string}>}
 */
async function validateCommand(command, projectRoot = process.cwd()) {
  // Load or generate security config
  let config = await loadSecurityConfig(projectRoot);
  if (!config) {
    config = await generateSecurityConfig(projectRoot);
  }

  // Check against blocked patterns
  for (const blocked of [...config.blockedPatterns, ...config.customBlocked]) {
    if (command.includes(blocked)) {
      return {
        allowed: false,
        reason: `Command matches blocked pattern: ${blocked}`
      };
    }
  }

  // Extract base command
  const baseCommand = command.split(' ')[0];

  // Check if base command is allowed
  const allAllowed = [...config.allowedCommands, ...config.customAllowed];

  // Check for exact match or prefix match
  const isAllowed = allAllowed.some(allowed => {
    if (baseCommand === allowed) return true;
    if (command.startsWith(allowed)) return true;
    return false;
  });

  if (isAllowed) {
    return { allowed: true, reason: 'Command in allowlist' };
  }

  return {
    allowed: false,
    reason: `Command "${baseCommand}" not in allowlist for detected stack`
  };
}

/**
 * Add custom allowed command
 * @param {string} command - Command to allow
 * @param {string} projectRoot - Project root directory
 */
async function addAllowedCommand(command, projectRoot = process.cwd()) {
  let config = await loadSecurityConfig(projectRoot);

  if (!config) {
    config = await generateSecurityConfig(projectRoot);
  }

  if (!config.customAllowed.includes(command)) {
    config.customAllowed.push(command);
    await fs.writeJson(
      path.join(projectRoot, SECURITY_FILE),
      config,
      { spaces: 2 }
    );
  }
}

/**
 * Add custom blocked pattern
 * @param {string} pattern - Pattern to block
 * @param {string} projectRoot - Project root directory
 */
async function addBlockedPattern(pattern, projectRoot = process.cwd()) {
  let config = await loadSecurityConfig(projectRoot);

  if (!config) {
    config = await generateSecurityConfig(projectRoot);
  }

  if (!config.customBlocked.includes(pattern)) {
    config.customBlocked.push(pattern);
    await fs.writeJson(
      path.join(projectRoot, SECURITY_FILE),
      config,
      { spaces: 2 }
    );
  }
}

/**
 * Format security config for display
 * @param {Object} config - Security configuration
 * @returns {string} Formatted output
 */
function formatSecurityConfig(config) {
  return `
╔════════════════════════════════════════════════════════════════╗
║                 Security Configuration                          ║
╚════════════════════════════════════════════════════════════════╝

Detected Stacks: ${config.detectedStacks.join(', ') || 'None'}
Test Framework: ${config.testFramework || 'None detected'}
Lint Tools: ${config.lintTools.join(', ') || 'None detected'}

Allowed Commands (${config.allowedCommands.length}):
${config.allowedCommands.slice(0, 20).map(c => `  - ${c}`).join('\n')}
${config.allowedCommands.length > 20 ? `  ... and ${config.allowedCommands.length - 20} more` : ''}

Custom Allowed: ${config.customAllowed.length > 0 ? config.customAllowed.join(', ') : 'None'}
Custom Blocked: ${config.customBlocked.length > 0 ? config.customBlocked.join(', ') : 'None'}

Generated: ${config.generatedAt}
`;
}

export {
  STACK_COMMANDS,
  TEST_COMMANDS,
  LINT_COMMANDS,
  BLOCKED_COMMANDS,
  detectStack,
  detectTestFramework,
  detectLintTools,
  generateSecurityConfig,
  writeSecurityConfig,
  loadSecurityConfig,
  validateCommand,
  addAllowedCommand,
  addBlockedPattern,
  formatSecurityConfig,
  SECURITY_FILE
};
