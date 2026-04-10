import { describe, expect, it } from 'vitest';

import {
  buildHeatmapLayout,
  buildWeeks,
  formatDate,
  generateDateRange,
  getExpLevel,
  getHeatmapDateRangeForWeeks,
  getJstTodayDate,
  getMonthLabelsForWeeks,
  getRecentDays,
} from './heatmap-utils';

describe('getExpLevel', () => {
  it('returns 0 when amount is 0', () => {
    expect(getExpLevel(0, 100)).toBe(0);
  });

  it('returns 0 when maxAmount is 0', () => {
    expect(getExpLevel(50, 0)).toBe(0);
  });

  it('returns 0 for negative amount', () => {
    expect(getExpLevel(-10, 100)).toBe(0);
  });

  it('returns 1 for low ratio (<=25%)', () => {
    expect(getExpLevel(25, 100)).toBe(1);
    expect(getExpLevel(1, 100)).toBe(1);
  });

  it('returns 2 for medium-low ratio (26-50%)', () => {
    expect(getExpLevel(50, 100)).toBe(2);
    expect(getExpLevel(26, 100)).toBe(2);
  });

  it('returns 3 for medium-high ratio (51-75%)', () => {
    expect(getExpLevel(75, 100)).toBe(3);
    expect(getExpLevel(51, 100)).toBe(3);
  });

  it('returns 4 for high ratio (>75%)', () => {
    expect(getExpLevel(76, 100)).toBe(4);
    expect(getExpLevel(100, 100)).toBe(4);
  });

  it('returns 4 when amount equals maxAmount', () => {
    expect(getExpLevel(200, 200)).toBe(4);
  });

  it('returns 4 when amount exceeds maxAmount', () => {
    expect(getExpLevel(150, 100)).toBe(4);
  });

  it('returns 0 when maxAmount is negative', () => {
    expect(getExpLevel(50, -10)).toBe(0);
  });

  it('returns 0 when both amount and maxAmount are negative', () => {
    expect(getExpLevel(-5, -10)).toBe(0);
  });

  it('returns 0 when both amount and maxAmount are zero', () => {
    expect(getExpLevel(0, 0)).toBe(0);
  });

  it('handles very small fractional amounts', () => {
    expect(getExpLevel(0.01, 100)).toBe(1);
  });

  it('returns correct level at exact boundary 25%', () => {
    expect(getExpLevel(25, 100)).toBe(1);
  });

  it('returns correct level just above 25% boundary', () => {
    expect(getExpLevel(25.01, 100)).toBe(2);
  });

  it('returns correct level just above 50% boundary', () => {
    expect(getExpLevel(50.01, 100)).toBe(3);
  });

  it('returns correct level just above 75% boundary', () => {
    expect(getExpLevel(75.01, 100)).toBe(4);
  });
});

describe('generateDateRange', () => {
  it('generates inclusive date range', () => {
    const start = new Date(2026, 0, 1);
    const end = new Date(2026, 0, 3);
    const dates = generateDateRange(start, end);
    expect(dates).toEqual(['2026-01-01', '2026-01-02', '2026-01-03']);
  });

  it('returns single date when start equals end', () => {
    const date = new Date(2026, 5, 15);
    const dates = generateDateRange(date, date);
    expect(dates).toEqual(['2026-06-15']);
  });

  it('returns empty array when start is after end', () => {
    const start = new Date(2026, 0, 5);
    const end = new Date(2026, 0, 1);
    const dates = generateDateRange(start, end);
    expect(dates).toEqual([]);
  });

  it('generates dates across month boundary', () => {
    const start = new Date(2026, 0, 30);
    const end = new Date(2026, 1, 2);
    const dates = generateDateRange(start, end);
    expect(dates).toEqual(['2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02']);
  });

  it('generates dates across year boundary', () => {
    const start = new Date(2025, 11, 30);
    const end = new Date(2026, 0, 2);
    const dates = generateDateRange(start, end);
    expect(dates).toEqual(['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02']);
  });

  it('does not mutate the input start date', () => {
    const start = new Date(2026, 0, 1);
    const end = new Date(2026, 0, 3);
    const originalTime = start.getTime();
    generateDateRange(start, end);
    expect(start.getTime()).toBe(originalTime);
  });
});

