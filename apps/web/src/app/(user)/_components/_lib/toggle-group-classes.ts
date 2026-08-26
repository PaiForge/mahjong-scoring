/**
 * トグルピル（丸い枠の中に選択肢を並べる切り替え UI）の見た目
 * トグルピルclass
 *
 * `ToggleGroup`（button）と期間セレクター（`next/link`）で要素が違うだけの
 * 同じパーツ。以前はそれぞれが class 一式を持っており、角丸・配色・
 * フォントウェイト・ホバー色が少しずつ食い違っていた。
 */

/** 外枠 */
export const TOGGLE_GROUP_CONTAINER_CLASSES =
  "flex rounded-full border-3 border-ink bg-primary-50 p-0.5";

/**
 * 選択肢1つ分
 *
 * 左右の余白は狭い画面で一段詰める。トグルを 3 つ横に並べる画面
 * （点数早見表）がモバイル幅では 1 行に収まらず、グループが 2 段に
 * 折り返してしまうため。
 *
 * @param isActive - 選択中かどうか
 */
export function toggleItemClasses(isActive: boolean): string {
  return `whitespace-nowrap rounded-full px-2 py-1 text-xs font-bold transition-colors sm:px-3 ${
    isActive
      ? "bg-primary-700 text-white"
      : "text-surface-700 hover:bg-primary-100"
  }`;
}
