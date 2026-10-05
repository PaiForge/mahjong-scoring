/**
 * アプリの色・角丸・余白のトークン
 * デザイントークン
 *
 * web の `globals.css`（`@theme`）と同じ値を持つ。web はブランドの見た目
 * （太枠 `border-ink`・ハードシャドウ・押し込み演出・緑の塗り）を CSS 変数で
 * 組み立てているが、React Native には CSS が無いので値をここに写す。色を
 * 変えるときは web の `globals.css` と一緒に直すこと。
 */
export const colors = {
  primary50: "#ecfaef",
  primary100: "#d3f5db",
  primary200: "#abebbc",
  primary300: "#76d694",
  primary400: "#35b267",
  primary500: "#00904a",
  primary600: "#007a3d",
  primary700: "#006833",
  primary800: "#00562a",
  primary900: "#034621",

  surface50: "#f8fafc",
  surface100: "#f1f5f9",
  surface200: "#e2e8f0",
  surface300: "#cbd5e1",
  surface400: "#94a3b8",
  surface500: "#64748b",
  surface600: "#475569",
  surface700: "#334155",
  surface800: "#1e293b",
  surface900: "#0f172a",

  /** 太枠とハードシャドウの色（`--color-ink`） */
  ink: "#2f6b4f",
  background: "#f8fafc",
  card: "#ffffff",
  foreground: "#0f172a",
  mutedForeground: "#64748b",

  success: "#007a3d",
  successSubtle: "#d3f5db",
  destructive: "#dc524a",
  destructiveSubtle: "#fee2e2",
  destructiveStrong: "#7f1d1d",
  warning: "#b45309",
  warningSubtle: "#fef3c7",
  warningStrong: "#78350f",
  amber500: "#f59e0b",
  amber50: "#fffbeb",
  red500: "#ef4444",
  white: "#ffffff",
} as const;

/** 角丸（web の `--radius-*` を取り直した値） */
export const radius = {
  sm: 8,
  md: 10,
  lg: 14,
  xl: 18,
  "2xl": 22,
  full: 9999,
} as const;

/** 枠の太さ（web の `border-3` / `border-4`） */
export const borderWidth = {
  regular: 3,
  thick: 4,
} as const;

/**
 * ハードシャドウのずれ（web の `shadow-sm` = 3px 3px 0 ink）
 *
 * 影は「押せる」の記号で、押せる面（ボタン・カード全体がリンクのもの）だけが持つ。
 */
export const shadowOffset = {
  sm: 3,
  md: 4,
} as const;

/** 余白（Tailwind の 4px 刻み） */
export const space = (n: number): number => n * 4;