describe('formatDate', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(formatDate(new Date(2026, 0, 1))).toBe('2026-01-01');
    expect(formatDate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('pads single-digit month and day', () => {
    expect(formatDate(new Date(2026, 2, 5))).toBe('2026-03-05');
  });

  it('formats double-digit month and day without extra padding', () => {
    expect(formatDate(new Date(2026, 10, 25))).toBe('2026-11-25');
  });

  it('formats February 29 in a leap year', () => {
    expect(formatDate(new Date(2024, 1, 29))).toBe('2024-02-29');
  });
});

describe('getHeatmapDateRangeForWeeks', () => {
  it('returns a range ending on the given date', () => {
    const today = new Date(2026, 3, 8); // Wednesday
    const { endDate } = getHeatmapDateRangeForWeeks(today, 53);
    expect(formatDate(endDate)).toBe('2026-04-08');
  });

  it('starts on a Sunday', () => {
    const today = new Date(2026, 3, 8);
    const { startDate } = getHeatmapDateRangeForWeeks(today, 53);
    expect(startDate.getDay()).toBe(0);
  });

  it('covers 53 weeks when totalWeeks is 53', () => {
    const today = new Date(2026, 3, 8);
    const { startDate, endDate } = getHeatmapDateRangeForWeeks(today, 53);
    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(364);
    expect(diffDays).toBeLessThanOrEqual(377);
  });

  it('covers 26 weeks when totalWeeks is 26 (mobile)', () => {
    const today = new Date(2026, 3, 8);
    const { startDate, endDate } = getHeatmapDateRangeForWeeks(today, 26);
    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(175);
    expect(diffDays).toBeLessThanOrEqual(181);
  });

  it('when today is Sunday and totalWeeks is 26, covers exactly 25 weeks', () => {
    const sunday = new Date(2026, 3, 5);
    const { startDate, endDate } = getHeatmapDateRangeForWeeks(sunday, 26);
    expect(startDate.getDay()).toBe(0);
    expect(formatDate(endDate)).toBe('2026-04-05');
    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(175);
  });

  it('returns a single week when totalWeeks is 1', () => {
    const wednesday = new Date(2026, 3, 8);
    const { startDate, endDate } = getHeatmapDateRangeForWeeks(wednesday, 1);
    expect(startDate.getDay()).toBe(0);
    expect(formatDate(endDate)).toBe('2026-04-08');
    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(3);
  });

  it('when today is Saturday and totalWeeks is 26, covers 25 weeks + 6 days', () => {
    const saturday = new Date(2026, 3, 4);
    const { startDate, endDate } = getHeatmapDateRangeForWeeks(saturday, 26);
    expect(startDate.getDay()).toBe(0);
    expect(formatDate(endDate)).toBe('2026-04-04');
    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(175 + 6);
  });

  it('handles year boundary with 26 weeks from January', () => {
    const jan15 = new Date(2026, 0, 15);
    const { startDate, endDate } = getHeatmapDateRangeForWeeks(jan15, 26);
    expect(startDate.getDay()).toBe(0);
    expect(formatDate(endDate)).toBe('2026-01-15');
    expect(startDate.getFullYear()).toBe(2025);
    expect(startDate.getMonth()).toBe(6);
  });

  it('does not mutate the input date', () => {
    const today = new Date(2026, 3, 8);
    const originalTime = today.getTime();
    getHeatmapDateRangeForWeeks(today, 26);
    expect(today.getTime()).toBe(originalTime);
  });
});

