/**
 * トグルピル（丸い枠の中に選択肢を並べる切り替え UI）の見た目
 * トグルピルclass
 *
 * `ToggleGroup`（button）と期間セレクター（`next/link`）で要素が違うだけの
 * 同じパーツ。以前はそれぞれが class 一式を持っており、角丸・配色・
 * フォントウェイト・ホバー色が少しずつ食い違っていた。
 */

/**
 * 外枠の寸法（枠の太さ・内側の余白・角丸）
 *
 * 色を持たないので、灰色の矩形で描くスケルトンからも使える。高さを固定の
 * `h-*` で近似せずに実物と揃えるための共有点（{@link TOGGLE_ITEM_METRICS_CLASSES}
 * と対で使う）。
 */
export const TOGGLE_GROUP_CONTAINER_METRICS_CLASSES =
  "flex rounded-full border-3 p-0.5";

/** 外枠 */
export const TOGGLE_GROUP_CONTAINER_CLASSES = `${TOGGLE_GROUP_CONTAINER_METRICS_CLASSES} border-ink bg-primary-50`;

/**
 * 選択肢1つ分の寸法（左右の余白・字送り）
 *
 * 外枠と同じくスケルトンと共有するため、色と状態変化を含めない。
 * 左右の余白は狭い画面で一段詰める。トグルを 3 つ横に並べる画面
 * （点数早見表）がモバイル幅では 1 行に収まらず、グループが 2 段に
 * 折り返してしまうため。
 */
export const TOGGLE_ITEM_METRICS_CLASSES =
  "whitespace-nowrap rounded-full px-2 py-1 text-xs font-bold sm:px-3";

/**
 * 選択肢1つ分
 *
 * @param isActive - 選択中かどうか
 */
export function toggleItemClasses(isActive: boolean): string {
  return `${TOGGLE_ITEM_METRICS_CLASSES} transition-colors ${
    isActive
      ? "bg-primary-700 text-white"
      : "text-surface-700 hover:bg-primary-100"
  }`;
}
