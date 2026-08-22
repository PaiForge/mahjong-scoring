/**
 * 目次（`CurriculumToc`）のレイアウト定数
 *
 * @description
 * 実描画（`curriculum-toc.tsx`）と読み込み中スケルトン
 * （`curriculum-toc-skeleton.tsx`）で共有する。破線ガイド線は bullet 中心に
 * 載せる絶対座標で置いており、bullet サイズ・章行のインデントと連動するため、
 * どちらか一方だけを直すとズレる。片側に持たせず必ずここを経由させること。
 */

/**
 * セクション bullet のサイズ。
 * 下の座標定数と対応しているため、変更時はそちらも更新すること。
 */
export const SECTION_BULLET_SIZE_CLASS = "size-4";

/**
 * セクション bullet の中心までの水平・垂直オフセット（`size-4` の半分 = 8px）。
 * bullet は見出し行の 1 行目に上余白なしで乗るため、垂直方向も単純に半分でよい。
 */
export const BULLET_CENTER_LEFT_PX = 8;
export const BULLET_CENTER_TOP_PX = 8;

/**
 * 縦線（破線ガイド／「次はここから」の実線）の左端。
 * どちらも 2px 幅なので、bullet 中心に載せるには 1px 手前に置く。
 */
export const GUIDE_LINE_LEFT_PX = BULLET_CENTER_LEFT_PX - 1;

/**
 * 章行の共通クラス。
 * セクション bullet 中心 (left=8px) より右側に章タイトルが配置されるよう
 * `pl-7` (28px) でインデント。「次はここから」の amber 実線は破線ガイド線と
 * 同じ x 座標に absolute 配置するため、border-l は使わない。
 * 変更時は破線ガイド線の座標と視覚的にズレないか確認すること。
 */
export const CHAPTER_ROW_BASE_CLASS =
  "relative flex items-start gap-3 py-3 pl-7 pr-2";
