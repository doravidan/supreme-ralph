/**
 * Tests for prd-validator.js
 */

import { describe, it, expect } from 'vitest';
import {
  validatePrd,
  getPrdStats,
  formatValidationResult
} from '../scripts/utils/prd-validator.js';

describe('prd-validator', () => {
  describe('validatePrd', () => {
    const validPrd = {
      project: 'Test Project',
      branchName: 'ralph/test-feature',
      userStories: [
        {
          id: 'US-001',
          title: 'First Story',
          acceptanceCriteria: ['Criterion 1', 'Typecheck passes'],
          priority: 1
        }
      ]
    };

    it('should validate a correct PRD', () => {
      const result = validatePrd(validPrd);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for null PRD', () => {
      const result = validatePrd(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('PRD must be a valid JSON object');
    });

    it('should fail for non-object PRD', () => {
      const result = validatePrd('not an object');
      expect(result.valid).toBe(false);
    });

    describe('required fields', () => {
      it('should fail if project is missing', () => {
        const prd = { ...validPrd };
        delete prd.project;
        const result = validatePrd(prd);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required field: project');
      });

      it('should fail if branchName is missing', () => {
        const prd = { ...validPrd };
        delete prd.branchName;
        const result = validatePrd(prd);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required field: branchName');
      });

      it('should fail if userStories is missing', () => {
        const prd = { ...validPrd };
        delete prd.userStories;
        const result = validatePrd(prd);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required field: userStories');
      });
    });

    describe('userStories validation', () => {
      it('should fail if userStories is not an array', () => {
        const prd = { ...validPrd, userStories: 'not an array' };
        const result = validatePrd(prd);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('userStories must be an array');
      });

      it('should fail if userStories is empty', () => {
        const prd = { ...validPrd, userStories: [] };
        const result = validatePrd(prd);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('userStories cannot be empty');
      });

      it('should validate story required fields', () => {
        const prd = {
          ...validPrd,
          userStories: [{ id: 'US-001' }] // Missing title, acceptanceCriteria, priority
        };
        const result = validatePrd(prd);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes("missing required field 'title'"))).toBe(true);
        expect(result.errors.some(e => e.includes("missing required field 'acceptanceCriteria'"))).toBe(true);
        expect(result.errors.some(e => e.includes("missing required field 'priority'"))).toBe(true);
      });

      it('should fail if acceptanceCriteria is empty', () => {
        const prd = {
          ...validPrd,
          userStories: [{
            id: 'US-001',
            title: 'Test',
            acceptanceCriteria: [],
            priority: 1
          }]
        };
        const result = validatePrd(prd);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('acceptanceCriteria cannot be empty'))).toBe(true);
      });

      it('should fail if priority is not positive', () => {
        const prd = {
          ...validPrd,
          userStories: [{
            id: 'US-001',
            title: 'Test',
            acceptanceCriteria: ['Test'],
            priority: 0
          }]
        };
        const result = validatePrd(prd);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('priority must be a positive number'))).toBe(true);
      });

      it('should detect duplicate story IDs', () => {
        const prd = {
          ...validPrd,
          userStories: [
            { id: 'US-001', title: 'First', acceptanceCriteria: ['Test'], priority: 1 },
            { id: 'US-001', title: 'Duplicate', acceptanceCriteria: ['Test'], priority: 2 }
          ]
        };
        const result = validatePrd(prd);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Duplicate story IDs'))).toBe(true);
      });
    });

    describe('warnings', () => {
      it('should warn if branchName does not start with ralph/', () => {
        const prd = { ...validPrd, branchName: 'feature/test' };
        const result = validatePrd(prd);
        expect(result.warnings.some(w => w.includes('should start with "ralph/"'))).toBe(true);
      });

      it('should warn if ID does not match US-NNN format', () => {
        const prd = {
          ...validPrd,
          userStories: [{
            id: 'STORY-1',
            title: 'Test',
            acceptanceCriteria: ['Test'],
            priority: 1
          }]
        };
        const result = validatePrd(prd);
        expect(result.warnings.some(w => w.includes("should follow format 'US-NNN'"))).toBe(true);
      });

      it('should warn if missing Typecheck in acceptanceCriteria', () => {
        const prd = {
          ...validPrd,
          userStories: [{
            id: 'US-001',
            title: 'Test',
            acceptanceCriteria: ['Some criterion'],
            priority: 1
          }]
        };
        const result = validatePrd(prd);
        expect(result.warnings.some(w => w.includes('Typecheck passes'))).toBe(true);
      });
    });
  });

  describe('getPrdStats', () => {
    const prd = {
      project: 'Test',
      branchName: 'ralph/test',
      userStories: [
        { id: 'US-001', title: 'First', passes: true, priority: 1 },
        { id: 'US-002', title: 'Second', passes: true, priority: 2 },
        { id: 'US-003', title: 'Third', passes: false, priority: 3 },
        { id: 'US-004', title: 'Fourth', passes: false, priority: 4 }
      ]
    };

    it('should count total stories', () => {
      const stats = getPrdStats(prd);
      expect(stats.total).toBe(4);
    });

    it('should count completed stories', () => {
      const stats = getPrdStats(prd);
      expect(stats.complete).toBe(2);
    });

    it('should count remaining stories', () => {
      const stats = getPrdStats(prd);
      expect(stats.remaining).toBe(2);
    });

    it('should calculate percent complete', () => {
      const stats = getPrdStats(prd);
      expect(stats.percentComplete).toBe(50);
    });

    it('should find next incomplete story', () => {
      const stats = getPrdStats(prd);
      expect(stats.nextStory).not.toBeNull();
      expect(stats.nextStory.id).toBe('US-003');
    });

    it('should return null nextStory when all complete', () => {
      const completePrd = {
        ...prd,
        userStories: prd.userStories.map(s => ({ ...s, passes: true }))
      };
      const stats = getPrdStats(completePrd);
      expect(stats.nextStory).toBeNull();
    });

    it('should handle empty/invalid PRD', () => {
      const stats = getPrdStats(null);
      expect(stats.total).toBe(0);
      expect(stats.complete).toBe(0);
      expect(stats.remaining).toBe(0);
      expect(stats.percentComplete).toBe(0);
      expect(stats.nextStory).toBeNull();
    });

    it('should handle PRD without userStories', () => {
      const stats = getPrdStats({ project: 'Test' });
      expect(stats.total).toBe(0);
    });
  });

  describe('formatValidationResult', () => {
    it('should format valid result', () => {
      const result = { valid: true, errors: [], warnings: [] };
      const formatted = formatValidationResult(result);
      expect(formatted).toContain('✓ PRD validation passed');
    });

    it('should format invalid result', () => {
      const result = { valid: false, errors: ['Error 1'], warnings: [] };
      const formatted = formatValidationResult(result);
      expect(formatted).toContain('✗ PRD validation failed');
      expect(formatted).toContain('Error 1');
    });

    it('should format warnings', () => {
      const result = { valid: true, errors: [], warnings: ['Warning 1'] };
      const formatted = formatValidationResult(result);
      expect(formatted).toContain('Warning 1');
    });
  });
});
