import { jstDayKey, jstStartOfDay } from "@mahjong-scoring/features/jst";

/** JST の日付で指定した期間（終了日を含む） */
export interface JstDateRange {
  /** YYYY-MM-DD（JST）。画面とピッカーに出す値 */
  readonly startDate: string;
  readonly endDate: string;
  /** startDate の JST 0:00（含む） */
  readonly from: Date;
  /** endDate の翌日の JST 0:00（含まない） */
  readonly toExclusive: Date;
}

const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** YYYY-MM-DD を年・月・日の数に分ける。形式違いと暦に無い日は undefined */
function parseDayKey(
  dayKey: string,
):
  | { readonly year: number; readonly month: number; readonly day: number }
  | undefined {
  const match = DAY_KEY_PATTERN.exec(dayKey);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  // jstStartOfDay は範囲外の月・日を繰り上げる（2026-02-30 → 2026-03-02）ので、
  // 日付キーへ戻して元の文字列と一致するかで暦に有る日かを判定する。
  if (jstDayKey(jstStartOfDay(year, month, day)) !== dayKey) return undefined;
  return { year, month, day };
}

/**
 * URL の `from` / `to`（JST の日付）を、集計に使う半開区間 `[from, toExclusive)` へ解決する
 * JST期間解決
 *
 * @description
 * 統計のページ（レッスンの完了状況・チャレンジの実施状況）は「累計」と「期間内」の
 * 2 つの数を見せる。累計だけだと古いものが常に上に来て、最近の動きが読めないため。
 * 期間は URL の `from` / `to`（JST の日付、既定は直近 28 日）で受け、
 * ダッシュボードと同じ `DateRangePicker` で選ぶ（期間の UI・URL の形を揃えると
 * 覚えることが増えない）。複数のページで同じ解決をするので `admin/_lib` に置く。
 *
 * @design 不正な値は既定の期間に落とす
 * URL は手で書き換えられる。形式違い（`^\d{4}-\d{2}-\d{2}$` に合わない）・暦に無い日
 * （`2026-02-30`）・開始 > 終了のどれかなら、`fallback` の 2 値で解決し直す。片方だけ
 * 不正でも両方を `fallback` にする（片方だけ差し替えると開始 > 終了が新たに生まれうる）。
 * 不正な日付をそのまま SQL に渡すと Invalid Date で 500 になる。
 *
 * 現在時刻を内部で読まない純粋関数（`admin/_lib/dashboard/date-utils.ts` と同じ方針）。
 * 「今日」は呼び出し側が `fallback` に込めて渡す。終了日の翌日は `jstStartOfDay` に
 * `day + 1` を渡して作る（月末・年末は `jstStartOfDay` が翌月・翌年へ繰り上げる）。
 *
 * @param startDate - 開始日（YYYY-MM-DD、JST）。未検証の URL の値
 * @param endDate - 終了日（YYYY-MM-DD、JST、この日を含む）。未検証の URL の値
 * @param fallback - 不正なときに使う期間。正しい値である前提（`daysAgo` / `today` で作る）。
 *   これも不正なら呼び出し側の誤りとして throw する
 */
export function resolveJstDateRange(
  startDate: string,
  endDate: string,
  fallback: { readonly startDate: string; readonly endDate: string },
): JstDateRange {
  const requested = tryResolve(startDate, endDate);
  if (requested !== undefined) return requested;
  const resolvedFallback = tryResolve(fallback.startDate, fallback.endDate);
  if (resolvedFallback === undefined) {
    // 呼び出し側の誤り。黙って別の期間を作らず、ここで止める
    throw new Error(
      `resolveJstDateRange: invalid fallback ${fallback.startDate} ~ ${fallback.endDate}`,
    );
  }
  return resolvedFallback;
}

/** 2 つの日付キーが正しい期間なら解決し、どちらかが不正なら undefined */
function tryResolve(
  startDate: string,
  endDate: string,
): JstDateRange | undefined {
  const start = parseDayKey(startDate);
  const end = parseDayKey(endDate);
  // YYYY-MM-DD はゼロ埋めの固定長なので文字列の比較が日付の比較になる
  if (start === undefined || end === undefined || startDate > endDate) {
    return undefined;
  }
  return {
    startDate,
    endDate,
    from: jstStartOfDay(start.year, start.month, start.day),
    toExclusive: jstStartOfDay(end.year, end.month, end.day + 1),
  };
}
