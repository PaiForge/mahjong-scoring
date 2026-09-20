/**
 * チャレンジが終わった理由
 * 終了理由
 *
 * - `timeUp`: 制限時間が来た。出題中の問題は答えられないまま残る
 * - `mistakeLimit`: ミスが上限に達した。直前に答えた問題で終わる
 */
export const FinishReason = {
  TimeUp: "timeUp",
  MistakeLimit: "mistakeLimit",
} as const;
export type FinishReason = (typeof FinishReason)[keyof typeof FinishReason];

/**
 * 結果ページの URL で終了理由を運ぶクエリパラメータ名
 * 終了理由パラメータ
 *
 * play 画面の `useFinishRedirect` が付け、結果ページとそのスケルトンが
 * 問題別一覧の行数（{@link listedProblemCount}）を出すために読む。
 */
export const FINISH_REASON_PARAM = "reason";

/** 終了理由として妥当な値か */
export function isFinishReason(value: unknown): value is FinishReason {
  return value === FinishReason.TimeUp || value === FinishReason.MistakeLimit;
}

/**
 * URL クエリの値を終了理由として読む
 * 終了理由パース
 *
 * 付いていない・壊れているときは undefined（理由が分からない）。
 */
export function parseFinishReason(value: unknown): FinishReason | undefined {
  return isFinishReason(value) ? value : undefined;
}

/**
 * 結果ページの問題別一覧に並ぶ問題数
 * 一覧問題数
 *
 * 答えた問題（URL の `total`）に、時間切れで答えられなかった問題を 1 つ
 * 足した数。時間切れのチャレンジでは出題中だった最後の問題も一覧に載る
 * （{@link import("../_hooks/use-recorded-results").useRecordedResults}）ため、
 * スケルトンの行数を `total` のままにすると一覧が現れた瞬間に 1 行ぶん
 * 伸びる。理由が分からないときは足さない。
 *
 * @param total - 答えた問題数（正解 + 不正解）
 * @param reason - 終了理由。分からなければ undefined
 */
export function listedProblemCount(
  total: number,
  reason: FinishReason | undefined,
): number {
  return reason === FinishReason.TimeUp ? total + 1 : total;
}
