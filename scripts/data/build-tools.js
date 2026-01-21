/**
 * Build Tools Registry
 *
 * Detection patterns for build tools and bundlers.
 * Used by project-analyzer.js to identify build setup.
 *
 * @module data/build-tools
 */

export const BUILD_TOOLS = {
  // ===========================================
  // JavaScript Bundlers
  // ===========================================
  vite: {
    name: 'Vite',
    packages: ['vite'],
    configFiles: [
      'vite.config.js',
      'vite.config.ts',
      'vite.config.mjs',
      'vite.config.mts'
    ],
    buildCommand: 'npx vite build',
    devCommand: 'npx vite',
    language: 'javascript'
  },

  webpack: {
    name: 'Webpack',
    packages: ['webpack', 'webpack-cli'],
    configFiles: [
      'webpack.config.js',
      'webpack.config.ts',
      'webpack.config.cjs',
      'webpack.config.mjs'
    ],
    buildCommand: 'npx webpack',
    devCommand: 'npx webpack serve',
    language: 'javascript'
  },

  esbuild: {
    name: 'esbuild',
    packages: ['esbuild'],
    configFiles: ['esbuild.config.js', 'esbuild.config.mjs'],
    buildCommand: 'npx esbuild',
    language: 'javascript'
  },

  rollup: {
    name: 'Rollup',
    packages: ['rollup'],
    configFiles: [
      'rollup.config.js',
      'rollup.config.ts',
      'rollup.config.mjs'
    ],
    buildCommand: 'npx rollup -c',
    language: 'javascript'
  },

  parcel: {
    name: 'Parcel',
    packages: ['parcel', 'parcel-bundler'],
    configFiles: ['.parcelrc'],
    buildCommand: 'npx parcel build',
    devCommand: 'npx parcel',
    language: 'javascript'
  },

  turbopack: {
    name: 'Turbopack',
    packages: ['turbopack'],
    configFiles: [],
    language: 'javascript'
  },

  // ===========================================
  // TypeScript Compilers
  // ===========================================
  typescript: {
    name: 'TypeScript',
    packages: ['typescript'],
    configFiles: [
      'tsconfig.json',
      'tsconfig.build.json'
    ],
    buildCommand: 'npx tsc',
    typecheckCommand: 'npx tsc --noEmit',
    language: 'typescript'
  },

  swc: {
    name: 'SWC',
    packages: ['@swc/core', '@swc/cli'],
    configFiles: ['.swcrc', 'swc.config.js'],
    buildCommand: 'npx swc src -d dist',
    language: 'javascript'
  },

  // ===========================================
  // Framework Build Tools
  // ===========================================
  next: {
    name: 'Next.js',
    packages: ['next'],
    configFiles: ['next.config.js', 'next.config.mjs', 'next.config.ts'],
    buildCommand: 'npx next build',
    devCommand: 'npx next dev',
    language: 'javascript',
    isFramework: true
  },

  nuxt: {
    name: 'Nuxt',
    packages: ['nuxt'],
    configFiles: ['nuxt.config.js', 'nuxt.config.ts'],
    buildCommand: 'npx nuxt build',
    devCommand: 'npx nuxt dev',
    language: 'javascript',
    isFramework: true
  },

  astro: {
    name: 'Astro',
    packages: ['astro'],
    configFiles: ['astro.config.js', 'astro.config.mjs', 'astro.config.ts'],
    buildCommand: 'npx astro build',
    devCommand: 'npx astro dev',
    language: 'javascript',
    isFramework: true
  },

  remix: {
    name: 'Remix',
    packages: ['@remix-run/node', '@remix-run/react'],
    configFiles: ['remix.config.js'],
    buildCommand: 'npx remix build',
    devCommand: 'npx remix dev',
    language: 'javascript',
    isFramework: true
  },

  sveltekit: {
    name: 'SvelteKit',
    packages: ['@sveltejs/kit'],
    configFiles: ['svelte.config.js'],
    buildCommand: 'npx vite build',
    devCommand: 'npx vite dev',
    language: 'javascript',
    isFramework: true
  },

  // ===========================================
  // Task Runners
  // ===========================================
  turborepo: {
    name: 'Turborepo',
    packages: ['turbo'],
    configFiles: ['turbo.json'],
    buildCommand: 'npx turbo build',
    language: 'javascript',
    isMonorepo: true
  },

  nx: {
    name: 'Nx',
    packages: ['nx', '@nrwl/workspace'],
    configFiles: ['nx.json', 'workspace.json'],
    buildCommand: 'npx nx build',
    language: 'javascript',
    isMonorepo: true
  },

  lerna: {
    name: 'Lerna',
    packages: ['lerna'],
    configFiles: ['lerna.json'],
    buildCommand: 'npx lerna run build',
    language: 'javascript',
    isMonorepo: true
  },

  // ===========================================
  // Python Build Tools
  // ===========================================
  setuptools: {
    name: 'Setuptools',
    packages: ['setuptools'],
    configFiles: ['setup.py', 'setup.cfg'],
    buildCommand: 'python setup.py build',
    language: 'python'
  },

  poetry: {
    name: 'Poetry',
    packages: ['poetry'],
    configFiles: ['pyproject.toml'],
    buildCommand: 'poetry build',
    language: 'python'
  },

  pip: {
    name: 'pip',
    packages: ['pip'],
    configFiles: ['requirements.txt', 'requirements-dev.txt'],
    installCommand: 'pip install -r requirements.txt',
    language: 'python'
  },

  // ===========================================
  // Go Build Tools
  // ===========================================
  go: {
    name: 'Go',
    packages: [],
    configFiles: ['go.mod', 'go.sum'],
    buildCommand: 'go build',
    language: 'go'
  },

  // ===========================================
  // Rust Build Tools
  // ===========================================
  cargo: {
    name: 'Cargo',
    packages: [],
    configFiles: ['Cargo.toml', 'Cargo.lock'],
    buildCommand: 'cargo build',
    language: 'rust'
  },

  // ===========================================
  // General Build Tools
  // ===========================================
  make: {
    name: 'Make',
    packages: [],
    configFiles: ['Makefile', 'makefile', 'GNUmakefile'],
    buildCommand: 'make'
  },

  cmake: {
    name: 'CMake',
    packages: [],
    configFiles: ['CMakeLists.txt'],
    buildCommand: 'cmake --build .'
  },

  bazel: {
    name: 'Bazel',
    packages: [],
    configFiles: ['BUILD', 'BUILD.bazel', 'WORKSPACE'],
    buildCommand: 'bazel build //...'
  }
};

