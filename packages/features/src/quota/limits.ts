/**
 * 練習の無料枠 — 回数制限の対象と上限
 * 練習回数上限
 *
 * 対象は終了条件の無いエンドレス練習 2 つ（`practice/score` と
 * `practice/machi-score`）。1 問生成するごとに 1 回を消費する。
 * `PRACTICE_MENU_REGISTRY` には載せない（どちらも元々レジストリ外で、
 * 記録・ランキングの土俵を持たない）。
 *
 * Pro（`PlanBenefit.UnlimitedPractice`）は無制限で、ここの値を見ない。
 *
 * このモジュールは純粋。UI（ペイウォールの文言「ログインすると 1 日 n 問」）
 * からも import する。
 */

/** 回数制限の対象となる練習（URL のスラッグと同じ文字列） */
export const QUOTA_MENUS = ["score", "machi-score"] as const;
export type QuotaMenu = (typeof QUOTA_MENUS)[number];

const quotaMenuSet: ReadonlySet<string> = new Set(QUOTA_MENUS);

/** 文字列が回数制限の対象の練習か。Server Action がクライアントの入力を絞るのに使う */
export function isQuotaMenu(value: string): value is QuotaMenu {
  return quotaMenuSet.has(value);
}

/** 1 日の上限（問） */
export interface QuotaLimit {
  /** ログイン済みの無料ユーザー */
  readonly signedIn: number;
  /** 未ログイン。cookie で数える弱い制限 */
  readonly anonymous: number;
}

/**
 * 練習ごとの 1 日の上限
 * 練習別上限
 *
 * 聴牌形の点数計算（`machi-score`）は 1 問が重い（待ちを全部読んでから
 * マスを埋める）ので少なめ、点数計算（`score`）は 1 問が軽いので多め。
 * 未ログインはどちらも 1 問 — 「どんな練習か」を見せる分だけ。
 */
export const PRACTICE_QUOTA_LIMITS: Readonly<Record<QuotaMenu, QuotaLimit>> = {
  "machi-score": { signedIn: 3, anonymous: 1 },
  score: { signedIn: 5, anonymous: 1 },
};
