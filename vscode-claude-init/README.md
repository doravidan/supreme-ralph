# Claude Code Project Initializer - VS Code Extension

A VS Code extension that provides a graphical UI for initializing projects with Claude Code best practices and configuration.

## Features

### 🎯 Sidebar Panel
Access all features from the Claude Code activity bar icon:
- **Project Status** - View current configuration state
- **Templates** - Browse available templates
- **Quick Actions** - One-click access to common operations

### 🚀 Command Palette
All commands available via `Ctrl+Shift+P` / `Cmd+Shift+P`:
- `Claude Code: Setup Project` - Interactive setup wizard
- `Claude Code: Quick Setup` - Use default configuration
- `Claude Code: Sync Knowledge Base` - Fetch latest docs from Anthropic
- `Claude Code: Check for Updates` - Check for knowledge base updates
- `Claude Code: Validate Templates` - Verify template syntax
- `Claude Code: View Changelog` - See recent changes

### 🧙 Setup Wizard
Interactive webview form for configuring:
- Project name and description
- Language and framework
- Build, test, and lint commands
- Features to enable (rules, commands, agents, hooks)

### 📊 Status Bar
Quick access to Claude Code setup from the status bar.

## Installation

### From Source
1. Clone the repository
2. Navigate to `vscode-claude-init/`
3. Run `npm install`
4. Run `npm run build`
5. Press `F5` to launch Extension Development Host

### From VSIX
1. Download the `.vsix` file
2. In VS Code: Extensions → ... → Install from VSIX

## Usage

1. Open a project folder in VS Code
2. Click the Claude Code icon in the activity bar, or
3. Open command palette and run `Claude Code: Setup Project`
4. Follow the wizard to configure your project

## Configuration

Extension settings available in VS Code Settings:

| Setting | Default | Description |
|---------|---------|-------------|
| `claudeInit.scriptsPath` | `""` | Path to claude-init scripts (empty = bundled) |
| `claudeInit.autoSync` | `false` | Auto-sync knowledge base on activation |
| `claudeInit.showStatusBar` | `true` | Show status bar item |

## Development

```bash
# Install dependencies
npm install

# Build extension
npm run build

# Watch for changes
npm run watch

# Run linter
npm run lint
```

### Project Structure

```
vscode-claude-init/
├── src/
│   ├── extension.ts           # Entry point
│   ├── commands/              # Command implementations
│   ├── views/                 # Tree view providers
│   ├── panels/                # Webview panels
│   └── utils/                 # Utilities
├── media/                     # Webview assets
├── resources/                 # Icons
└── package.json               # Extension manifest
```

## License

MIT