/**
 * Detect build tools from package list and files
 * @param {string[]} packages - List of installed packages
 * @param {string[]} files - List of files in project root
 * @returns {object[]} Array of detected tools
 */
export function detectBuildTools(packages, files) {
  const detected = [];

  for (const [key, tool] of Object.entries(BUILD_TOOLS)) {
    // Check for packages
    const hasPackage = tool.packages.some(pkg => packages.includes(pkg));

    // Check for config files
    const hasConfig = tool.configFiles.some(file => files.includes(file));

    if (hasPackage || hasConfig) {
      detected.push({ key, ...tool });
    }
  }

  return detected;
}

/**
 * Get the primary build tool for a project
 * Prefers framework-specific tools over generic bundlers
 * @param {object[]} detected - Array of detected build tools
 * @returns {object|null} Primary build tool or null
 */
export function getPrimaryBuildTool(detected) {
  // Priority: Framework > TypeScript > Bundler
  const framework = detected.find(t => t.isFramework);
  if (framework) return framework;

  const typescript = detected.find(t => t.name === 'TypeScript');
  if (typescript) return typescript;

  return detected[0] || null;
}

/**
 * Get build and dev commands for a project
 * @param {object[]} detected - Array of detected build tools
 * @returns {object} Object with buildCommand and devCommand
 */
export function getBuildCommands(detected) {
  const primary = getPrimaryBuildTool(detected);

  return {
    buildCommand: primary?.buildCommand || 'npm run build',
    devCommand: primary?.devCommand || 'npm run dev',
    typecheckCommand: detected.find(t => t.typecheckCommand)?.typecheckCommand
  };
}

export default BUILD_TOOLS;
