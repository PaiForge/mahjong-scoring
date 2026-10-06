import type { CurriculumSection } from "@mahjong-scoring/features/curriculum/registry";

/**
 * レッスンの画面だけが使う色
 * レッスン配色
 *
 * web の教本は Tailwind 既定の色（琥珀のコラム・目次のセクションの色）を
 * クラスで直接使っており、`globals.css` のトークンには載っていない。
 * 同じ値を hex で写す（`lib/theme.ts` はトークンの写しに留める）。
 */
export const lessonColors = {
  /** コラムの囲みの地（web の `bg-amber-50/60`） */
  amber50: "rgba(255, 251, 235, 0.6)",
  /** 「次はここから」の行の地（web の `bg-amber-50`） */
  amber50Solid: "#fffbeb",
  /** コラムのラベルの地（web の `bg-amber-200/70`） */
  amber200: "rgba(253, 230, 138, 0.7)",
  /** 「次はここから」のバッジ（web の `bg-amber-200`） */
  amber200Solid: "#fde68a",
  amber500: "#f59e0b",
  amber600: "#d97706",
  amber800: "#92400e",
  amber900: "#78350f",
} as const;

/**
 * セクション（カテゴリ）ごとの配色（web の `SECTION_CATEGORY_COLOR_CLASS`）
 * セクション配色
 */
export const SECTION_COLORS: Readonly<Record<CurriculumSection, string>> = {
  foundation: "#94a3b8",
  mangan: "#f43f5e",
  fu: "#00904a",
  yaku: "#f59e0b",
  score: "#0ea5e9",
  memorization: "#8b5cf6",
};

/**
 * 正誤の濃い文字色（web の `--color-success-strong` / `--color-destructive-strong`）
 * 正誤文字色
 */
export const verdictTextColors = {
  correct: "#034621",
  incorrect: "#7f1d1d",
} as const;
