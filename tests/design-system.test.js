/**
 * Tests for design-system.js
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('design-system', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    delete process.env.NO_COLOR;
    delete process.env.FORCE_COLOR;
    delete process.env.CLAUDE_INIT_THEME;
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  describe('theme detection', () => {
    it('should default to default theme', async () => {
      const { getTheme } = await import('../scripts/utils/design-system.js');
      expect(getTheme()).toBe('default');
    });

    it('should detect NO_COLOR environment variable', async () => {
      process.env.NO_COLOR = '1';
      const { getTheme } = await import('../scripts/utils/design-system.js');
      expect(getTheme()).toBe('no-color');
    });

    it('should respect CLAUDE_INIT_THEME', async () => {
      process.env.CLAUDE_INIT_THEME = 'dark';
      const { getTheme } = await import('../scripts/utils/design-system.js');
      expect(getTheme()).toBe('dark');
    });

    it('should fall back to default for invalid theme', async () => {
      process.env.CLAUDE_INIT_THEME = 'invalid-theme';
      // Suppress the warning
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { getTheme } = await import('../scripts/utils/design-system.js');
      expect(getTheme()).toBe('default');
      warn.mockRestore();
    });
  });

  describe('setTheme', () => {
    it('should change theme at runtime', async () => {
      const { getTheme, setTheme } = await import('../scripts/utils/design-system.js');
      expect(setTheme('dark')).toBe(true);
      expect(getTheme()).toBe('dark');
    });

    it('should return false for invalid theme', async () => {
      const { setTheme } = await import('../scripts/utils/design-system.js');
      expect(setTheme('nonexistent')).toBe(false);
    });
  });

  describe('getAvailableThemes', () => {
    it('should return all theme names', async () => {
      const { getAvailableThemes } = await import('../scripts/utils/design-system.js');
      const themes = getAvailableThemes();
      expect(themes).toContain('default');
      expect(themes).toContain('light');
      expect(themes).toContain('dark');
      expect(themes).toContain('no-color');
    });
  });

  describe('icons', () => {
    it('should have status icons', async () => {
      const { icons } = await import('../scripts/utils/design-system.js');
      expect(icons.success).toBeDefined();
      expect(icons.error).toBeDefined();
      expect(icons.warning).toBeDefined();
      expect(icons.info).toBeDefined();
    });

    it('should have change indicator icons', async () => {
      const { icons } = await import('../scripts/utils/design-system.js');
      expect(icons.add).toBeDefined();
      expect(icons.modify).toBeDefined();
      expect(icons.remove).toBeDefined();
    });

    it('should have file system icons', async () => {
      const { icons } = await import('../scripts/utils/design-system.js');
      expect(icons.file).toBeDefined();
      expect(icons.folder).toBeDefined();
    });

    it('should have arrow icons', async () => {
      const { icons } = await import('../scripts/utils/design-system.js');
      expect(icons.arrowRight).toBeDefined();
      expect(icons.arrowLeft).toBeDefined();
    });

    it('should have technical icons', async () => {
      const { icons } = await import('../scripts/utils/design-system.js');
      expect(icons.branch).toBeDefined();
      expect(icons.commit).toBeDefined();
      expect(icons.test).toBeDefined();
      expect(icons.build).toBeDefined();
    });
  });

  describe('ui object', () => {
    it('should have colors property', async () => {
      const { ui } = await import('../scripts/utils/design-system.js');
      expect(ui.colors).toBeDefined();
      expect(ui.colors.primary).toBeDefined();
      expect(ui.colors.success).toBeDefined();
      expect(ui.colors.error).toBeDefined();
    });

    it('should have icons property', async () => {
      const { ui } = await import('../scripts/utils/design-system.js');
      expect(ui.icons).toBeDefined();
    });

    describe('message methods', () => {
      it('should have status message methods', async () => {
        const { ui } = await import('../scripts/utils/design-system.js');
        expect(typeof ui.success).toBe('function');
        expect(typeof ui.error).toBe('function');
        expect(typeof ui.warning).toBe('function');
        expect(typeof ui.info).toBe('function');
        expect(typeof ui.muted).toBe('function');
      });

      it('should have text-only status methods', async () => {
        const { ui } = await import('../scripts/utils/design-system.js');
        expect(typeof ui.successText).toBe('function');
        expect(typeof ui.errorText).toBe('function');
        expect(typeof ui.warningText).toBe('function');
        expect(typeof ui.mutedText).toBe('function');
      });
    });

    describe('header methods', () => {
      it('should have header methods', async () => {
        const { ui } = await import('../scripts/utils/design-system.js');
        expect(typeof ui.header).toBe('function');
        expect(typeof ui.subheader).toBe('function');
        expect(typeof ui.section).toBe('function');
      });
    });

    describe('list methods', () => {
      it('should have list change methods', async () => {
        const { ui } = await import('../scripts/utils/design-system.js');
        expect(typeof ui.added).toBe('function');
        expect(typeof ui.modified).toBe('function');
        expect(typeof ui.removed).toBe('function');
      });

      it('should have file tree methods', async () => {
        const { ui } = await import('../scripts/utils/design-system.js');
        expect(typeof ui.fileItem).toBe('function');
        expect(typeof ui.folderItem).toBe('function');
      });

      it('should have general list methods', async () => {
        const { ui } = await import('../scripts/utils/design-system.js');
        expect(typeof ui.bullet).toBe('function');
        expect(typeof ui.numbered).toBe('function');
      });
    });

    describe('utility methods', () => {
      it('should have divider method', async () => {
        const { ui } = await import('../scripts/utils/design-system.js');
        expect(typeof ui.divider).toBe('function');
        expect(typeof ui.doubleDivider).toBe('function');
      });

      it('should have blank/newline methods', async () => {
        const { ui } = await import('../scripts/utils/design-system.js');
        expect(typeof ui.blank).toBe('function');
        expect(typeof ui.newline).toBe('function');
      });

      it('should have spinner factory', async () => {
        const { ui } = await import('../scripts/utils/design-system.js');
        expect(typeof ui.spinner).toBe('function');
      });
    });

    describe('theme control', () => {
      it('should have theme methods on ui object', async () => {
        const { ui } = await import('../scripts/utils/design-system.js');
        expect(typeof ui.getTheme).toBe('function');
        expect(typeof ui.setTheme).toBe('function');
        expect(typeof ui.getAvailableThemes).toBe('function');
        expect(typeof ui.hasColors).toBe('function');
      });

      it('should report hasColors correctly', async () => {
        const { ui, setTheme } = await import('../scripts/utils/design-system.js');
        setTheme('default');
        expect(ui.hasColors()).toBe(true);
        setTheme('no-color');
        expect(ui.hasColors()).toBe(false);
      });
    });
  });

  describe('colors export', () => {
    it('should export colors as proxy', async () => {
      const { colors } = await import('../scripts/utils/design-system.js');
      expect(colors).toBeDefined();
      expect(typeof colors.primary).toBe('function');
    });

    it('should adapt to theme changes', async () => {
      const { colors, setTheme } = await import('../scripts/utils/design-system.js');
      setTheme('no-color');
      // no-color theme returns input as-is
      expect(colors.primary('test')).toBe('test');
    });
  });

  describe('no-color theme', () => {
    it('should not apply any color formatting', async () => {
      process.env.NO_COLOR = '1';
      const { ui } = await import('../scripts/utils/design-system.js');
      // In no-color mode, colors should return input unchanged
      expect(ui.colors.primary('test')).toBe('test');
      expect(ui.colors.success('test')).toBe('test');
      expect(ui.colors.error('test')).toBe('test');
    });
  });
});
