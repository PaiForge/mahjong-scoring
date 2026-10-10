/**
 * 表彰台（上位3位）の見せ方
 * 表彰台
 *
 * 「1・2・3 位が金銀銅に見える」ための定義をここ 1 箇所に集める。順位バッジの
 * メダルと行の縁取りは同じ「上位3位」という概念の裏表で、片方だけ直すと
 * バッジは金なのに行の縁は銀、のようにずれる。
 *
 * 数字だけのバッジ（1 / 2 / 3）は色を変えても順序が読めなかったため、
 * メダル絵文字（features の `leaderboard/podium.ts`。アプリと共有）で位を示し、
 * 行の左端に金属色の縁を足して表を横に走査したときにも上位が見つかるようにしている。
 */

/**
 * 上位3位の行に付ける左端の金属色アクセント
 */
const TOP3_BORDER: Record<number, string> = {
  1: "border-l-4 border-l-podium-gold",
  2: "border-l-4 border-l-podium-silver",
  3: "border-l-4 border-l-podium-bronze",
};

/**
 * ランキング 1 行の `<tr>` に付ける class を組み立てる
 * ランキング行クラス
 *
 * 自分の行のハイライトは表彰台の淡い塗りより優先する（順位より「どれが自分か」
 * を先に見つけたいため）。左端のアクセントは塗りと独立なので、自分が上位3位に
 * いるときは緑の塗りに金属の縁が同時に付く。
 */
export function leaderboardRowClassName(options: {
  readonly rank: number;
  readonly isCurrentUser: boolean;
}): string {
  const isTop3 = options.rank >= 1 && options.rank <= 3;

  return [
    "border-b border-surface-100 last:border-b-0 transition-colors",
    options.isCurrentUser
      ? "bg-primary-50"
      : isTop3
        ? "bg-surface-50 hover:bg-surface-100"
        : "hover:bg-surface-50",
    TOP3_BORDER[options.rank] ?? "",
  ]
    .filter((part) => part !== "")
    .join(" ");
}
