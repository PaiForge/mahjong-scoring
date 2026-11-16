import "server-only";

import { and, gte, lt, sql } from "drizzle-orm";

import { challengeResults, db } from "@/lib/db";

/** 練習 1 つ分のチャレンジの回数と挑戦者数 */
export interface ChallengeCountRow {
  /** `challenge_results.menu_type` の生の値（レジストリに無い値もそのまま） */
  readonly menuType: string;
  /** 累計の回数 */
  readonly total: number;
  /** 期間内の回数 */
  readonly inPeriod: number;
  /** 期間内に 1 回以上挑戦したユーザー数 */
  readonly challengersInPeriod: number;
}

/** 練習ごとの回数と、挑戦したユーザー数 */
export interface ChallengeCounts {
  readonly rows: readonly ChallengeCountRow[];
  /** 1 回以上チャレンジしたユーザー数（累計） */
  readonly challengers: number;
  /** 期間内に 1 回以上チャレンジしたユーザー数 */
  readonly challengersInPeriod: number;
}

/**
 * 練習ごとのチャレンジの回数（累計・期間内）・期間内の挑戦者数と、
 * チャレンジしたユーザー数（累計・期間内）を数える
 * チャレンジ実施数集計
 *
 * @description
 * 数えるのは `challenge_results`（記録の残るチャレンジ 1 回 = 1 行の追記ログ）。
 * トレーニング・模試・無限訓練（`agari-score` / `tenpai-score`）は記録を残さず、
 * 昇級試験も合否だけを判定して記録を残さないので、どれもこの表には入らない。
 * 「練習がどれだけ使われているか」の全体ではなく「記録の残る挑戦」の数として読む。
 * レジストリに無い menu_type（廃止した練習等）の行もそのまま返し、表に並べるかは
 * 呼び出し側（`buildChallengeStats`）が決める。
 *
 * @design バリアント（`leaderboard_key`）で分けず menu_type でまとめる
 * 問いは「どの練習が挑戦されているか」で、範囲の選ばれ方ではない。バリアントで
 * 分けると練習ごとの行が散り、0 件の土俵の行も増える。バリアント別の内訳が
 * 要るようになったら、`GROUP BY menu_type, leaderboard_key` の別の集計として足す。
 *
 * @design 集計は DB に任せる
 * `GROUP BY menu_type` で `count(*)`・期間内の `count(*) FILTER`・期間内の
 * `count(DISTINCT user_id) FILTER` を取る 1 クエリと、全体の `count(DISTINCT user_id)`
 * の累計・期間内を取る 1 クエリを並べて投げる。練習ごとの挑戦者数を足しても
 * 全体の挑戦者数にはならない（複数の練習に挑戦した人を重複して数える）ので、
 * 全体は別のクエリで数える。全表走査になりうるが、インデックスもマイグレーションも
 * 足さない — 実測の無い最適化はしない（既知のトレードオフ）。`count` は `::int` で
 * 整数にする（付けないと pg が bigint を文字列で返す）。期間の端はバインド変数として
 * 渡し、SQL に文字列で連結しない。
 *
 * @design 管理者・BAN 済み・開発用のアカウントも数に含める
 * 除外には profiles / user_roles との結合が要り、数への影響は小さい。含めたままにして、
 * 表の数と DB の行数が一致する方が調べやすい（レッスンの完了状況と同じ方針）。
 *
 * 失敗は握りつぶさず throw のまま返す。管理画面で「0 件」と「取得失敗」を取り違えないため。
 *
 * @param range - 期間内として数える半開区間 `[from, toExclusive)`
 */
export async function fetchChallengeCounts(range: {
  readonly from: Date;
  readonly toExclusive: Date;
}): Promise<ChallengeCounts> {
  // 期間の端は列の演算子（gte / lt）で束ねる。列のエンコーダが Date を ISO 文字列の
  // バインド変数にする。素の sql テンプレートに Date を置くと、drizzle の postgres-js
  // ドライバが timestamptz の serializer を素通しに差し替えているため、Date のまま
  // ドライバへ渡って送信時に落ちる。
  const inPeriod = and(
    gte(challengeResults.createdAt, range.from),
    lt(challengeResults.createdAt, range.toExclusive),
  );

  const [rows, challengerRows] = await Promise.all([
    db
      .select({
        menuType: challengeResults.menuType,
        total: sql<number>`count(*)::int`,
        inPeriod: sql<number>`(count(*) filter (where ${inPeriod}))::int`,
        challengersInPeriod: sql<number>`(count(distinct ${challengeResults.userId}) filter (where ${inPeriod}))::int`,
      })
      .from(challengeResults)
      .groupBy(challengeResults.menuType),
    db
      .select({
        challengers: sql<number>`count(distinct ${challengeResults.userId})::int`,
        challengersInPeriod: sql<number>`(count(distinct ${challengeResults.userId}) filter (where ${inPeriod}))::int`,
      })
      .from(challengeResults),
  ]);

  const [challengerRow] = challengerRows;
  return {
    rows: rows.map((row) => ({
      menuType: row.menuType,
      total: row.total,
      inPeriod: row.inPeriod,
      challengersInPeriod: row.challengersInPeriod,
    })),
    challengers: challengerRow?.challengers ?? 0,
    challengersInPeriod: challengerRow?.challengersInPeriod ?? 0,
  };
}
