import { nextRank, type RankSlug } from "./registry";

/**
 * ある段級位がユーザーにとってどの状態にあるか
 * 段級位の取得状態
 *
 * - `achieved` 取得済み
 * - `next` 次に取る級（受験できる唯一の未取得の級）
 * - `unachieved` それより上の未取得の級（先に下の級を取るまで受験できない）
 */
export type RankStatus = "achieved" | "next" | "unachieved";

/**
 * 段級位の取得状態を判定する
 * 段級位状態判定
 *
 * 道場の段級位一覧・級の詳細ページが、級ごとに「取得済み / 次の目標 /
 * 未取得」を出し分けるのに使う。「次」は {@link nextRank} と同じ
 * 「level 昇順で最初の未取得」で、受験資格（`evaluateExamEligibility`）の
 * `eligible` と一致する — 一覧で「次の目標」と出した級が、試験ページで
 * 受験できない級になることはない。
 *
 * 過去の仕様で飛び番に付与されたユーザー（5級と2級のみ等）では、取得済みの
 * 上に未取得の級が挟まる。その級も `unachieved` ではなく、最下位の未取得
 * だけが `next` になる（受験資格と同じく保持集合だけから導く）。
 *
 * @param slug - 判定する段級位
 * @param achievedSlugs - ユーザーの取得済み段級位スラッグ
 */
export function resolveRankStatus(
  slug: RankSlug,
  achievedSlugs: readonly RankSlug[],
): RankStatus {
  if (achievedSlugs.includes(slug)) return "achieved";
  return nextRank(achievedSlugs)?.slug === slug ? "next" : "unachieved";
}
