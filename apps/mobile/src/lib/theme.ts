/**
 * アプリの色・角丸・余白のトークン
 * デザイントークン
 *
 * web の `globals.css`（`@theme`）と同じ値を持つ。React Native には CSS が
 * 無いので値をここに写す。色を変えるときは web の `globals.css` と一緒に直すこと。
 *
 * 見た目はフラット（web と同じ）: 線は 1px の淡い `panel` で統一し、地に置いた
 * 面（カード・ボタン・表・選択肢）は影を持たず、押しても位置を動かさない。
 * 情報の優先順位は線の太さではなく、塗り（ボタンの緑・段級位の帯色・状態色）と
 * 文字の大きさで示す。
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

  /** カード・表・ボタン・区切り線の淡い枠（`--color-panel` = `--color-border`） */
  panel: "#dce3e0",
  background: "#f8fafc",
  card: "#ffffff",
  foreground: "#0f172a",
  mutedForeground: "#64748b",

  success: "#007a3d",
  successSubtle: "#d3f5db",
  successStrong: "#034621",
  destructive: "#dc524a",
  destructiveSubtle: "#fee2e2",
  destructiveStrong: "#7f1d1d",
  warning: "#b45309",
  warningSubtle: "#fef3c7",
  warningStrong: "#78350f",
  amber500: "#f59e0b",
  amber300: "#fcd34d",
  amber100: "#fef3c7",
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
  /** 内側の情報カード・表（`--radius-panel`） */
  panel: 12,
  full: 9999,
} as const;

/**
 * 枠の太さ
 *
 * 線は 1px（`panel`）だけで組む。`belt` は段級位のカードの上端の帯色の帯
 * （web の `border-t-2`。1px では淡い級の帯色が細線に紛れる）。
 */
export const borderWidth = {
  panel: 1,
  belt: 2,
} as const;

/**
 * 画面の上に浮く層（ダイアログ等）の柔らかい影（web の `shadow-xl` 相当）
 *
 * 影は地から離れて浮く層だけが持つ。地に置かれた面には付けない。
 */
export const floatingShadow = {
  shadowColor: "#0f172a",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.18,
  shadowRadius: 24,
  elevation: 12,
} as const;

/** 余白（Tailwind の 4px 刻み） */
export const space = (n: number): number => n * 4;
