/**
 * 管理画面のボタンの見た目。
 *
 * - `primary` — 保存・作成・検索など、その場の主操作（緑の塗り）
 * - `secondary` — キャンセル・補助の操作（1px の枠）
 * - `danger` — BAN など取り返しにくい操作（赤の塗り）
 */
export type AdminButtonVariant = "primary" | "secondary" | "danger";

/**
 * - `sm` — 表の行やセクションの中に並ぶ操作のきっかけ（BAN・付与・取り消し）
 * - `md` — フォームの送信・モーダルの確定・ページの主操作
 */
export type AdminButtonSize = "sm" | "md";

const VARIANT_CLASSES: Readonly<Record<AdminButtonVariant, string>> = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 disabled:bg-surface-300 disabled:text-surface-500",
  secondary:
    "border border-surface-300 bg-white text-surface-700 hover:bg-surface-100 disabled:opacity-40",
  danger:
    "bg-red-600 text-white hover:bg-red-700 disabled:bg-surface-300 disabled:text-surface-500",
};

// 枠を持つ secondary と塗りだけの primary / danger で高さが揃うよう、
// 枠の 1px ぶんを padding で吸収する
const SIZE_CLASSES: Readonly<
  Record<AdminButtonSize, Record<"framed" | "filled", string>>
> = {
  sm: { framed: "px-3 py-1 text-xs", filled: "px-3 py-[5px] text-xs" },
  md: { framed: "px-4 py-2 text-sm", filled: "px-4 py-[9px] text-sm" },
};

interface AdminButtonOptions {
  readonly variant?: AdminButtonVariant;
  readonly size?: AdminButtonSize;
}

/**
 * 管理画面のボタン（`<button>` と `next/link`）の class。
 *
 * ユーザー向けの `buttonClasses()` と同じく、色・枠・角丸・大きさの一式を
 * ここに集約する。ページ側で `rounded bg-primary-600 px-4 py-2 ...` を
 * 直接書かない。`className` で足すのは余白などのレイアウトだけにする。
 */
export function adminButtonClasses({
  variant = "primary",
  size = "md",
}: AdminButtonOptions = {}): string {
  const frame = variant === "secondary" ? "framed" : "filled";
  return `inline-flex items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors ${SIZE_CLASSES[size][frame]} ${VARIANT_CLASSES[variant]}`;
}
