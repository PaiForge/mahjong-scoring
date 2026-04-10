import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGte, mockLte } = vi.hoisted(() => ({
  mockGte: vi.fn(),
  mockLte: vi.fn(),
}));

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    gte: (...args: unknown[]) => {
      mockGte(...args);
      return { __kind: 'gte', args };
    },
    lte: (...args: unknown[]) => {
      mockLte(...args);
      return { __kind: 'lte', args };
    },
  };
});

vi.mock('next/cache', () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T): T => fn,
  revalidateTag: vi.fn(),
}));

vi.mock('../index', () => {
  const mockDb = {
    select: vi.fn(),
  };
  return {
    db: mockDb,
  };
});

vi.mock('../schema', () => ({
  expEvents: {
    userId: 'exp_events.user_id',
    amount: 'exp_events.amount',
    createdAt: 'exp_events.created_at',
    menuType: 'exp_events.menu_type',
  },
}));

import { db } from '../index';
import { expHeatmapCacheTag, getExpHeatmapData } from '../get-exp-heatmap-data';

const mockDb = vi.mocked(db);

describe('expHeatmapCacheTag', () => {
  it('returns a per-user tag', () => {
    expect(expHeatmapCacheTag('user-123')).toBe('exp-heatmap:user-123');
  });

  it('differs per user', () => {
    expect(expHeatmapCacheTag('a')).not.toBe(expHeatmapCacheTag('b'));
  });
});

