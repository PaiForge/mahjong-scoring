/**
 * 折れ線チャート共通のテーマ値
 * チャートテーマ
 *
 * recharts はスタイルを Tailwind クラスではなく props で受け取るため、
 * 配色・余白の指定がコンポーネント内に散りやすい。マイページのスコア推移と
 * 管理画面の日次推移で見た目を揃えるため、値をここに集約する。
 *
 * すべて再生成のない定数なので、コンポーネント側で useMemo する必要はない。
 */

/** グラフ本体の外側余白 */
export const CHART_MARGIN = {
  top: 5,
  right: 10,
  left: 0,
  bottom: 5,
} as const;

/** 軸目盛りの文字スタイル */
export const CHART_AXIS_TICK = {
  fill: "var(--color-surface-500)",
  fontSize: 12,
} as const;

/** 軸線・グリッド線の色 */
export const CHART_GRID_STROKE = "var(--color-surface-200)";

/** グリッド線の破線パターン */
export const CHART_GRID_DASH = "3 3";

/** ツールチップの吹き出しスタイル */
export const CHART_TOOLTIP_CONTENT_STYLE = {
  backgroundColor: "var(--color-surface-50)",
  border: "1px solid var(--color-surface-200)",
  borderRadius: "8px",
  color: "var(--color-surface-900)",
} as const;

/** 主系列の線色 */
export const CHART_PRIMARY_STROKE = "var(--color-primary-500)";

/** 主系列の点（通常時 / ホバー時） */
export const CHART_PRIMARY_DOT = { fill: CHART_PRIMARY_STROKE, r: 3 } as const;
export const CHART_PRIMARY_ACTIVE_DOT = {
  fill: CHART_PRIMARY_STROKE,
  r: 5,
} as const;

/** データが 0 件のときのメッセージ枠 */
export const CHART_EMPTY_CLASS =
  "flex h-48 items-center justify-center text-sm text-surface-500";
