/**
 * ボタンの共通クラス文字列。
 *
 * 見た目の基準は `/learn/*` の「<練習名>にチャレンジ」ボタン
 * （太枠 + ハードシャドウ + 押し込み演出）。ボタンはここで組み立てた
 * クラスだけを使い、`border-3 border-ink bg-primary-500 ...` のような
 * 一式をページ側で直接書かない。
 *
 * 実際の要素は用途で分かれる:
 * - `<button>` → `Button`
 * - `next/link` → `LinkButton`
 * - 外部リンクの `<a>` など上記に乗らないもの → この関数を直接呼ぶ
 *
 * 「押せる面」（カード全体がリンクになっているもの。`LinkRow` 等）は
 * ボタンではないため対象外。
 */

import { FOCUS_RING_CLASSES } from "@/app/_components/_lib/link-classes";

/** 塗り・文字色の系統 */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "neutral"
  | "quiet"
  | "danger"
  | "warning"
  | "dangerOutline";

/**
 * 大きさ。
 *
 * `xl` だけは LP のヒーロー CTA 用で、枠と影も一段太くなる
 * （border-4 / shadow-md / press-md）。
 */
export type ButtonSize = "sm" | "md" | "lg" | "xl";

export interface ButtonClassOptions {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** 親要素の幅いっぱいに広げる（縦積みの CTA 等） */
  readonly fullWidth?: boolean;
  /**
   * 無効状態。
   *
   * hover / press を落として一律のグレーに落とす。`<button disabled>` でも
   * `<span aria-disabled>` でも同じ見た目になるよう、`disabled:` 修飾子では
   * なくクラス自体を差し替える。
   */
  readonly disabled?: boolean;
}

const BASE = `inline-flex items-center justify-center rounded-lg font-bold ${FOCUS_RING_CLASSES}`;

/**
 * ボタンの中身（アイコン + ラベル）を包む一段のクラス。
 *
 * `LinkButton` は遷移待ち中に中身ごと隠してスピナーを重ねるため、
 * アイコンとラベルの間隔は呼び出し側の `className` ではなく
 * この一段が持つ（隠す単位と間隔の単位を一致させる）。
 */
export const BUTTON_CONTENT_CLASSES = "inline-flex items-center gap-2";

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "border-3 px-4 py-2 text-sm",
  md: "border-3 px-6 py-2.5 text-sm",
  lg: "border-3 px-6 py-3 text-sm",
  xl: "border-4 px-8 py-3 text-base",
};

/** 押せるときだけ付く影と押し込み演出（サイズで太さが変わる） */
const PRESSABLE_CLASSES: Record<ButtonSize, string> = {
  sm: "press-sm shadow-sm",
  md: "press-sm shadow-sm",
  lg: "press-sm shadow-sm",
  xl: "press-md shadow-md",
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "border-ink bg-primary-500 text-white hover:bg-primary-600",
  secondary: "border-ink bg-card text-primary-700 hover:bg-primary-50",
  neutral: "border-ink bg-card text-surface-700 hover:bg-surface-100",
  // 白と調和させる控えめなボタン。枠・影・文字をすべてグレーで通し、緑を
  // 一切載せない。帯色で縁取ったカードのように、緑が別の意味を持って
  // しまう面の上に置く「詳細を見に行く」導線のための variant。
  //
  // 枠だけグレーにすると、全 variant 共通のハードシャドウ
  // （3px 3px 0 var(--color-ink)）が緑のまま右下に残る（dangerOutline が
  // 踏んだのと同じ罠）。静止時の影は `--skin-shadow-*` を要素側で立てて
  // 差し替え（`shadow-*` は素の値ではなくこの変数を参照して展開される）、
  // hover / active は press-* が読む `--press-shadow-color` で差し替える。
  // サイズによって使う影が変わるため sm / md の両方を立てておく。
  quiet:
    "border-surface-300 bg-card text-surface-700 hover:bg-surface-50 [--skin-shadow-sm:3px_3px_0_var(--color-surface-300)] [--skin-shadow-md:4px_4px_0_var(--color-surface-300)] [--press-shadow-color:var(--color-surface-300)]",
  danger: "border-ink bg-destructive text-white hover:bg-destructive/90",
  warning: "border-ink bg-warning text-white hover:bg-warning/90",
  // 枠は他の variant と同じ ink。枠を destructive にすると、全 variant 共通の
  // ハードシャドウ（3px 3px 0 var(--color-ink)）だけが緑のまま右下に残り、
  // 赤枠の右と下に緑の帯が出る。危険であることは文字色と確認モーダルが伝える。
  dangerOutline:
    "border-ink bg-card text-destructive hover:bg-destructive-subtle",
};

const DISABLED_CLASSES =
  "cursor-not-allowed border-ink bg-surface-200 text-surface-400 opacity-60";

/**
 * ボタンのクラス文字列を組み立てる。
 *
 * @param options 系統・大きさ・幅・無効状態
 */
export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
}: ButtonClassOptions = {}): string {
  const stateClasses = disabled
    ? DISABLED_CLASSES
    : `${PRESSABLE_CLASSES[size]} ${VARIANT_CLASSES[variant]}`;
  const widthClass = fullWidth ? "w-full" : "";

  return `${BASE} ${SIZE_CLASSES[size]} ${stateClasses} ${widthClass}`.trim();
}