describe('getExpHeatmapData', () => {
  const mockGroupBy = vi.fn();
  const mockWhere = vi.fn();
  const mockFrom = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    const dailyGroupBy = vi.fn().mockResolvedValue([
      { date: '2026-04-01', total: '150' },
      { date: '2026-04-02', total: '75' },
    ]);
    const moduleGroupBy = vi.fn().mockResolvedValue([
      { date: '2026-04-01', menuType: 'jantou_fu', total: '100' },
      { date: '2026-04-01', menuType: 'machi_fu', total: '50' },
      { date: '2026-04-02', menuType: 'jantou_fu', total: '75' },
    ]);

    let callCount = 0;
    mockGroupBy.mockImplementation((...args) => {
      callCount++;
      if (callCount <= 1) return dailyGroupBy(...args);
      return moduleGroupBy(...args);
    });
    mockWhere.mockReturnValue({ groupBy: mockGroupBy });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockDb.select.mockReturnValue({ from: mockFrom } as never);
  });

  it('returns daily totals and module breakdowns', async () => {
    const result = await getExpHeatmapData('user-123');

    expect(result.daily).toEqual({
      '2026-04-01': 150,
      '2026-04-02': 75,
    });
    expect(result.dailyByModule).toEqual({
      '2026-04-01': { jantou_fu: 100, machi_fu: 50 },
      '2026-04-02': { jantou_fu: 75 },
    });
  });

  it('calls db.select twice (daily + module)', async () => {
    await getExpHeatmapData('user-123');

    expect(mockDb.select).toHaveBeenCalledTimes(2);
    expect(mockFrom).toHaveBeenCalledTimes(2);
    expect(mockWhere).toHaveBeenCalledTimes(2);
    expect(mockGroupBy).toHaveBeenCalledTimes(2);
  });

  it('returns empty objects when no data exists', async () => {
    mockGroupBy.mockReset();
    mockGroupBy.mockResolvedValue([]);

    const result = await getExpHeatmapData('user-123');

    expect(result.daily).toEqual({});
    expect(result.dailyByModule).toEqual({});
  });

  it('handles null total gracefully', async () => {
    mockGroupBy.mockReset();
    mockGroupBy
      .mockResolvedValueOnce([{ date: '2026-04-01', total: null }])
      .mockResolvedValueOnce([{ date: '2026-04-01', menuType: 'jantou_fu', total: null }]);

    const result = await getExpHeatmapData('user-123');

    expect(result.daily).toEqual({ '2026-04-01': 0 });
    expect(result.dailyByModule).toEqual({ '2026-04-01': { jantou_fu: 0 } });
  });

  it('handles null menuType as "unknown"', async () => {
    mockGroupBy.mockReset();
    mockGroupBy
      .mockResolvedValueOnce([{ date: '2026-04-01', total: '100' }])
      .mockResolvedValueOnce([{ date: '2026-04-01', menuType: null, total: '100' }]);

    const result = await getExpHeatmapData('user-123');

    expect(result.dailyByModule).toEqual({ '2026-04-01': { unknown: 100 } });
  });

  it('propagates database errors', async () => {
    mockGroupBy.mockReset();
    mockGroupBy.mockRejectedValue(new Error('Connection refused'));

    await expect(getExpHeatmapData('user-123')).rejects.toThrow('Connection refused');
  });

  it('handles non-string date by formatting it', async () => {
    mockGroupBy.mockReset();
    mockGroupBy
      .mockResolvedValueOnce([{ date: new Date('2026-04-01T00:00:00Z'), total: '50' }])
      .mockResolvedValueOnce([]);

    const result = await getExpHeatmapData('user-123');

    expect(result.daily).toEqual({ '2026-04-01': 50 });
  });

  it('executes both queries via Promise.all (parallel execution)', async () => {
    mockGroupBy.mockReset();
    const callOrder: string[] = [];

    mockGroupBy
      .mockImplementationOnce(() => {
        callOrder.push('daily-start');
        return Promise.resolve([{ date: '2026-04-01', total: '50' }]).then((r) => {
          callOrder.push('daily-end');
          return r;
        });
      })
      .mockImplementationOnce(() => {
        callOrder.push('module-start');
        return Promise.resolve([]).then((r) => {
          callOrder.push('module-end');
          return r;
        });
      });

    await getExpHeatmapData('user-123');

    expect(callOrder[0]).toBe('daily-start');
    expect(callOrder[1]).toBe('module-start');
  });

  it('aggregates multiple modules for the same date', async () => {
    mockGroupBy.mockReset();
    mockGroupBy
      .mockResolvedValueOnce([{ date: '2026-04-01', total: '300' }])
      .mockResolvedValueOnce([
        { date: '2026-04-01', menuType: 'jantou_fu', total: '100' },
        { date: '2026-04-01', menuType: 'machi_fu', total: '120' },
        { date: '2026-04-01', menuType: 'yaku', total: '80' },
      ]);

    const result = await getExpHeatmapData('user-123');

    expect(result.dailyByModule['2026-04-01']).toEqual({
      jantou_fu: 100,
      machi_fu: 120,
      yaku: 80,
    });
  });

  // Note on the TZ-boundary test:
  // The SQL expression `DATE(created_at AT TIME ZONE 'Asia/Tokyo')` is evaluated
  // inside Postgres, not JS; the mock layer just returns whatever date string the
  // DB would produce. We therefore verify that the function faithfully propagates
  // that date string through the output (i.e. a row tagged '2026-01-02' by the
  // DB — which is what Postgres returns for a 2026-01-01T23:30:00Z event in JST —
  // becomes the '2026-01-02' key on the client).
  it('propagates the DB-grouped JST date faithfully (TZ boundary)', async () => {
    mockGroupBy.mockReset();
    mockGroupBy
      .mockResolvedValueOnce([{ date: '2026-01-02', total: '42' }])
      .mockResolvedValueOnce([{ date: '2026-01-02', menuType: 'jantou_fu', total: '42' }]);

    const result = await getExpHeatmapData('user-123');

    expect(result.daily).toEqual({ '2026-01-02': 42 });
    expect(result.dailyByModule).toEqual({ '2026-01-02': { jantou_fu: 42 } });
  });

  describe('JST query bounds (regression: Reviewer-found UTC drift bug)', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('binds gte to start-of-JST-day 00:00+09:00 and lte to end-of-JST-day 23:59:59.999+09:00', async () => {
      // Mid-day JST (UTC 03:00 = 12:00 JST) → today = 2026-04-10
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-10T03:00:00Z'));
      mockGte.mockClear();
      mockLte.mockClear();
      mockGroupBy.mockReset();
      mockGroupBy.mockResolvedValue([]);

      await getExpHeatmapData('user-123');

      // Both queries each pass gte+lte once => 2 gte, 2 lte calls (same values)
      expect(mockGte).toHaveBeenCalled();
      expect(mockLte).toHaveBeenCalled();

      const gteArg = mockGte.mock.calls[0][1] as Date;
      const lteArg = mockLte.mock.calls[0][1] as Date;
      expect(gteArg).toBeInstanceOf(Date);
      expect(lteArg).toBeInstanceOf(Date);

      // endDate must be JST 2026-04-10 23:59:59.999+09:00
      expect(lteArg.toISOString()).toBe('2026-04-10T14:59:59.999Z');

      // startDate must be a Sunday at 00:00+09:00 JST, (46*7-1)=321 days back from endDate.
      // 2026-04-10 is a Friday JST; current-week Sunday is 2026-04-05; 45 weeks earlier = 2025-05-25 (Sunday)
      expect(gteArg.toISOString()).toBe('2025-05-24T15:00:00.000Z');

      // The span between start-of-day and end-of-day is an integer number
      // of days minus 1 ms. For a Friday JST endDate (Apr 10 2026) with 46 weeks,
      // there are 45 full weeks (315 days) + (dayOfWeek Friday = 5 days past Sunday) + 1 = 321 days.
      const spanMs = lteArg.getTime() - gteArg.getTime();
      const DAY_MS = 24 * 60 * 60 * 1000;
      expect(spanMs % DAY_MS).toBe(DAY_MS - 1); // ends on 23:59:59.999
      expect((spanMs + 1) / DAY_MS).toBe(321);
    });

    it('rolls the query window into the next JST day when UTC is still on the prior day', async () => {
      // 2026-01-01T20:00:00Z = 2026-01-02 05:00 JST. A naive UTC-local calc would
      // place endDate at 2026-01-01; the fix must yield 2026-01-02.
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T20:00:00Z'));
      mockGte.mockClear();
      mockLte.mockClear();
      mockGroupBy.mockReset();
      mockGroupBy.mockResolvedValue([]);

      await getExpHeatmapData('user-123');

      const lteArg = mockLte.mock.calls[0][1] as Date;
      // JST end-of-day for 2026-01-02
      expect(lteArg.toISOString()).toBe('2026-01-02T14:59:59.999Z');
    });

    it('passes identical bounds to both daily and module queries', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-10T03:00:00Z'));
      mockGte.mockClear();
      mockLte.mockClear();
      mockGroupBy.mockReset();
      mockGroupBy.mockResolvedValue([]);

      await getExpHeatmapData('user-123');

      // whereClause is built once in fetchExpHeatmapData, so gte/lte are called once each.
      // Both db.select() calls receive the same whereClause object.
      expect(mockGte).toHaveBeenCalledTimes(1);
      expect(mockLte).toHaveBeenCalledTimes(1);
    });
  });
});
