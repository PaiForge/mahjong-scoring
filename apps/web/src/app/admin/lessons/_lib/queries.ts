import "server-only";

import { and, gte, lt, sql } from "drizzle-orm";

import { db, lessonCompletions } from "@/lib/db";

/** レッスン 1 つ分の完了数 */
export interface LessonCompletionCountRow {
  readonly lessonSlug: string;
  /** 累計の完了数（= 完了した人数） */
  readonly total: number;
  /** 期間内の完了数 */
  readonly inPeriod: number;
}

/** レッスンの完了数と、完了したユーザー数 */
export interface LessonCompletionCounts {
  readonly rows: readonly LessonCompletionCountRow[];
  /** 1 つ以上レッスンを完了したユーザー数（累計） */
  readonly learners: number;
  /** 期間内に 1 つ以上完了したユーザー数 */
  readonly learnersInPeriod: number;
}

/**
 * レッスンごとの完了数（累計・期間内）と、完了したユーザー数（累計・期間内）を数える
 * レッスン完了数集計
 *
 * @description
 * `lesson_completions` は 1 人 1 レッスン 1 行（主キー `(user_id, lesson_slug)`）なので、
 * レッスンごとの行数がそのまま完了した人数になる。レジストリに無い slug（廃止した
 * レッスン等）の行もそのまま返し、表に並べるかは呼び出し側（`buildLessonStats`）が決める。
 *
 * @design 集計は DB に任せる
 * `GROUP BY lesson_slug` で `count(*)` と `count(*) FILTER (WHERE completed_at が期間内)`
 * を取る 1 クエリと、`count(DISTINCT user_id)` の累計・期間内を取る 1 クエリを並べて
 * 投げる。行を全部取ってアプリで数える方式（ダッシュボードの新規ユーザーは
 * Supabase Admin API の制約でそうしている）は、DB に集計させられるこの表では要らない。
 * 全表走査になるが、行数は「ユーザー数 × レッスン数」で小さい。インデックスも
 * マイグレーションも足さない — 実測の無い最適化はしない（既知のトレードオフ）。
 * `count` は `::int` で整数にする（付けないと pg が bigint を文字列で返す）。期間の端は
 * バインド変数として渡し、SQL に文字列で連結しない。
 *
 * @design 管理者・BAN 済み・開発用のアカウントも数に含める
 * 除外には profiles / user_roles との結合が要り、数への影響は小さい。含めたままにして、
 * 一覧の数と DB の行数が一致する方が調べやすい（画面の説明文には書かない）。
 *
 * 失敗は握りつぶさず throw のまま返す。管理画面で「0 件」と「取得失敗」を取り違えないため。
 *
 * @param range - 期間内として数える半開区間 `[from, toExclusive)`
 */
export async function fetchLessonCompletionCounts(range: {
  readonly from: Date;
  readonly toExclusive: Date;
}): Promise<LessonCompletionCounts> {
  // 期間の端は列の演算子（gte / lt）で束ねる。列のエンコーダが Date を ISO 文字列の
  // バインド変数にする。素の sql テンプレートに Date を置くと、drizzle の postgres-js
  // ドライバが timestamptz の serializer を素通しに差し替えているため、Date のまま
  // ドライバへ渡って送信時に落ちる。
  const inPeriod = and(
    gte(lessonCompletions.completedAt, range.from),
    lt(lessonCompletions.completedAt, range.toExclusive),
  );

  const [rows, learnerRows] = await Promise.all([
    db
      .select({
        lessonSlug: lessonCompletions.lessonSlug,
        total: sql<number>`count(*)::int`,
        inPeriod: sql<number>`(count(*) filter (where ${inPeriod}))::int`,
      })
      .from(lessonCompletions)
      .groupBy(lessonCompletions.lessonSlug),
    db
      .select({
        learners: sql<number>`count(distinct ${lessonCompletions.userId})::int`,
        learnersInPeriod: sql<number>`(count(distinct ${lessonCompletions.userId}) filter (where ${inPeriod}))::int`,
      })
      .from(lessonCompletions),
  ]);

  const [learnerRow] = learnerRows;
  return {
    rows: rows.map((row) => ({
      lessonSlug: row.lessonSlug,
      total: row.total,
      inPeriod: row.inPeriod,
    })),
    learners: learnerRow?.learners ?? 0,
    learnersInPeriod: learnerRow?.learnersInPeriod ?? 0,
  };
}
