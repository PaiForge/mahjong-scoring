import { describe, expect, it } from 'vitest';
import { isPracticeMenuType, PRACTICE_MENU_TYPES } from '../practice-menu-types';

describe('isPracticeMenuType', () => {
  describe('valid menu types', () => {
    it.each(PRACTICE_MENU_TYPES)('returns true for "%s"', (menuType) => {
      expect(isPracticeMenuType(menuType)).toBe(true);
    });
  });

  describe('invalid string values', () => {
    it.each(['', 'unknown', 'jantou-fu', 'JANTOU_FU', 'score', 'practice'])(
      'returns false for "%s"',
      (value) => {
        expect(isPracticeMenuType(value)).toBe(false);
      },
    );
  });

  describe('non-string values', () => {
    it.each([undefined, 0, 42, true, false, Symbol('test'), [], {}, () => {}])(
      'returns false for %s',
      (value) => {
        expect(isPracticeMenuType(value)).toBe(false);
      },
    );

    it('returns false for null', () => {
      expect(isPracticeMenuType(null)).toBe(false);
    });
  });
});
