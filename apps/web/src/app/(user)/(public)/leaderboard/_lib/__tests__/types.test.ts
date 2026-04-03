import { describe, expect, it } from 'vitest';

import {
  MODULES,
  PAGE_SIZE,
  VALID_PERIODS,
  buildChallengePath,
  buildDetailPath,
  moduleToSlug,
  slugToModule,
} from '../types';

describe('VALID_PERIODS', () => {
  it('contains exactly "all-time" and "monthly"', () => {
    expect(VALID_PERIODS).toEqual(['all-time', 'monthly']);
  });

  it('has length 2', () => {
    expect(VALID_PERIODS).toHaveLength(2);
  });
});

describe('MODULES', () => {
  it('contains all five drill modules', () => {
    expect(MODULES).toEqual([
      'jantou_fu',
      'machi_fu',
      'mentsu_fu',
      'tehai_fu',
      'yaku',
    ]);
  });
});

describe('PAGE_SIZE', () => {
  it('is 20', () => {
    expect(PAGE_SIZE).toBe(20);
  });
});

describe('moduleToSlug', () => {
  it('converts jantou_fu to jantou-fu', () => {
    expect(moduleToSlug('jantou_fu')).toBe('jantou-fu');
  });

  it('converts machi_fu to machi-fu', () => {
    expect(moduleToSlug('machi_fu')).toBe('machi-fu');
  });

  it('converts yaku to yaku', () => {
    expect(moduleToSlug('yaku')).toBe('yaku');
  });
});

describe('slugToModule', () => {
  it('converts jantou-fu to jantou_fu', () => {
    expect(slugToModule('jantou-fu')).toBe('jantou_fu');
  });

  it('converts mentsu-fu to mentsu_fu', () => {
    expect(slugToModule('mentsu-fu')).toBe('mentsu_fu');
  });

  it('converts yaku to yaku', () => {
    expect(slugToModule('yaku')).toBe('yaku');
  });

  it('returns undefined for unknown slug', () => {
    expect(slugToModule('unknown')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(slugToModule('')).toBeUndefined();
  });
});

describe('buildDetailPath', () => {
  it('builds correct path for all-time jantou_fu', () => {
    expect(buildDetailPath('all-time', 'jantou_fu')).toBe('/leaderboard/all-time/jantou-fu');
  });

  it('builds correct path for monthly yaku', () => {
    expect(buildDetailPath('monthly', 'yaku')).toBe('/leaderboard/monthly/yaku');
  });
});

describe('buildChallengePath', () => {
  it('builds correct path for jantou_fu', () => {
    expect(buildChallengePath('jantou_fu')).toBe('/practice/jantou-fu/play');
  });

  it('builds correct path for yaku', () => {
    expect(buildChallengePath('yaku')).toBe('/practice/yaku/play');
  });
});
