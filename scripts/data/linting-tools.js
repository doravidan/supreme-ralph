/**
 * Linting Tools Registry
 *
 * Detection patterns for code linting and formatting tools.
 * Used by project-analyzer.js to identify linting setup.
 *
 * @module data/linting-tools
 */

export const LINTING_TOOLS = {
  // ===========================================
  // JavaScript/TypeScript Linters
  // ===========================================
  eslint: {
    name: 'ESLint',
    packages: ['eslint'],
    configFiles: [
      '.eslintrc',
      '.eslintrc.js',
      '.eslintrc.cjs',
      '.eslintrc.json',
      '.eslintrc.yml',
      '.eslintrc.yaml',
      'eslint.config.js',
      'eslint.config.mjs',
      'eslint.config.cjs'
    ],
    runCommand: 'npx eslint .',
    fixCommand: 'npx eslint . --fix',
    language: 'javascript'
  },

  biome: {
    name: 'Biome',
    packages: ['@biomejs/biome', 'biome'],
    configFiles: [
      'biome.json',
      'biome.jsonc'
    ],
    runCommand: 'npx biome check .',
    fixCommand: 'npx biome check . --apply',
    language: 'javascript'
  },

  // ===========================================
  // Formatters
  // ===========================================
  prettier: {
    name: 'Prettier',
    packages: ['prettier'],
    configFiles: [
      '.prettierrc',
      '.prettierrc.js',
      '.prettierrc.cjs',
      '.prettierrc.json',
      '.prettierrc.yml',
      '.prettierrc.yaml',
      '.prettierrc.toml',
      'prettier.config.js',
      'prettier.config.cjs'
    ],
    runCommand: 'npx prettier --check .',
    fixCommand: 'npx prettier --write .',
    isFormatter: true
  },

  dprint: {
    name: 'dprint',
    packages: ['dprint'],
    configFiles: ['dprint.json', '.dprint.json'],
    runCommand: 'npx dprint check',
    fixCommand: 'npx dprint fmt',
    isFormatter: true
  },

  // ===========================================
  // CSS/Style Linters
  // ===========================================
  stylelint: {
    name: 'Stylelint',
    packages: ['stylelint'],
    configFiles: [
      '.stylelintrc',
      '.stylelintrc.js',
      '.stylelintrc.json',
      '.stylelintrc.yml',
      'stylelint.config.js',
      'stylelint.config.cjs'
    ],
    runCommand: 'npx stylelint "**/*.css"',
    fixCommand: 'npx stylelint "**/*.css" --fix',
    language: 'css'
  },

  // ===========================================
  // Commit & Git Hooks
  // ===========================================
  commitlint: {
    name: 'commitlint',
    packages: ['@commitlint/cli', '@commitlint/config-conventional'],
    configFiles: [
      'commitlint.config.js',
      'commitlint.config.cjs',
      '.commitlintrc',
      '.commitlintrc.json',
      '.commitlintrc.yml'
    ],
    runCommand: 'npx commitlint --from HEAD~1',
    isGitHook: true
  },

  husky: {
    name: 'Husky',
    packages: ['husky'],
    configFiles: ['.husky'],
    isGitHook: true
  },

  'lint-staged': {
    name: 'lint-staged',
    packages: ['lint-staged'],
    configFiles: [
      '.lintstagedrc',
      '.lintstagedrc.js',
      '.lintstagedrc.json',
      '.lintstagedrc.yml',
      'lint-staged.config.js'
    ],
    isGitHook: true
  },

  // ===========================================
  // Python Linters
  // ===========================================
  ruff: {
    name: 'Ruff',
    packages: ['ruff'],
    configFiles: ['ruff.toml', '.ruff.toml', 'pyproject.toml'],
    runCommand: 'ruff check .',
    fixCommand: 'ruff check . --fix',
    language: 'python'
  },

  flake8: {
    name: 'Flake8',
    packages: ['flake8'],
    configFiles: ['.flake8', 'setup.cfg', 'tox.ini'],
    runCommand: 'flake8 .',
    language: 'python'
  },

  pylint: {
    name: 'Pylint',
    packages: ['pylint'],
    configFiles: ['.pylintrc', 'pylintrc', 'pyproject.toml'],
    runCommand: 'pylint .',
    language: 'python'
  },

  black: {
    name: 'Black',
    packages: ['black'],
    configFiles: ['pyproject.toml'],
    runCommand: 'black --check .',
    fixCommand: 'black .',
    language: 'python',
    isFormatter: true
  },

  mypy: {
    name: 'mypy',
    packages: ['mypy'],
    configFiles: ['mypy.ini', '.mypy.ini', 'pyproject.toml'],
    runCommand: 'mypy .',
    language: 'python',
    isTypeChecker: true
  },

  // ===========================================
  // Go Linters
  // ===========================================
  golangci: {
    name: 'golangci-lint',
    packages: [],
    configFiles: ['.golangci.yml', '.golangci.yaml', '.golangci.toml'],
    runCommand: 'golangci-lint run',
    language: 'go'
  },

  // ===========================================
  // Rust Linters
  // ===========================================
  clippy: {
    name: 'Clippy',
    packages: [],
    configFiles: ['clippy.toml', '.clippy.toml'],
    runCommand: 'cargo clippy',
    language: 'rust'
  },

  rustfmt: {
    name: 'rustfmt',
    packages: [],
    configFiles: ['rustfmt.toml', '.rustfmt.toml'],
    runCommand: 'cargo fmt --check',
    fixCommand: 'cargo fmt',
    language: 'rust',
    isFormatter: true
  }
};

/**
 * Detect linting tools from package list and files
 * @param {string[]} packages - List of installed packages
 * @param {string[]} files - List of files in project root
 * @returns {object[]} Array of detected tools
 */
export function detectLintingTools(packages, files) {
  const detected = [];

  for (const [key, tool] of Object.entries(LINTING_TOOLS)) {
    // Check for packages
    const hasPackage = tool.packages.some(pkg => packages.includes(pkg));

    // Check for config files
    const hasConfig = tool.configFiles.some(file =>
      files.includes(file) || files.some(f => f.startsWith(file))
    );

    if (hasPackage || hasConfig) {
      detected.push({ key, ...tool });
    }
  }

  return detected;
}

/**
 * Get the primary linter for a language
 * @param {string} language - Programming language
 * @returns {object|null} Primary linter config or null
 */
export function getPrimaryLinter(language) {
  const primaryMap = {
    javascript: 'eslint',
    typescript: 'eslint',
    python: 'ruff',
    go: 'golangci',
    rust: 'clippy'
  };

  const key = primaryMap[language];
  return key ? { key, ...LINTING_TOOLS[key] } : null;
}

/**
 * Get the primary formatter for a language
 * @param {string} language - Programming language
 * @returns {object|null} Primary formatter config or null
 */
export function getPrimaryFormatter(language) {
  const formatterMap = {
    javascript: 'prettier',
    typescript: 'prettier',
    python: 'black',
    rust: 'rustfmt'
  };

  const key = formatterMap[language];
  return key ? { key, ...LINTING_TOOLS[key] } : null;
}

export default LINTING_TOOLS;
