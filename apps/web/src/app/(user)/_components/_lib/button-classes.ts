/**
 * ボタンの共通クラス文字列。
 *
 * 見た目はフラット: 1px の細枠と塗りだけで、影や押し込みの移動は持たない。
 * 押せることは塗り（緑・帯色）と、hover で塗りが一段濃くなることで示し、
 * キーボード操作中はフォーカスリングで示す。ボタンはここで組み立てた
 * クラスだけを使い、`border bg-action ...` のような一式をページ側で
 * 直接書かない。
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
  | "belt"
  | "danger"
  | "warning"
  | "dangerOutline";

/**
 * 大きさ。
 *
 * `xl` だけは LP のヒーロー CTA 用で、余白と文字が一段大きい。
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

const BASE = `inline-flex items-center justify-center rounded-lg border font-bold ${FOCUS_RING_CLASSES}`;

/**
 * ボタンの中身（アイコン + ラベル）を包む一段のクラス。
 *
 * `LinkButton` は遷移待ち中に中身ごと隠してスピナーを重ねるため、
 * アイコンとラベルの間隔は呼び出し側の `className` ではなく
 * この一段が持つ（隠す単位と間隔の単位を一致させる）。
 */
export const BUTTON_CONTENT_CLASSES = "inline-flex items-center gap-2";

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-2.5 text-sm",
  lg: "px-6 py-3 text-sm",
  xl: "px-8 py-3 text-base",
};

/**
 * 押せるときだけ付く遷移。塗りと枠の色だけが変わり、位置は動かさない
 * （以前の押し込み演出は要素を右下へずらしていた）。
 */
const PRESSABLE_CLASSES =
  "transition-colors duration-100 motion-reduce:transition-none";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // 塗りのボタンは枠を塗りと同化させる（透明）。細い淡色の枠を緑の上に
  // 引くと縁だけが白っぽく浮いて見える。幅は他の variant と同じ 1px を保つ。
  primary:
    "border-transparent bg-action text-action-foreground hover:bg-action-hover active:bg-action-active",
  secondary:
    "border-panel bg-card text-action hover:border-primary-300 hover:bg-brand-subtle active:bg-primary-100",
  neutral:
    "border-panel bg-card text-surface-700 hover:border-surface-300 hover:bg-surface-100 active:bg-surface-200",
  // 段級位の帯色をまとったボタン。塗り・hover・文字・枠をすべて帯色で
  // 通し、緑を一切載せない。5級のカードの中のボタンはオレンジ、4級なら青。
  //
  // 面は帯色の淡い側で、帯そのものの濃さは細い枠が持つ。濃い色で塗り潰すと、
  // 白いカードの中でボタンだけが重く浮いて先に目に入る（このボタンは章や
  // 合格基準を読んだ後に押すもので、カードの主役ではない）。
  //
  // 色そのものは持たず `--belt-*` を読むだけにしてある。級ごとの値は
  // `lib/ranks/belt-colors.ts` が正典で、呼び出し側が `beltButtonVarsClass()`
  // を className に添えて立てる（級が増えても触るのは向こう 1 箇所）。
  // 変数が無い面に置かれたときは緑の淡い側に落ちて既定の見た目になる。
  belt: "border-[color:var(--belt-edge,var(--color-primary-300))] bg-[color:var(--belt-fill,var(--color-primary-50))] text-[color:var(--belt-text,var(--color-primary-800))] hover:bg-[color:var(--belt-fill-hover,var(--color-primary-100))]",
  danger:
    "border-transparent bg-destructive text-white hover:bg-destructive/90 active:bg-destructive-strong",
  warning:
    "border-transparent bg-warning text-white hover:bg-warning/90 active:bg-warning-strong",
  // 枠も赤にして、塗りの danger と並んでも「危険な操作」と読めるようにする。
  // 危険であることは確認モーダルも伝える。
  dangerOutline:
    "border-destructive/40 bg-card text-destructive hover:border-destructive hover:bg-destructive-subtle",
};

const DISABLED_CLASSES =
  "cursor-not-allowed border-surface-200 bg-surface-100 text-surface-400";

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
    : `${PRESSABLE_CLASSES} ${VARIANT_CLASSES[variant]}`;
  const widthClass = fullWidth ? "w-full" : "";

  return `${BASE} ${SIZE_CLASSES[size]} ${stateClasses} ${widthClass}`.trim();
}
