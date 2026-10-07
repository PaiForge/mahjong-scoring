/**
 * 管理画面の状態チップの色。
 *
 * - `success` — 有効・掲載中・公開中など、運用上「生きている」状態
 * - `warning` — 仮登録・表示中・リンク混在など、目に留めてほしい状態
 * - `danger` — BAN・取り消しなど、止められた状態
 * - `neutral` — 期限切れ・下書き・停止中、および意味の色を持たないラベル
 */
export type AdminChipTone = "success" | "warning" | "danger" | "neutral";

const TONE_CLASSES: Readonly<Record<AdminChipTone, string>> = {
  success: "bg-primary-50 text-primary-800",
  warning: "bg-amber-100 text-amber-900",
  danger: "bg-red-100 text-red-800",
  // surface-100 は管理画面の地（.admin-shell）と同じ色で、ページ見出しの横に
  // 置くと消えるため一段濃くする
  neutral: "bg-surface-200/70 text-surface-700",
};

/**
 * 管理画面の状態チップ（rounded-md・枠なし・淡い塗り）の class。
 *
 * ユーザー向け画面のチップと同じ形で、管理画面の文字サイズに合わせている。
 * 状態の表示はすべてこれを使い、`rounded px-2 py-0.5 bg-*-100` の一式を
 * ページ側で直接書かない。
 */
export function adminChipClasses(tone: AdminChipTone): string {
  return `inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${TONE_CLASSES[tone]}`;
}
