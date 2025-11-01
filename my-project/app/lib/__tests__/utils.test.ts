/**
 * Unit Tests for Utils Module (utils.ts)
 * 
 * This file contains comprehensive unit tests for utility functions:
 * - cn() - Class name utility function
 */

import { cn } from '../utils';

describe('Utils Module', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      const result = cn('foo', 'bar');
      expect(result).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      const result = cn('foo', false && 'bar', 'baz');
      expect(result).toBe('foo baz');
    });

    it('should merge Tailwind classes correctly', () => {
      const result = cn('px-2 py-1', 'px-4');
      // tailwind-merge should remove conflicting classes
      expect(result).toContain('py-1');
      expect(result).not.toContain('px-2');
      expect(result).toContain('px-4');
    });

    it('should handle empty inputs', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle undefined and null values', () => {
      const result = cn('foo', undefined, null, 'bar');
      expect(result).toBe('foo bar');
    });

    it('should handle array inputs', () => {
      const result = cn(['foo', 'bar'], 'baz');
      expect(result).toBe('foo bar baz');
    });

    it('should handle object inputs', () => {
      const result = cn({
        foo: true,
        bar: false,
        baz: true,
      });
      expect(result).toBe('foo baz');
    });

    it('should handle mixed input types', () => {
      const result = cn(
        'base-class',
        ['array-class', 'another-array'],
        {
          conditional: true,
          notIncluded: false,
        },
        'string-class'
      );
      expect(result).toContain('base-class');
      expect(result).toContain('array-class');
      expect(result).toContain('conditional');
      expect(result).not.toContain('notIncluded');
      expect(result).toContain('string-class');
    });
  });
});

