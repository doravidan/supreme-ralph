// @ts-check

(function () {
  // @ts-ignore
  const vscode = acquireVsCodeApi();

  const form = document.getElementById('setupForm');
  const submitBtn = document.getElementById('submitBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const progressArea = document.getElementById('progressArea');
  const progressMessage = document.getElementById('progressMessage');

  // Language to command mappings
  const languageCommands = {
    typescript: { build: 'npm run build', test: 'npm test', lint: 'npm run lint' },
    javascript: { build: 'npm run build', test: 'npm test', lint: 'npm run lint' },
    python: { build: 'python -m build', test: 'pytest', lint: 'ruff check .' },
    go: { build: 'go build', test: 'go test ./...', lint: 'golangci-lint run' },
    rust: { build: 'cargo build', test: 'cargo test', lint: 'cargo clippy' },
    other: { build: '', test: '', lint: '' }
  };

  // Request defaults on load
  vscode.postMessage({ command: 'getDefaults' });

  // Handle language change to update command defaults
  const languageSelect = document.getElementById('language');
  if (languageSelect) {
    languageSelect.addEventListener('change', function () {
      const lang = this.value;
      const commands = languageCommands[lang] || languageCommands.other;

      const buildInput = document.getElementById('buildCommand');
      const testInput = document.getElementById('testCommand');
      const lintInput = document.getElementById('lintCommand');

      if (buildInput && !buildInput.value) {
        buildInput.value = commands.build;
      }
      if (testInput && !testInput.value) {
        testInput.value = commands.test;
      }
      if (lintInput && !lintInput.value) {
        lintInput.value = commands.lint;
      }
    });
  }

  // Form submission
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const formData = new FormData(form);
      const config = {};

      // Get all form values
      formData.forEach((value, key) => {
        config[key] = value;
      });

      // Handle checkboxes (they only appear in FormData if checked)
      const checkboxes = ['setupRules', 'setupCommands', 'setupAgents', 'setupHooks'];
      checkboxes.forEach(name => {
        const checkbox = document.getElementById(name);
        if (checkbox) {
          config[name] = checkbox.checked;
        }
      });

      // Disable form
      setFormEnabled(false);
      showProgress('running', 'Starting setup...');

      // Send to extension
      vscode.postMessage({
        command: 'submit',
        data: config
      });
    });
  }

  // Cancel button
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
      vscode.postMessage({ command: 'cancel' });
    });
  }

  // Handle messages from extension
  window.addEventListener('message', function (event) {
    const message = event.data;

    switch (message.command) {
      case 'setDefaults':
        setFormDefaults(message.data);
        break;

      case 'progress':
        showProgress(message.data.status, message.data.message);
        if (message.data.status === 'error') {
          setFormEnabled(true);
        }
        break;
    }
  });

  /**
   * Set form default values
   * @param {Record<string, any>} defaults
   */
  function setFormDefaults(defaults) {
    Object.entries(defaults).forEach(([key, value]) => {
      const element = document.getElementById(key);
      if (!element) return;

      if (element.type === 'checkbox') {
        element.checked = Boolean(value);
      } else {
        element.value = value || '';
      }
    });
  }

  /**
   * Enable/disable form elements
   * @param {boolean} enabled
   */
  function setFormEnabled(enabled) {
    const elements = form?.querySelectorAll('input, select, textarea, button');
    elements?.forEach(el => {
      el.disabled = !enabled;
    });
  }

  /**
   * Show progress indicator
   * @param {'running' | 'success' | 'error'} status
   * @param {string} message
   */
  function showProgress(status, message) {
    if (!progressArea || !progressMessage) return;

    progressArea.classList.remove('hidden', 'success', 'error');

    if (status === 'success') {
      progressArea.classList.add('success');
    } else if (status === 'error') {
      progressArea.classList.add('error');
    }

    progressMessage.textContent = message;
  }
})();