describe('getRecentDays', () => {
  it('returns 7 dates ending on today', () => {
    const today = new Date(2026, 3, 8);
    const result = getRecentDays(today, 7);
    expect(result).toHaveLength(7);
    expect(result[6]).toBe('2026-04-08');
    expect(result[0]).toBe('2026-04-02');
  });

  it('returns dates in ascending order', () => {
    const today = new Date(2026, 3, 8);
    const result = getRecentDays(today, 7);
    for (let i = 1; i < result.length; i++) {
      expect(result[i] > result[i - 1]).toBe(true);
    }
  });

  it('returns a single date when days is 1', () => {
    const today = new Date(2026, 3, 8);
    const result = getRecentDays(today, 1);
    expect(result).toEqual(['2026-04-08']);
  });

  it('handles month boundary', () => {
    const today = new Date(2026, 3, 2);
    const result = getRecentDays(today, 7);
    expect(result).toEqual([
      '2026-03-27',
      '2026-03-28',
      '2026-03-29',
      '2026-03-30',
      '2026-03-31',
      '2026-04-01',
      '2026-04-02',
    ]);
  });

  it('handles year boundary', () => {
    const today = new Date(2026, 0, 3);
    const result = getRecentDays(today, 7);
    expect(result[0]).toBe('2025-12-28');
    expect(result[6]).toBe('2026-01-03');
  });

  it('does not mutate the input date', () => {
    const today = new Date(2026, 3, 8);
    const originalTime = today.getTime();
    getRecentDays(today, 7);
    expect(today.getTime()).toBe(originalTime);
  });

  it('returns empty array when days is 0', () => {
    const today = new Date(2026, 3, 8);
    const result = getRecentDays(today, 0);
    expect(result).toEqual([]);
  });

  it('returns empty array when days is negative', () => {
    const today = new Date(2026, 3, 8);
    const result = getRecentDays(today, -5);
    expect(result).toEqual([]);
  });

  it('handles large number of days (365)', () => {
    const today = new Date(2026, 3, 8);
    const result = getRecentDays(today, 365);
    expect(result).toHaveLength(365);
    expect(result[364]).toBe('2026-04-08');
    expect(result[0]).toBe('2025-04-09');
    for (let i = 1; i < result.length; i++) {
      expect(result[i] > result[i - 1]).toBe(true);
    }
  });

  it('includes Feb 29 when spanning a leap year', () => {
    const today = new Date(2024, 2, 1);
    const result = getRecentDays(today, 3);
    expect(result).toEqual(['2024-02-28', '2024-02-29', '2024-03-01']);
  });

  it('skips Feb 29 in a non-leap year', () => {
    const today = new Date(2025, 2, 1);
    const result = getRecentDays(today, 3);
    expect(result).toEqual(['2025-02-27', '2025-02-28', '2025-03-01']);
  });

  it('handles Feb 29 as today in a leap year', () => {
    const today = new Date(2024, 1, 29);
    const result = getRecentDays(today, 1);
    expect(result).toEqual(['2024-02-29']);
  });

  it('handles very large number of days (1000)', () => {
    const today = new Date(2026, 3, 8);
    const result = getRecentDays(today, 1000);
    expect(result).toHaveLength(1000);
    expect(result[999]).toBe('2026-04-08');
    expect(result[0]).toBe('2023-07-14');
  });

  it('returns 30 dates for a full month span', () => {
    const today = new Date(2026, 3, 30);
    const result = getRecentDays(today, 30);
    expect(result).toHaveLength(30);
    expect(result[0]).toBe('2026-04-01');
    expect(result[29]).toBe('2026-04-30');
  });
});

