/**
 * Test Frameworks Registry
 *
 * Detection patterns for common test frameworks.
 * Used by project-analyzer.js to identify testing setup.
 *
 * To add a new test framework:
 * 1. Add an entry with packages, configFiles, and locations
 * 2. packages: npm packages that indicate this framework
 * 3. configFiles: configuration files to look for
 * 4. locations: common test directories
 *
 * @module data/test-frameworks
 */

export const TEST_FRAMEWORKS = {
  jest: {
    name: 'Jest',
    packages: ['jest', '@jest/core'],
    configFiles: [
      'jest.config.js',
      'jest.config.ts',
      'jest.config.mjs',
      'jest.config.cjs',
      'jest.config.json'
    ],
    locations: ['__tests__', 'tests', 'test', 'spec'],
    testPatterns: ['*.test.js', '*.test.ts', '*.spec.js', '*.spec.ts'],
    runCommand: 'npx jest'
  },

  vitest: {
    name: 'Vitest',
    packages: ['vitest'],
    configFiles: [
      'vitest.config.js',
      'vitest.config.ts',
      'vitest.config.mts'
    ],
    locations: ['__tests__', 'tests', 'test', 'src'],
    testPatterns: ['*.test.ts', '*.test.js', '*.spec.ts', '*.spec.js'],
    runCommand: 'npx vitest'
  },

  mocha: {
    name: 'Mocha',
    packages: ['mocha'],
    configFiles: [
      '.mocharc.js',
      '.mocharc.json',
      '.mocharc.yml',
      '.mocharc.yaml',
      'mocha.opts'
    ],
    locations: ['test', 'tests', 'spec'],
    testPatterns: ['*.test.js', '*.spec.js'],
    runCommand: 'npx mocha'
  },

  ava: {
    name: 'AVA',
    packages: ['ava'],
    configFiles: [
      'ava.config.js',
      'ava.config.cjs',
      'ava.config.mjs'
    ],
    locations: ['test', 'tests', '__tests__'],
    testPatterns: ['*.test.js', '*.test.ts'],
    runCommand: 'npx ava'
  },

  tap: {
    name: 'Tap',
    packages: ['tap'],
    configFiles: ['.taprc', '.taprc.yml'],
    locations: ['test', 'tests'],
    testPatterns: ['*.test.js', '*.tap.js'],
    runCommand: 'npx tap'
  },

  uvu: {
    name: 'uvu',
    packages: ['uvu'],
    configFiles: [],
    locations: ['test', 'tests'],
    testPatterns: ['*.test.js', '*.test.ts'],
    runCommand: 'npx uvu tests'
  },

  playwright: {
    name: 'Playwright',
    packages: ['@playwright/test', 'playwright'],
    configFiles: [
      'playwright.config.js',
      'playwright.config.ts'
    ],
    locations: ['e2e', 'tests', 'test', 'playwright'],
    testPatterns: ['*.spec.ts', '*.spec.js', '*.test.ts'],
    runCommand: 'npx playwright test',
    isE2E: true
  },

  cypress: {
    name: 'Cypress',
    packages: ['cypress'],
    configFiles: [
      'cypress.config.js',
      'cypress.config.ts',
      'cypress.json'
    ],
    locations: ['cypress', 'e2e', 'cypress/e2e'],
    testPatterns: ['*.cy.js', '*.cy.ts', '*.spec.js'],
    runCommand: 'npx cypress run',
    isE2E: true
  },

  testcafe: {
    name: 'TestCafe',
    packages: ['testcafe'],
    configFiles: ['.testcaferc.json', '.testcaferc.js'],
    locations: ['tests', 'test', 'e2e'],
    testPatterns: ['*.test.js', '*.test.ts'],
    runCommand: 'npx testcafe',
    isE2E: true
  },

  // Python test frameworks
  pytest: {
    name: 'pytest',
    packages: ['pytest'],
    configFiles: ['pytest.ini', 'pyproject.toml', 'setup.cfg'],
    locations: ['tests', 'test'],
    testPatterns: ['test_*.py', '*_test.py'],
    runCommand: 'pytest',
    language: 'python'
  },

  unittest: {
    name: 'unittest',
    packages: [],
    configFiles: [],
    locations: ['tests', 'test'],
    testPatterns: ['test_*.py'],
    runCommand: 'python -m unittest discover',
    language: 'python'
  },

  // Go test framework
  gotest: {
    name: 'Go Test',
    packages: [],
    configFiles: [],
    locations: ['.'],
    testPatterns: ['*_test.go'],
    runCommand: 'go test ./...',
    language: 'go'
  },

  // Rust test framework
  cargotest: {
    name: 'Cargo Test',
    packages: [],
    configFiles: ['Cargo.toml'],
    locations: ['tests', 'src'],
    testPatterns: ['*.rs'],
    runCommand: 'cargo test',
    language: 'rust'
  }
};

/**
 * Detect test framework from package list and files
 * @param {string[]} packages - List of installed packages
 * @param {string[]} files - List of files in project root
 * @returns {object|null} Detected framework info or null
 */
export function detectTestFramework(packages, files) {
  for (const [key, framework] of Object.entries(TEST_FRAMEWORKS)) {
    // Check for packages
    const hasPackage = framework.packages.some(pkg => packages.includes(pkg));
    if (hasPackage) {
      return { key, ...framework };
    }

    // Check for config files
    const hasConfig = framework.configFiles.some(file => files.includes(file));
    if (hasConfig) {
      return { key, ...framework };
    }
  }

  return null;
}

/**
 * Get all test frameworks for a given language
 * @param {string} language - Language (javascript, python, go, rust)
 * @returns {object[]} Array of framework configs
 */
export function getFrameworksForLanguage(language) {
  const langMap = {
    javascript: ['jest', 'vitest', 'mocha', 'ava', 'tap', 'uvu', 'playwright', 'cypress'],
    typescript: ['jest', 'vitest', 'mocha', 'playwright', 'cypress'],
    python: ['pytest', 'unittest'],
    go: ['gotest'],
    rust: ['cargotest']
  };

  const keys = langMap[language] || [];
  return keys.map(key => ({ key, ...TEST_FRAMEWORKS[key] }));
}

export default TEST_FRAMEWORKS;
