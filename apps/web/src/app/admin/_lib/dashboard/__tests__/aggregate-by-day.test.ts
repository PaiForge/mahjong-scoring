import { describe, expect, it } from 'vitest';

import { aggregateByDay, fillDateRange } from '../aggregate-by-day';

describe('aggregateByDay', () => {
  const range = { startDate: '2026-06-01', endDate: '2026-06-03' };

  it('範囲内の全日を 0 件込みで埋め、合計を返す', () => {
    const items = [
      { created_at: '2026-06-01T10:00:00Z' },
      { created_at: '2026-06-01T23:59:00Z' },
      { created_at: '2026-06-03T00:00:00Z' },
    ];

    const { daily, total } = aggregateByDay(items, (i) => i.created_at, range);

    expect(daily).toEqual([
      { date: '2026-06-01', count: 2 },
      { date: '2026-06-02', count: 0 },
      { date: '2026-06-03', count: 1 },
    ]);
    expect(total).toBe(3);
  });

  it('範囲外のアイテムを除外する', () => {
    const items = [
      { created_at: '2026-05-31T23:59:59Z' }, // 範囲前
      { created_at: '2026-06-02T12:00:00Z' }, // 範囲内
      { created_at: '2026-06-04T00:00:00Z' }, // 範囲後
    ];

    const { daily, total } = aggregateByDay(items, (i) => i.created_at, range);

    expect(total).toBe(1);
    expect(daily.find((d) => d.date === '2026-06-02')?.count).toBe(1);
  });

  it('Date オブジェクトの日付抽出も扱える', () => {
    const items = [{ created: new Date('2026-06-02T08:00:00Z') }];

    const { total } = aggregateByDay(items, (i) => i.created, range);

    expect(total).toBe(1);
  });

  it('空入力では全日 0 件・合計 0 を返す', () => {
    const { daily, total } = aggregateByDay([], (i: { created_at: string }) => i.created_at, range);

    expect(daily).toEqual([
      { date: '2026-06-01', count: 0 },
      { date: '2026-06-02', count: 0 },
      { date: '2026-06-03', count: 0 },
    ]);
    expect(total).toBe(0);
  });
});

describe('fillDateRange', () => {
  it('カウント Map から範囲内の連続した日を生成する', () => {
    const counts = new Map([['2026-06-02', 5]]);

    const result = fillDateRange('2026-06-01', '2026-06-03', counts);

    expect(result).toEqual([
      { date: '2026-06-01', count: 0 },
      { date: '2026-06-02', count: 5 },
      { date: '2026-06-03', count: 0 },
    ]);
  });

  it('開始日と終了日が同じ場合は 1 日のみ返す', () => {
    const result = fillDateRange('2026-06-01', '2026-06-01', new Map());

    expect(result).toEqual([{ date: '2026-06-01', count: 0 }]);
  });
});