describe('buildWeeks', () => {
  it('builds weeks from a full-week-aligned date array', () => {
    const dates = generateDateRange(new Date(2026, 3, 5), new Date(2026, 3, 11));
    const weeks = buildWeeks(dates);
    expect(weeks).toHaveLength(1);
    expect(weeks[0]).toEqual([
      '2026-04-05',
      '2026-04-06',
      '2026-04-07',
      '2026-04-08',
      '2026-04-09',
      '2026-04-10',
      '2026-04-11',
    ]);
  });

  it('pads the last week with null when it has fewer than 7 days', () => {
    const dates = generateDateRange(new Date(2026, 3, 5), new Date(2026, 3, 8));
    const weeks = buildWeeks(dates);
    expect(weeks).toHaveLength(1);
    expect(weeks[0]).toEqual([
      '2026-04-05',
      '2026-04-06',
      '2026-04-07',
      '2026-04-08',
      null,
      null,
      null,
    ]);
  });

  it('handles a partial first week (starting mid-week)', () => {
    const dates = generateDateRange(new Date(2026, 3, 1), new Date(2026, 3, 11));
    const weeks = buildWeeks(dates);
    expect(weeks).toHaveLength(2);
    expect(weeks[0]).toEqual(['2026-04-01', '2026-04-02', '2026-04-03', '2026-04-04']);
    expect(weeks[1]).toEqual([
      '2026-04-05',
      '2026-04-06',
      '2026-04-07',
      '2026-04-08',
      '2026-04-09',
      '2026-04-10',
      '2026-04-11',
    ]);
  });

  it('returns an empty array for empty input', () => {
    const weeks = buildWeeks([]);
    expect(weeks).toEqual([]);
  });

  it('handles a single date (Sunday)', () => {
    const weeks = buildWeeks(['2026-04-05']);
    expect(weeks).toHaveLength(1);
    expect(weeks[0]).toEqual(['2026-04-05', null, null, null, null, null, null]);
  });

  it('handles a single date (non-Sunday)', () => {
    const weeks = buildWeeks(['2026-04-08']);
    expect(weeks).toHaveLength(1);
    expect(weeks[0]).toEqual(['2026-04-08', null, null, null, null, null, null]);
  });

  it('builds multiple weeks correctly', () => {
    const dates = generateDateRange(new Date(2026, 2, 22), new Date(2026, 3, 11));
    const weeks = buildWeeks(dates);
    expect(weeks).toHaveLength(3);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks.every((w) => w.every((d) => d !== null))).toBe(true);
  });

  it('splits correctly at Sunday boundary', () => {
    const dates = generateDateRange(new Date(2026, 3, 4), new Date(2026, 3, 5));
    const weeks = buildWeeks(dates);
    expect(weeks).toHaveLength(2);
    expect(weeks[0]).toEqual(['2026-04-04']);
    expect(weeks[1]).toEqual(['2026-04-05', null, null, null, null, null, null]);
  });

  it('handles dates spanning a month boundary', () => {
    const dates = generateDateRange(new Date(2026, 0, 29), new Date(2026, 1, 3));
    const weeks = buildWeeks(dates);
    expect(weeks).toHaveLength(2);
    expect(weeks[0]).toEqual(['2026-01-29', '2026-01-30', '2026-01-31']);
    expect(weeks[1]).toEqual(['2026-02-01', '2026-02-02', '2026-02-03', null, null, null, null]);
  });
});

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

