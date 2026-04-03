import { describe, expect, it } from 'vitest';

import { isValidModule, isValidPeriod } from '../validators';

describe('isValidPeriod', () => {
  describe('valid periods', () => {
    it('returns true for "all-time"', () => {
      expect(isValidPeriod('all-time')).toBe(true);
    });

    it('returns true for "monthly"', () => {
      expect(isValidPeriod('monthly')).toBe(true);
    });
  });

  describe('invalid periods', () => {
    it('returns false for an empty string', () => {
      expect(isValidPeriod('')).toBe(false);
    });

    it('returns false for "weekly"', () => {
      expect(isValidPeriod('weekly')).toBe(false);
    });

    it('returns false for "daily"', () => {
      expect(isValidPeriod('daily')).toBe(false);
    });

    it('returns false for "alltime" (missing hyphen)', () => {
      expect(isValidPeriod('alltime')).toBe(false);
    });

    it('returns false for "All-Time" (case mismatch)', () => {
      expect(isValidPeriod('All-Time')).toBe(false);
    });

    it('returns false for "MONTHLY" (case mismatch)', () => {
      expect(isValidPeriod('MONTHLY')).toBe(false);
    });
  });
});

describe('isValidModule', () => {
  describe('valid modules', () => {
    it('returns true for "jantou_fu"', () => {
      expect(isValidModule('jantou_fu')).toBe(true);
    });

    it('returns true for "yaku"', () => {
      expect(isValidModule('yaku')).toBe(true);
    });

    it('returns true for "tehai_fu"', () => {
      expect(isValidModule('tehai_fu')).toBe(true);
    });
  });

  describe('invalid modules', () => {
    it('returns false for an empty string', () => {
      expect(isValidModule('')).toBe(false);
    });

    it('returns false for kebab-case slug', () => {
      expect(isValidModule('jantou-fu')).toBe(false);
    });

    it('returns false for unknown module', () => {
      expect(isValidModule('unknown')).toBe(false);
    });
  });
});
