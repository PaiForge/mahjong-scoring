/**
 * 目次（`CurriculumTocView`）のレイアウト定数
 *
 * @description
 * セクションの枠（`curriculum-toc-view.tsx`: bullet と破線ガイド線）と
 * 章の行（`chapter-row.tsx`: 行のインデントと「次はここから」の実線）で共有する。
 * 破線ガイド線と実線はどちらも bullet 中心に載せる絶対座標で置いており、
 * bullet サイズ・章行のインデントと連動するため、どちらか一方だけを直すと
 * ズレる。片側に持たせず必ずここを経由させること。
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
const BULLET_CENTER_LEFT_PX = 8;
export const BULLET_CENTER_TOP_PX = 8;

/**
 * 縦線（破線ガイド／「次はここから」の実線）の左端。
 * どちらも 2px 幅なので、bullet 中心に載せるには 1px 手前に置く。
 */
export const GUIDE_LINE_LEFT_PX = BULLET_CENTER_LEFT_PX - 1;

/**
 * 章行の箱（位置の基準と余白）。
 * セクション bullet 中心 (left=8px) より右側に章タイトルが配置されるよう
 * `pl-7` (28px) でインデント。「次はここから」の amber 実線は破線ガイド線と
 * 同じ x 座標に absolute 配置するため、border-l は使わない。
 * 変更時は破線ガイド線の座標と視覚的にズレないか確認すること。
 */
export const CHAPTER_ROW_BOX_CLASS = "relative py-3 pl-7 pr-2";

/**
 * 章行の共通クラス（中身を横 1 列に並べる行）。
 * コラムの行が使う。レッスンの行はタイトルと説明文を縦に積むため、
 * {@link CHAPTER_ROW_BOX_CLASS} にグリッドを足して組む
 */
export const CHAPTER_ROW_BASE_CLASS = `${CHAPTER_ROW_BOX_CLASS} flex items-start gap-3`;
