/**
 * Tests for template-engine.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TemplateEngine,
  render,
  validate,
  createEngine,
  applyVariables
} from '../scripts/utils/template-engine.js';

describe('template-engine', () => {
  describe('TemplateEngine class', () => {
    let engine;

    beforeEach(() => {
      engine = new TemplateEngine();
    });

    describe('constructor', () => {
      it('should create with default options', () => {
        const eng = new TemplateEngine();
        expect(eng.strictMode).toBe(false);
        expect(eng.warnOnMissing).toBe(true);
        expect(eng.undefinedValue).toBe('');
      });

      it('should accept custom options', () => {
        const eng = new TemplateEngine({
          strictMode: true,
          warnOnMissing: false,
          undefinedValue: 'N/A'
        });
        expect(eng.strictMode).toBe(true);
        expect(eng.warnOnMissing).toBe(false);
        expect(eng.undefinedValue).toBe('N/A');
      });
    });

    describe('variable substitution', () => {
      it('should replace simple variables', () => {
        const result = engine.render('Hello {{name}}!', { name: 'World' });
        expect(result).toBe('Hello World!');
      });

      it('should replace multiple variables', () => {
        const result = engine.render('{{greeting}} {{name}}!', {
          greeting: 'Hello',
          name: 'World'
        });
        expect(result).toBe('Hello World!');
      });

      it('should handle nested paths', () => {
        const result = engine.render('Hello {{user.name}}!', {
          user: { name: 'Alice' }
        });
        expect(result).toBe('Hello Alice!');
      });

      it('should handle deeply nested paths', () => {
        const result = engine.render('{{a.b.c.d}}', {
          a: { b: { c: { d: 'deep' } } }
        });
        expect(result).toBe('deep');
      });

      it('should replace missing variables with empty string', () => {
        const result = engine.render('Hello {{name}}!', {});
        expect(result).toBe('Hello !');
      });

      it('should handle numeric values', () => {
        const result = engine.render('Count: {{count}}', { count: 42 });
        expect(result).toBe('Count: 42');
      });

      it('should handle boolean values', () => {
        const result = engine.render('Active: {{active}}', { active: true });
        expect(result).toBe('Active: true');
      });
    });

    describe('conditionals', () => {
      it('should render if block when condition is truthy', () => {
        const result = engine.render('{{#if show}}visible{{/if}}', { show: true });
        expect(result).toBe('visible');
      });

      it('should not render if block when condition is falsy', () => {
        const result = engine.render('{{#if show}}visible{{/if}}', { show: false });
        expect(result).toBe('');
      });

      it('should render else block when condition is falsy', () => {
        const result = engine.render('{{#if show}}yes{{else}}no{{/if}}', { show: false });
        expect(result).toBe('no');
      });

      it('should handle nested paths in conditions', () => {
        const result = engine.render('{{#if user.active}}active{{/if}}', {
          user: { active: true }
        });
        expect(result).toBe('active');
      });

      it('should treat non-empty arrays as truthy', () => {
        const result = engine.render('{{#if items}}has items{{/if}}', {
          items: [1, 2, 3]
        });
        expect(result).toBe('has items');
      });

      it('should treat empty arrays as falsy', () => {
        const result = engine.render('{{#if items}}has items{{else}}empty{{/if}}', {
          items: []
        });
        expect(result).toBe('empty');
      });

      it('should treat non-empty strings as truthy', () => {
        const result = engine.render('{{#if name}}has name{{/if}}', {
          name: 'test'
        });
        expect(result).toBe('has name');
      });

      it('should treat empty strings as falsy', () => {
        const result = engine.render('{{#if name}}has name{{else}}no name{{/if}}', {
          name: ''
        });
        expect(result).toBe('no name');
      });
    });

    describe('loops', () => {
      it('should iterate over arrays', () => {
        const result = engine.render('{{#each items}}{{this}},{{/each}}', {
          items: ['a', 'b', 'c']
        });
        expect(result).toBe('a,b,c,');
      });

      it('should provide @index in loops', () => {
        const result = engine.render('{{#each items}}{{@index}}:{{this}};{{/each}}', {
          items: ['a', 'b', 'c']
        });
        expect(result).toBe('0:a;1:b;2:c;');
      });

      it('should provide @first in loops', () => {
        const result = engine.render('{{#each items}}{{#if @first}}FIRST:{{/if}}{{this}};{{/each}}', {
          items: ['a', 'b', 'c']
        });
        expect(result).toBe('FIRST:a;b;c;');
      });

      it('should provide @last in loops', () => {
        const result = engine.render('{{#each items}}{{this}}{{#if @last}}!{{/if}};{{/each}}', {
          items: ['a', 'b', 'c']
        });
        expect(result).toBe('a;b;c!;');
      });

      it('should iterate over object arrays', () => {
        const result = engine.render('{{#each users}}{{name}},{{/each}}', {
          users: [{ name: 'Alice' }, { name: 'Bob' }]
        });
        expect(result).toBe('Alice,Bob,');
      });

      it('should handle empty arrays', () => {
        const result = engine.render('{{#each items}}{{this}}{{/each}}', {
          items: []
        });
        expect(result).toBe('');
      });

      it('should handle nested loops', () => {
        const result = engine.render(
          '{{#each groups}}[{{#each items}}{{this}}{{/each}}]{{/each}}',
          { groups: [{ items: ['a', 'b'] }, { items: ['c', 'd'] }] }
        );
        expect(result).toBe('[ab][cd]');
      });
    });

    describe('strict mode', () => {
      it('should throw on missing variables in strict mode', () => {
        const strictEngine = new TemplateEngine({ strictMode: true });
        expect(() => {
          strictEngine.render('{{missing}}', {});
        }).toThrow('Missing template variables');
      });

      it('should not throw on missing variables in non-strict mode', () => {
        const result = engine.render('{{missing}}', {});
        expect(result).toBe('');
      });
    });

    describe('custom undefined value', () => {
      it('should use custom undefined value', () => {
        const customEngine = new TemplateEngine({ undefinedValue: 'N/A' });
        const result = customEngine.render('Value: {{missing}}', {});
        expect(result).toBe('Value: N/A');
      });
    });
  });

  describe('validate function', () => {
    it('should return valid for correct template', () => {
      const result = validate('Hello {{name}}!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect variables', () => {
      const result = validate('{{name}} {{age}}');
      expect(result.variables).toContain('name');
      expect(result.variables).toContain('age');
    });

    it('should detect conditionals', () => {
      const result = validate('{{#if active}}...{{/if}}');
      expect(result.conditionals).toContain('active');
    });

    it('should detect loops', () => {
      const result = validate('{{#each items}}...{{/each}}');
      expect(result.loops).toContain('items');
    });

    it('should detect unmatched if blocks', () => {
      const result = validate('{{#if test}}...');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Unmatched {{#if}}');
    });

    it('should detect unmatched each blocks', () => {
      const result = validate('{{#each items}}...');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Unmatched {{#each}}');
    });
  });

  describe('render function', () => {
    it('should work as standalone function', () => {
      const result = render('Hello {{name}}!', { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('should handle empty template', () => {
      const result = render('', {});
      expect(result).toBe('');
    });

    it('should handle null template', () => {
      const result = render(null, {});
      expect(result).toBe('');
    });
  });

  describe('createEngine function', () => {
    it('should create new engine with options', () => {
      const eng = createEngine({ strictMode: true });
      expect(eng).toBeInstanceOf(TemplateEngine);
      expect(eng.strictMode).toBe(true);
    });
  });

  describe('applyVariables function (legacy)', () => {
    it('should work for backward compatibility', () => {
      const result = applyVariables('{{name}}', { name: 'test' });
      expect(result).toBe('test');
    });
  });

  describe('complex templates', () => {
    it('should handle mixed conditionals, loops, and variables', () => {
      const template = `
Project: {{project}}
{{#if hasItems}}
Items:
{{#each items}}
  - {{name}} ({{@index}})
{{/each}}
{{else}}
No items.
{{/if}}
Total: {{total}}
      `.trim();

      const result = render(template, {
        project: 'Test',
        hasItems: true,
        items: [{ name: 'A' }, { name: 'B' }],
        total: 2
      });

      expect(result).toContain('Project: Test');
      expect(result).toContain('- A (0)');
      expect(result).toContain('- B (1)');
      expect(result).toContain('Total: 2');
    });
  });
});
