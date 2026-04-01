import { describe, expect, it } from 'vitest';
import { validateUsernameFormat, validateUsername } from '../username';

describe('validateUsernameFormat', () => {
  describe('valid usernames', () => {
    it.each([
      'ab',
      'a1',
      'player_1',
      'mahjong_master99',
      'abcdefghijklmnopqrst', // exactly 20 chars
    ])('returns undefined for "%s"', (username) => {
      expect(validateUsernameFormat(username)).toBeUndefined();
    });
  });

  describe('too_short', () => {
    it('returns too_short for empty string', () => {
      expect(validateUsernameFormat('')).toBe('too_short');
    });

    it('returns too_short for single character', () => {
      expect(validateUsernameFormat('a')).toBe('too_short');
    });
  });

  describe('too_long', () => {
    it('returns too_long for 21 characters', () => {
      expect(validateUsernameFormat('abcdefghijklmnopqrstu')).toBe('too_long');
    });

    it('returns too_long for very long string', () => {
      expect(validateUsernameFormat('a'.repeat(100))).toBe('too_long');
    });
  });

  describe('invalid_format', () => {
    it('rejects uppercase letters', () => {
      expect(validateUsernameFormat('Player1')).toBe('invalid_format');
    });

    it('rejects hyphens', () => {
      expect(validateUsernameFormat('my-name')).toBe('invalid_format');
    });

    it('rejects username starting with digit', () => {
      expect(validateUsernameFormat('1abc')).toBe('invalid_format');
    });

    it('rejects username starting with underscore', () => {
      expect(validateUsernameFormat('_abc')).toBe('invalid_format');
    });

    it('rejects username ending with underscore', () => {
      expect(validateUsernameFormat('abc_')).toBe('invalid_format');
    });

    it('rejects consecutive underscores', () => {
      expect(validateUsernameFormat('a__b')).toBe('invalid_format');
    });

    it('rejects special characters', () => {
      expect(validateUsernameFormat('a@b')).toBe('invalid_format');
    });

    it('rejects spaces', () => {
      expect(validateUsernameFormat('a b')).toBe('invalid_format');
    });

    it('rejects dots', () => {
      expect(validateUsernameFormat('a.b')).toBe('invalid_format');
    });

    it('rejects all-uppercase', () => {
      expect(validateUsernameFormat('ADMIN')).toBe('invalid_format');
    });

    it('rejects mixed case', () => {
      expect(validateUsernameFormat('aBcDe')).toBe('invalid_format');
    });
  });

  describe('priority: too_short takes precedence over invalid_format', () => {
    it('returns too_short for single digit', () => {
      expect(validateUsernameFormat('1')).toBe('too_short');
    });
  });
});

describe('validateUsername', () => {
  describe('format errors propagate', () => {
    it('returns too_short for empty string', () => {
      expect(validateUsername('')).toBe('too_short');
    });

    it('returns invalid_format for uppercase', () => {
      expect(validateUsername('Player1')).toBe('invalid_format');
    });
  });

  describe('reserved words', () => {
    it.each([
      'api',
      'mahjong',
      'postmaster',
      'test',
      'user',
      'null',
      'riichi',
      'system',
      'google',
    ])('returns reserved for "%s"', (username) => {
      expect(validateUsername(username)).toBe('reserved');
    });

    it('does not reserve "admin" (excluded for operator use)', () => {
      // "admin" is explicitly excluded from the reserved list
      // per reserved-usernames.ts: reserved for use as an operator's own username
      expect(validateUsername('admin')).toBeUndefined();
    });
  });

  describe('non-reserved valid usernames', () => {
    it.each(['alice', 'bob123', 'player_1', 'mahjong_master99'])(
      'returns undefined for "%s"',
      (username) => {
        expect(validateUsername(username)).toBeUndefined();
      },
    );
  });

  describe('two-letter country codes that are reserved', () => {
    it.each(['us', 'uk', 'jp', 'de', 'fr'])(
      'returns reserved for "%s"',
      (username) => {
        expect(validateUsername(username)).toBe('reserved');
      },
    );
  });

  describe('boundary: exactly min/max length', () => {
    it('accepts exactly 2 characters', () => {
      expect(validateUsername('ab')).toBeUndefined();
    });

    it('accepts exactly 20 characters', () => {
      expect(validateUsername('abcdefghijklmnopqrst')).toBeUndefined();
    });
  });
});
