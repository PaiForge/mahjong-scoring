/**
 * 表彰台（上位3位）の見せ方
 * 表彰台
 *
 * 「1・2・3 位が金銀銅に見える」ための定義をここ 1 箇所に集める。順位バッジの
 * メダルと行の縁取りは同じ「上位3位」という概念の裏表で、片方だけ直すと
 * バッジは金なのに行の縁は銀、のようにずれる。
 *
 * 数字だけのバッジ（1 / 2 / 3）は色を変えても順序が読めなかったため、
 * メダル絵文字で位を示し、行の左端に金属色の縁を足して表を横に走査した
 * ときにも上位が見つかるようにしている。
 */

/** 順位 → メダル絵文字（表彰台の 1〜3 位のみ） */
export const MEDAL_EMOJI: Record<number, string> = {
  1: "\u{1F947}", // 🥇
  2: "\u{1F948}", // 🥈
  3: "\u{1F949}", // 🥉
};

/**
 * 順位に対応するメダル絵文字を返す（4 位以下は `undefined`）
 * メダル取得
 */
export function getMedalEmoji(rank: number): string | undefined {
  return MEDAL_EMOJI[rank];
}

/**
 * 上位3位の行に付ける左端の金属色アクセント
 *
 * `border-left-style` を明示するのは、行の区切りが破線（`border-dashed`）で
 * border-style が四辺に効くため。指定しないと左端の縁も破線になり、
 * 金属の帯ではなく点線に見える。
 */
const TOP3_BORDER: Record<number, string> = {
  1: "border-l-4 [border-left-style:solid] border-l-podium-gold",
  2: "border-l-4 [border-left-style:solid] border-l-podium-silver",
  3: "border-l-4 [border-left-style:solid] border-l-podium-bronze",
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
    "border-b-2 border-dashed border-border/40 last:border-b-0 transition-colors",
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