describe('getMonthLabelsForWeeks', () => {
  it('places a label when the month changes across weeks', () => {
    const allDates = generateDateRange(new Date(2026, 0, 18), new Date(2026, 1, 14));
    const weeks = buildWeeks(allDates);
    const labels = getMonthLabelsForWeeks(weeks, MONTH_NAMES);

    expect(labels[0]).toEqual({ weekIdx: 0, label: 'Jan' });

    const febLabel = labels.find((l) => l.label === 'Feb');
    expect(febLabel).toBeDefined();
    expect(febLabel!.weekIdx).toBeGreaterThan(0);
  });

  it('skips labels when consecutive month boundaries are closer than 2 weeks apart', () => {
    const weeks: (string | null)[][] = [
      [
        '2026-01-25',
        '2026-01-26',
        '2026-01-27',
        '2026-01-28',
        '2026-01-29',
        '2026-01-30',
        '2026-01-31',
      ],
      [
        '2026-02-01',
        '2026-02-02',
        '2026-02-03',
        '2026-02-04',
        '2026-02-05',
        '2026-02-06',
        '2026-02-07',
      ],
      [
        '2026-03-01',
        '2026-03-02',
        '2026-03-03',
        '2026-03-04',
        '2026-03-05',
        '2026-03-06',
        '2026-03-07',
      ],
    ];
    const labels = getMonthLabelsForWeeks(weeks, MONTH_NAMES);

    expect(labels).toEqual([
      { weekIdx: 0, label: 'Jan' },
      { weekIdx: 2, label: 'Mar' },
    ]);
  });

  it('places a label on the first week', () => {
    const weeks: (string | null)[][] = [
      [
        '2026-04-05',
        '2026-04-06',
        '2026-04-07',
        '2026-04-08',
        '2026-04-09',
        '2026-04-10',
        '2026-04-11',
      ],
    ];
    const labels = getMonthLabelsForWeeks(weeks, MONTH_NAMES);
    expect(labels).toEqual([{ weekIdx: 0, label: 'Apr' }]);
  });

  it('returns an empty array for an empty weeks array', () => {
    const labels = getMonthLabelsForWeeks([], MONTH_NAMES);
    expect(labels).toEqual([]);
  });

  it('skips weeks that contain only null values', () => {
    const weeks: (string | null)[][] = [
      [null, null, null, null, null, null, null],
      [
        '2026-03-08',
        '2026-03-09',
        '2026-03-10',
        '2026-03-11',
        '2026-03-12',
        '2026-03-13',
        '2026-03-14',
      ],
    ];
    const labels = getMonthLabelsForWeeks(weeks, MONTH_NAMES);
    expect(labels).toEqual([{ weekIdx: 1, label: 'Mar' }]);
  });

  it('handles weeks with mixed null and date values (partial weeks)', () => {
    const weeks: (string | null)[][] = [
      [null, null, null, null, null, '2026-06-05', '2026-06-06'],
      [
        '2026-06-07',
        '2026-06-08',
        '2026-06-09',
        '2026-06-10',
        '2026-06-11',
        '2026-06-12',
        '2026-06-13',
      ],
    ];
    const labels = getMonthLabelsForWeeks(weeks, MONTH_NAMES);
    expect(labels).toEqual([{ weekIdx: 0, label: 'Jun' }]);
  });

  it('generates labels across a full year of weeks', () => {
    const allDates = generateDateRange(new Date(2025, 3, 6), new Date(2026, 3, 8));
    const weeks = buildWeeks(allDates);
    const labels = getMonthLabelsForWeeks(weeks, MONTH_NAMES);
    expect(labels.length).toBeGreaterThanOrEqual(10);
    expect(labels.every((l) => MONTH_NAMES.includes(l.label))).toBe(true);
    for (let i = 1; i < labels.length; i++) {
      expect(labels[i].weekIdx).toBeGreaterThan(labels[i - 1].weekIdx);
    }
  });

  it('handles all weeks in the same month (no month changes)', () => {
    const weeks: (string | null)[][] = [
      [
        '2026-04-05',
        '2026-04-06',
        '2026-04-07',
        '2026-04-08',
        '2026-04-09',
        '2026-04-10',
        '2026-04-11',
      ],
      [
        '2026-04-12',
        '2026-04-13',
        '2026-04-14',
        '2026-04-15',
        '2026-04-16',
        '2026-04-17',
        '2026-04-18',
      ],
      [
        '2026-04-19',
        '2026-04-20',
        '2026-04-21',
        '2026-04-22',
        '2026-04-23',
        '2026-04-24',
        '2026-04-25',
      ],
    ];
    const labels = getMonthLabelsForWeeks(weeks, MONTH_NAMES);
    expect(labels).toEqual([{ weekIdx: 0, label: 'Apr' }]);
  });

  it('handles year boundary (December to January)', () => {
    const allDates = generateDateRange(new Date(2025, 11, 21), new Date(2026, 0, 17));
    const weeks = buildWeeks(allDates);
    const labels = getMonthLabelsForWeeks(weeks, MONTH_NAMES);
    const decLabel = labels.find((l) => l.label === 'Dec');
    const janLabel = labels.find((l) => l.label === 'Jan');
    expect(decLabel).toBeDefined();
    expect(janLabel).toBeDefined();
    expect(janLabel!.weekIdx).toBeGreaterThan(decLabel!.weekIdx);
  });
});

