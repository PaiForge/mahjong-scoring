/**
 * EXP ヒートマップ用データ取得
 * 経験値ヒートマップデータ取得
 *
 * @description
 *   マイページのアクティビティヒートマップで使用する、日次 EXP 合計と
 *   ドリル種別ごとの内訳を並列クエリで取得する。日付境界は JST (Asia/Tokyo) 固定。
 *
 * @see apps/web/src/app/(user)/(protected)/(confirmed)/mypage/_components/exp-activity-heatmap.tsx
 */
import { and, eq, gte, lte, sql, sum } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

import {
  DESKTOP_WEEKS,
  formatDate,
  getHeatmapDateRangeForWeeks,
  getJstTodayDate,
} from '@/app/(user)/(protected)/(confirmed)/mypage/_lib/heatmap-utils';

import { db } from './index';
import { expEvents } from './schema';

export interface ExpHeatmapData {
  /** 'YYYY-MM-DD' をキーにした日次 EXP 合計 */
  readonly daily: Record<string, number>;
  /** 日付 → menuType → EXP 合計のネスト構造 */
  readonly dailyByModule: Record<string, Record<string, number>>;
}

/** ヒートマップキャッシュの per-user タグ名を返す。 */
export function expHeatmapCacheTag(userId: string): string {
  return `exp-heatmap:${userId}`;
}

const HEATMAP_CACHE_TTL_SECONDS = 60;

/**
 * ユーザーのヒートマップデータを取得する（内部実装、キャッシュなし）。
 *
 * `idx_exp_events_user_created(user_id, created_at)` をレンジスキャンで活用する。
 * 日次グループ化は JST (Asia/Tokyo) で行うため、日本時間 0 時を日付境界として扱える。
 */
async function fetchExpHeatmapData(userId: string): Promise<ExpHeatmapData> {
  const jstToday = getJstTodayDate(new Date());
  const { startDate, endDate } = getHeatmapDateRangeForWeeks(jstToday, DESKTOP_WEEKS);

  // startDate / endDate は JST の年月日を表すローカル TZ Date。
  // クエリ境界は「JST 00:00 〜 JST 23:59:59.999」を表す絶対 UTC 瞬間として組み立てる必要がある。
  // ISO 8601 の `+09:00` オフセット付き文字列を経由して確定させる。
  const startInstant = new Date(`${formatDate(startDate)}T00:00:00+09:00`);
  const endInstant = new Date(`${formatDate(endDate)}T23:59:59.999+09:00`);

  const whereClause = and(
    eq(expEvents.userId, userId),
    gte(expEvents.createdAt, startInstant),
    lte(expEvents.createdAt, endInstant),
  );

  const dateExpr = sql<string>`DATE(${expEvents.createdAt} AT TIME ZONE 'Asia/Tokyo')`;

  const [dailyRows, moduleRows] = await Promise.all([
    db
      .select({
        date: dateExpr.as('date'),
        total: sum(expEvents.amount).as('total'),
      })
      .from(expEvents)
      .where(whereClause)
      .groupBy(dateExpr),
    db
      .select({
        date: dateExpr.as('date'),
        menuType: expEvents.menuType,
        total: sum(expEvents.amount).as('total'),
      })
      .from(expEvents)
      .where(whereClause)
      .groupBy(dateExpr, expEvents.menuType),
  ]);

  const daily: Record<string, number> = {};
  for (const row of dailyRows) {
    const dateStr = typeof row.date === 'string' ? row.date : formatDate(new Date(row.date));
    daily[dateStr] = Number(row.total) || 0;
  }

  const dailyByModule: Record<string, Record<string, number>> = {};
  for (const row of moduleRows) {
    const dateStr = typeof row.date === 'string' ? row.date : formatDate(new Date(row.date));
    const moduleKey = row.menuType ?? 'unknown';
    if (!dailyByModule[dateStr]) {
      dailyByModule[dateStr] = {};
    }
    dailyByModule[dateStr][moduleKey] = Number(row.total) || 0;
  }

  return { daily, dailyByModule };
}

/**
 * キャッシュ付きのヒートマップデータ取得エントリポイント。
 *
 * `unstable_cache` で per-user タグを付与しているため、
 * 新しい EXP 付与時は `save-challenge-result.ts` 側で `revalidateTag` を呼ぶ。
 * TTL は防御的に 60 秒とし、`revalidateTag` が失敗しても極端に古い値が残らないようにする。
 */
export async function getExpHeatmapData(userId: string): Promise<ExpHeatmapData> {
  const cached = unstable_cache(
    (uid: string) => fetchExpHeatmapData(uid),
    ['exp-heatmap-data', userId],
    {
      tags: [expHeatmapCacheTag(userId)],
      revalidate: HEATMAP_CACHE_TTL_SECONDS,
    },
  );
  return cached(userId);
}
