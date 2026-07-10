/**
 * 各強度レベル (0–4) の Tailwind クラス。
 * ヒートマップ強度クラス
 *
 * Level 0 は活動なしの淡色、Level 1–4 は primary カラースケールで濃淡を表現する。
 * 本プロジェクトは `bg-muted`/`bg-primary` トークンを持たないため `surface-*`/`primary-*` を使う。
 */
export const LEVEL_CLASSES: Readonly<Record<number, string>> = {
  0: "bg-surface-200",
  1: "bg-primary-200",
  2: "bg-primary-400",
  3: "bg-primary-600",
  4: "bg-primary-700",
};
