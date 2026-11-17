/**
 * 保存した問題（`practice_problems`）の集計
 * 問題保存集計
 *
 * @description
 * 和了形・聴牌形の点数計算（`agari-score` / `tenpai-score`）で出題し、保存した
 * 問題の行を数える。この表は同じ盤面を 1 行にまとめ（同一性の規約でまとめる）、
 * 送信は取りこぼしを許し、同じ盤面を保存し直しても `created_at` は最初に保存した
 * 日時のまま変わらない。そのため数えるのは **保存された異なる盤面の数** で、
 * 出題した回数でも出題の分布でもない。「期間内」は `created_at`（その盤面が初めて
 * 保存された日時）が期間に入る行を指す。
 *
 * 保存者（ユーザー ID）を表に持たないので、管理者・開発用アカウントに出した
 * 問題も数に入る（除く手段が無い）。同じ理由で利用者ごとの数・正答率も出せない。
 *
 * @design 集計は DB に任せ、軸の違う 3 クエリを並べて投げる
 * (a) `GROUP BY kind, source` で累計・期間内・最終保存日時、(b) 期間内の JST 日ごとの
 * 件数、(c) `GROUP BY kind` で盤面の内訳。行を全部取ってアプリで数える方式は、
 * 行数に上限が無いこの表（検証を通る盤面は事実上限りが無く、同じ盤面をまとめても
 * 行数の上限にはならない）では採れない。1 クエリにまとめる案は GROUP BY の軸が
 * 違うので採らない。ページは 3 関数を `Promise.all` で並べて呼ぶ。
 *
 * @design インデックスもマイグレーションも足さない（既知のトレードオフ）
 * どのクエリも全表走査になる。管理者がページを開いたときだけ走る集計で、遅さの
 * 実測も無い。遅くなったら `created_at` のインデックスを測ってから足す。
 *
 * `count` は `::int` で整数にする（付けないと pg が bigint を文字列で返す）。値は
 * バインド変数で渡し、SQL に文字列で連結しない。失敗は握りつぶさず throw のまま
 * 返す — 管理画面で「0 件」と「取得失敗」を取り違えないため。
 */
import "server-only";

import { and, gte, lt, max, sql } from "drizzle-orm";

import {
  fillDateRange,
  type DailyCount,
} from "@/app/admin/_lib/dashboard/aggregate-by-day";
import type { JstDateRange } from "@/app/admin/_lib/date-range";
import { db, practiceProblems } from "@/lib/db";
import { HaiKind } from "@mahjong-scoring/core";

/** 種別 × 由来 1 組の保存数 */
export interface PracticeProblemCountRow {
  /** DB の生の値（定数に無い値もそのまま返す） */
  readonly kind: string;
  /** DB の生の値（定数に無い値もそのまま返す） */
  readonly source: string;
  /** 累計 */
  readonly total: number;
  /** `created_at` が期間内 */
  readonly inPeriod: number;
  /** その組で最後に保存された日時（`max(created_at)`） */
  readonly lastSavedAt: Date | null;
}

/** 種別ごとの盤面の内訳（累計） */
export interface PracticeProblemCompositionRow {
  readonly kind: string;
  readonly total: number;
  /** リーチしている */
  readonly riichi: number;
  /** 暗槓以外の副露が 1 つ以上 */
  readonly furo: number;
  /** `isTsumo` が true（聴牌形は常に 0。表示側で「—」にする） */
  readonly tsumo: number;
  /** 自風（`jikaze`）が東 */
  readonly oya: number;
}

/**
 * `created_at` が半開区間 `[from, toExclusive)` に入るかの条件
 *
 * 期間の端は列の演算子（gte / lt）で束ねる。列のエンコーダが Date を ISO 文字列の
 * バインド変数にする。素の sql テンプレートに Date を置くと、drizzle の postgres-js
 * ドライバが timestamptz の serializer を素通しに差し替えているため、Date のまま
 * ドライバへ渡って送信時に落ちる。
 */
function createdInPeriod(range: {
  readonly from: Date;
  readonly toExclusive: Date;
}) {
  return and(
    gte(practiceProblems.createdAt, range.from),
    lt(practiceProblems.createdAt, range.toExclusive),
  );
}

/**
 * 種別 × 由来ごとの保存数（累計・期間内）と最終保存日時を数える
 * 問題保存数集計
 *
 * @description
 * `GROUP BY kind, source` の 1 クエリ。DB に行がある組だけを返し、定数に無い値の組も
 * そのまま返す（表に並べるかは `buildPracticeProblemStats` が決める）。
 *
 * @design 最終保存日時は列のデコーダを通して Date で受ける
 * 素の `sql<Date>` で `max(created_at)` を取るとドライバが文字列のまま返すので、
 * drizzle-orm の `max(列)` を使う（列のデコーダが効く）。
 *
 * @param range - 期間内として数える半開区間 `[from, toExclusive)`
 */
