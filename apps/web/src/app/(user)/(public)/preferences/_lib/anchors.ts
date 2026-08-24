/**
 * 設定ページ内の各設定項目へのアンカー。
 *
 * 教本（`/learn/*`）などページ外から特定の設定項目へ直接リンクするために使う。
 * 設定項目は今後増えていくため、リンク側で `/preferences#...` を直接書かず
 * ここの定数を経由させ、id とリンク先がずれないようにする。
 */
export const PREFERENCE_ANCHORS = {
  /** 連風牌（場風＝自風）の雀頭を4符にするか */
  renfonpai: "renfonpai",
  /** 30符4翻・60符3翻を満貫に切り上げるか（切り上げ満貫） */
  kiriageMangan: "kiriage-mangan",
  /** ランキングに自分を表示しないか */
  leaderboardVisibility: "leaderboard-visibility",
} as const;

export type PreferenceAnchor =
  (typeof PREFERENCE_ANCHORS)[keyof typeof PREFERENCE_ANCHORS];

/** 設定ページの特定項目への href（例: `/preferences#renfonpai`）。 */
export function preferencesHref(anchor: PreferenceAnchor): string {
  return `/preferences#${anchor}`;
}