describe('getJstTodayDate', () => {
  // NOTE: these tests use absolute UTC instants. The implementation uses
  // Intl.DateTimeFormat with timeZone: 'Asia/Tokyo', which is independent of
  // the Node process TZ — so assertions are stable across runtimes.

  it('returns the JST calendar day for a mid-day UTC instant', () => {
    // 2026-04-10T03:00:00Z === 2026-04-10 12:00 JST → today = 2026-04-10
    const now = new Date('2026-04-10T03:00:00Z');
    const today = getJstTodayDate(now);
    expect(formatDate(today)).toBe('2026-04-10');
  });

  it('rolls forward to the next JST day when UTC is still on the previous day', () => {
    // 2026-04-10T20:00:00Z === 2026-04-11 05:00 JST → today = 2026-04-11
    const now = new Date('2026-04-10T20:00:00Z');
    const today = getJstTodayDate(now);
    expect(formatDate(today)).toBe('2026-04-11');
  });

  it('rolls year over correctly at the JST new-year boundary', () => {
    // 2026-12-31T23:30:00Z === 2027-01-01 08:30 JST → today = 2027-01-01
    const now = new Date('2026-12-31T23:30:00Z');
    const today = getJstTodayDate(now);
    expect(formatDate(today)).toBe('2027-01-01');
    expect(today.getFullYear()).toBe(2027);
    expect(today.getMonth()).toBe(0);
    expect(today.getDate()).toBe(1);
  });

  it('does not roll back at UTC midnight JST-forward (e.g. 14:59 UTC = 23:59 JST same day)', () => {
    // 2026-04-10T14:59:59Z === 2026-04-10 23:59:59 JST → still 2026-04-10
    const now = new Date('2026-04-10T14:59:59Z');
    const today = getJstTodayDate(now);
    expect(formatDate(today)).toBe('2026-04-10');
  });

  it('rolls to next JST day exactly at 15:00 UTC (= 00:00 JST)', () => {
    // 2026-04-10T15:00:00Z === 2026-04-11 00:00 JST → 2026-04-11
    const now = new Date('2026-04-10T15:00:00Z');
    const today = getJstTodayDate(now);
    expect(formatDate(today)).toBe('2026-04-11');
  });
});

describe('getHeatmapDateRangeForWeeks + getJstTodayDate composition', () => {
  it('endDate reflects JST next-day when UTC is still on the prior day (06:00 JST)', () => {
    // Reviewer test vector #1: now = 2026-04-10T20:00:00Z (06:00 JST 2026-04-11)
    // → endDate must be 2026-04-11
    const now = new Date('2026-04-10T20:00:00Z');
    const today = getJstTodayDate(now);
    const { endDate } = getHeatmapDateRangeForWeeks(today, 46);
    expect(formatDate(endDate)).toBe('2026-04-11');
  });

  it('endDate rolls into the next JST year at the UTC→JST boundary', () => {
    // Reviewer test vector #2: now = 2026-12-31T23:30:00Z (08:30 JST 2027-01-01)
    const now = new Date('2026-12-31T23:30:00Z');
    const today = getJstTodayDate(now);
    const { endDate } = getHeatmapDateRangeForWeeks(today, 46);
    expect(formatDate(endDate)).toBe('2027-01-01');
  });
});

