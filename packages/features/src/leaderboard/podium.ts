/**
 * 表彰台（上位3位）のメダル
 * 表彰台メダル
 *
 * 数字だけのバッジ（1 / 2 / 3）は色を変えても順序が読めなかったため、
 * メダル絵文字で位を示す。web のランキング表とアプリのランキングが同じ
 * 印を出すため、ここに置く。行の縁取りの色（金属色）は各プラットフォームの
 * 色のトークンが持つ。
 */
const MEDAL_EMOJI: Readonly<Record<number, string>> = {
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