export async function fetchPracticeProblemCounts(range: {
  readonly from: Date;
  readonly toExclusive: Date;
}): Promise<readonly PracticeProblemCountRow[]> {
  const inPeriod = createdInPeriod(range);
  const rows = await db
    .select({
      kind: practiceProblems.kind,
      source: practiceProblems.source,
      total: sql<number>`count(*)::int`,
      inPeriod: sql<number>`(count(*) filter (where ${inPeriod}))::int`,
      lastSavedAt: max(practiceProblems.createdAt),
    })
    .from(practiceProblems)
    .groupBy(practiceProblems.kind, practiceProblems.source);

  return rows.map((row) => ({
    kind: row.kind,
    source: row.source,
    total: row.total,
    inPeriod: row.inPeriod,
    lastSavedAt: row.lastSavedAt,
  }));
}

/**
 * 期間内の JST の日ごとの新規保存数を数える（0 件の日も埋める）
 * 問題保存日次集計
 *
 * @design 日ごとの束ねは SQL で JST の日付キーにする
 * `to_char(created_at AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM-DD')` で束ね、0 件の日は
 * `fillDateRange` で埋める。行を全部受け取って束ねる既存の `aggregateByDay` は、
 * 行数に上限の無いこの表では使えない。JST は夏時間が無く、この日付キーはアプリの
 * 日付境界（features の `jst`）と一致する。日付の式は 1 つの値を select と
 * groupBy の両方に渡す（式がずれると GROUP BY のエラーになる）。
 *
 * @param range - 期間（`from` / `toExclusive` で絞り、`startDate`〜`endDate` を埋める）
 */
export async function fetchPracticeProblemDailyCounts(
  range: JstDateRange,
): Promise<readonly DailyCount[]> {
  const day = sql<string>`to_char(${practiceProblems.createdAt} AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM-DD')`;
  const rows = await db
    .select({ day, count: sql<number>`count(*)::int` })
    .from(practiceProblems)
    .where(createdInPeriod(range))
    .groupBy(day);

  const countsByDate = new Map(rows.map((row) => [row.day, row.count]));
  return fillDateRange(range.startDate, range.endDate, countsByDate);
}

/**
 * 種別ごとの盤面の内訳（累計）を数える
 * 問題盤面内訳集計
 *
 * @description
 * 保存数と、次の 4 条件に当てはまる行の数を `GROUP BY kind` で取る。
 * - リーチ: `payload.riichi` が JSON のオブジェクト（リーチなしは JSON の null）
 * - 副露あり: `payload.hand.exposed` に `ankan` 以外が 1 つ以上
 * - ツモ: `payload.isTsumo` が true（和了形だけ。聴牌形はキーが無く数えない）
 * - 親: `payload.jikaze` が東（牌種 ID は `HaiKind.Ton` をバインドし、数値を直書きしない）
 *
 * @design 内訳は jsonb の演算で数えられる 4 条件に限り、累計だけを出す
 * 「どんな問題が貯まっているか」に答える最小の組。翻・符・点数・役は盤面からの
 * 派生値で、全行を読んで問題を組み立て直す必要があり、ルール設定でも値が変わる
 * ので出さない。期間で切ると列が倍になって読みにくいので、累計だけにする。
 *
 * @design 暗槓は副露に数えない
 * 暗槓は鳴いていない（門前を崩さない）ので、保存形式でも鳴き元を持たない別の
 * 副露の種類になっている。暗槓だけの手は「副露あり」に入れない。
 */
export async function fetchPracticeProblemComposition(): Promise<
  readonly PracticeProblemCompositionRow[]
> {
  const payload = practiceProblems.payload;
  const rows = await db
    .select({
      kind: practiceProblems.kind,
      total: sql<number>`count(*)::int`,
      riichi: sql<number>`(count(*) filter (where jsonb_typeof(${payload}->'riichi') = 'object'))::int`,
      furo: sql<number>`(count(*) filter (where jsonb_path_exists(${payload}, '$.hand.exposed[*] ? (@.type != "ankan")')))::int`,
      tsumo: sql<number>`(count(*) filter (where ${payload}->'isTsumo' = 'true'::jsonb))::int`,
      oya: sql<number>`(count(*) filter (where (${payload}->>'jikaze')::int = ${HaiKind.Ton}))::int`,
    })
    .from(practiceProblems)
    .groupBy(practiceProblems.kind);

  return rows.map((row) => ({
    kind: row.kind,
    total: row.total,
    riichi: row.riichi,
    furo: row.furo,
    tsumo: row.tsumo,
    oya: row.oya,
  }));
}
