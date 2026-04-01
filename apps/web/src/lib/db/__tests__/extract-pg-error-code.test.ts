import { describe, expect, it } from 'vitest';
import { extractPgErrorCode } from '../extract-pg-error-code';

describe('extractPgErrorCode', () => {
  describe('non-Error inputs return undefined', () => {
    it.each([undefined, null, 'string', 42, {}, [], true, Symbol('test')])(
      'returns undefined for %s',
      (input) => {
        expect(extractPgErrorCode(input)).toBeUndefined();
      },
    );
  });

  describe('Error without code property', () => {
    it('returns undefined for a plain Error', () => {
      expect(extractPgErrorCode(new Error('test'))).toBeUndefined();
    });

    it('returns undefined for a TypeError', () => {
      expect(extractPgErrorCode(new TypeError('test'))).toBeUndefined();
    });
  });

  describe('Error with code on top level', () => {
    it('extracts string code from top-level Error', () => {
      const err = new Error('unique violation');
      (err as unknown as Record<string, unknown>).code = '23505';
      expect(extractPgErrorCode(err)).toBe('23505');
    });

    it('extracts different PG error codes', () => {
      const err = new Error('foreign key violation');
      (err as unknown as Record<string, unknown>).code = '23503';
      expect(extractPgErrorCode(err)).toBe('23503');
    });
  });

  describe('Error with code on .cause', () => {
    it('extracts code from cause when top-level has no code', () => {
      const inner = new Error('pg error');
      (inner as unknown as Record<string, unknown>).code = '23505';
      const outer = new Error('wrapper', { cause: inner });
      expect(extractPgErrorCode(outer)).toBe('23505');
    });

    it('prefers top-level code over cause code', () => {
      const inner = new Error('inner');
      (inner as unknown as Record<string, unknown>).code = '23503';
      const outer = new Error('outer');
      (outer as unknown as Record<string, unknown>).code = '23505';
      (outer as unknown as Record<string, unknown>).cause = inner;
      expect(extractPgErrorCode(outer)).toBe('23505');
    });
  });

  describe('Error with non-string code', () => {
    it('returns undefined when code is a number', () => {
      const err = new Error('test');
      (err as unknown as Record<string, unknown>).code = 23505;
      expect(extractPgErrorCode(err)).toBeUndefined();
    });

    it('returns undefined when code is boolean', () => {
      const err = new Error('test');
      (err as unknown as Record<string, unknown>).code = true;
      expect(extractPgErrorCode(err)).toBeUndefined();
    });

    it('returns undefined when code is null', () => {
      const err = new Error('test');
      (err as unknown as Record<string, unknown>).code = null;
      expect(extractPgErrorCode(err)).toBeUndefined();
    });
  });

  describe('cause is not an Error', () => {
    it('returns undefined when cause is a plain object with code', () => {
      const outer = new Error('wrapper', { cause: { code: '23505' } });
      expect(extractPgErrorCode(outer)).toBeUndefined();
    });

    it('returns undefined when cause is a string', () => {
      const outer = new Error('wrapper', { cause: 'some cause' });
      expect(extractPgErrorCode(outer)).toBeUndefined();
    });
  });

  describe('nested cause with numeric code on top, string on cause', () => {
    it('falls through to cause when top-level code is non-string', () => {
      const inner = new Error('pg error');
      (inner as unknown as Record<string, unknown>).code = '23505';
      const outer = new Error('wrapper');
      (outer as unknown as Record<string, unknown>).code = 42;
      (outer as unknown as Record<string, unknown>).cause = inner;
      expect(extractPgErrorCode(outer)).toBe('23505');
    });
  });
});