describe('buildHeatmapLayout', () => {
  const MONTH_NAMES_JA = [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
  ];

  it('produces serializable weeks / monthLabels / recentDays based on JST today', () => {
    // 2026-04-10T20:00:00Z === 2026-04-11 05:00 JST
    const now = new Date('2026-04-10T20:00:00Z');
    const layout = buildHeatmapLayout({
      now,
      daily: { '2026-04-10': 100, '2026-04-11': 50 },
      monthNames: MONTH_NAMES_JA,
      recentDaysCount: 7,
      totalWeeks: 46,
    });

    // endDate is 2026-04-11 (JST)
    expect(layout.endDate).toBe('2026-04-11');
    // recentDays: last 7 JST days ending 2026-04-11
    expect(layout.recentDays).toHaveLength(7);
    expect(layout.recentDays[6]).toBe('2026-04-11');
    expect(layout.recentDays[0]).toBe('2026-04-05');
    // maxAmount comes from daily
    expect(layout.maxAmount).toBe(100);
    // weeks: 46 columns total (all full weeks because today is Saturday JST)
    expect(layout.weeks).toHaveLength(46);
    // Each week has 7 slots
    expect(layout.weeks.every((w) => w.length === 7)).toBe(true);
    // Month labels use the provided Japanese month names
    expect(layout.monthLabels.every((l) => MONTH_NAMES_JA.includes(l.label))).toBe(true);
  });

  it('returns maxAmount = 0 when daily is empty', () => {
    const now = new Date('2026-04-10T03:00:00Z');
    const layout = buildHeatmapLayout({
      now,
      daily: {},
      monthNames: MONTH_NAMES_JA,
      recentDaysCount: 7,
      totalWeeks: 46,
    });
    expect(layout.maxAmount).toBe(0);
    expect(layout.recentDays).toHaveLength(7);
  });

  it('never divides by zero when all cells would be level 0 for empty daily', () => {
    const now = new Date('2026-04-10T03:00:00Z');
    const layout = buildHeatmapLayout({
      now,
      daily: {},
      monthNames: MONTH_NAMES_JA,
      recentDaysCount: 7,
      totalWeeks: 46,
    });
    // every cell resolves to level 0 via getExpLevel(0, 0)
    for (const week of layout.weeks) {
      for (const date of week) {
        if (date === null) continue;
        const amount = 0; // daily is empty
        expect(getExpLevel(amount, layout.maxAmount)).toBe(0);
      }
    }
  });

  it('startDate is Sunday-aligned in JST and exactly (weeks*7 - 1) days before endDate', () => {
    // 2026-04-10T20:00:00Z === 05:00 JST 2026-04-11 (Saturday JST)
    const now = new Date('2026-04-10T20:00:00Z');
    const layout = buildHeatmapLayout({
      now,
      daily: {},
      monthNames: MONTH_NAMES_JA,
      recentDaysCount: 7,
      totalWeeks: 46,
    });
    expect(layout.endDate).toBe('2026-04-11');

    // startDate parsed as local midnight: the resulting Date's day-of-week should be 0 (Sunday)
    const [sy, sm, sd] = layout.startDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    expect(start.getDay()).toBe(0);

    const [ey, em, ed] = layout.endDate.split('-').map(Number);
    const end = new Date(ey, em - 1, ed);
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(46 * 7 - 1);
  });

  it('produces exactly totalWeeks * 7 grid slots with strictly increasing flat dates', () => {
    const now = new Date('2026-04-10T03:00:00Z');
    for (const totalWeeks of [1, 4, 46, 52] as const) {
      const layout = buildHeatmapLayout({
        now,
        daily: {},
        monthNames: MONTH_NAMES_JA,
        recentDaysCount: 7,
        totalWeeks,
      });
      expect(layout.weeks).toHaveLength(totalWeeks);
      for (const week of layout.weeks) {
        expect(week).toHaveLength(7);
      }
      const flat = layout.weeks.flat().filter((d): d is string => d !== null);
      // All dates ISO and strictly increasing
      for (let i = 1; i < flat.length; i++) {
        expect(flat[i] > flat[i - 1]).toBe(true);
        expect(flat[i]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it('aggregates maxAmount as the largest value in daily', () => {
    const now = new Date('2026-04-10T03:00:00Z');
    const layout = buildHeatmapLayout({
      now,
      daily: { '2026-04-08': 42, '2026-04-09': 1000, '2026-04-10': 7 },
      monthNames: MONTH_NAMES_JA,
      recentDaysCount: 7,
      totalWeeks: 46,
    });
    expect(layout.maxAmount).toBe(1000);
  });
});

describe('getJstTodayDate — additional edge cases', () => {
  it('handles end-of-month rollover (2026-02-28T15:00:00Z → 2026-03-01 JST)', () => {
    const now = new Date('2026-02-28T15:00:00Z');
    expect(formatDate(getJstTodayDate(now))).toBe('2026-03-01');
  });

  it('handles leap year Feb 28 → Feb 29 rollover (2024-02-28T15:00:00Z → 2024-02-29 JST)', () => {
    const now = new Date('2024-02-28T15:00:00Z');
    expect(formatDate(getJstTodayDate(now))).toBe('2024-02-29');
  });

  it('handles leap year Feb 29 → Mar 1 rollover (2024-02-29T15:00:00Z → 2024-03-01 JST)', () => {
    const now = new Date('2024-02-29T15:00:00Z');
    expect(formatDate(getJstTodayDate(now))).toBe('2024-03-01');
  });

  it('has no DST-style drift in late March (JST is fixed UTC+9)', () => {
    // Late March — a period where some zones shift for DST; JST never does.
    // 2026-03-29T15:00:00Z → 2026-03-30 00:00 JST
    const now = new Date('2026-03-29T15:00:00Z');
    expect(formatDate(getJstTodayDate(now))).toBe('2026-03-30');
  });

  it('year rollover: 2026-12-31T15:00:00Z → 2027-01-01 JST', () => {
    const now = new Date('2026-12-31T15:00:00Z');
    expect(formatDate(getJstTodayDate(now))).toBe('2027-01-01');
  });
});

describe('getExpLevel — quartile boundary invariants', () => {
  it('maxAmount=0: every amount maps to level 0', () => {
    for (const a of [0, 1, 50, 1000]) {
      expect(getExpLevel(a, 0)).toBe(0);
    }
  });

  it('maxAmount=1: 1 is level 4, 0 is level 0', () => {
    expect(getExpLevel(0, 1)).toBe(0);
    expect(getExpLevel(1, 1)).toBe(4);
  });

  it('maxAmount=4: each integer 1..4 maps to monotonic non-zero levels', () => {
    const levels = [1, 2, 3, 4].map((a) => getExpLevel(a, 4));
    // Monotonic non-decreasing, all in [1,4]
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]).toBeGreaterThanOrEqual(levels[i - 1]);
    }
    for (const l of levels) {
      expect(l).toBeGreaterThanOrEqual(1);
      expect(l).toBeLessThanOrEqual(4);
    }
    // amount === maxAmount is always 4
    expect(levels[3]).toBe(4);
  });

  it('maxAmount=100: 24→1, 25→1, 50→2, 75→3, 100→4 (boundary spec)', () => {
    expect(getExpLevel(24, 100)).toBe(1);
    expect(getExpLevel(25, 100)).toBe(1);
    expect(getExpLevel(50, 100)).toBe(2);
    expect(getExpLevel(75, 100)).toBe(3);
    expect(getExpLevel(100, 100)).toBe(4);
  });

  it('monotonic: for fixed maxAmount, level is non-decreasing in amount', () => {
    const max = 200;
    let prev = 0;
    for (let a = 0; a <= max; a += 5) {
      const lv = getExpLevel(a, max);
      expect(lv).toBeGreaterThanOrEqual(prev);
      expect(lv).toBeGreaterThanOrEqual(0);
      expect(lv).toBeLessThanOrEqual(4);
      prev = lv;
    }
  });
});
