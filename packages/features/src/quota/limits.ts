/**
 * 練習の無料枠 — 回数制限の対象と上限
 * 練習回数上限
 *
 * 対象は終了条件の無いエンドレス練習 2 つ（`practice/agari-score` と
 * `practice/tenpai-score`）と、点数計算の昇級試験のうち出題が和了形の点数計算と
 * 同じ形になる 1級・初段の模試（`exam/fu-score/training` と
 * `exam/score/training`）。どれも 1 問生成するごとに 1 回を消費する。
 * エンドレス練習は `PRACTICE_MENU_REGISTRY` に載せない（どちらも元々
 * レジストリ外で、記録・ランキングの土俵を持たない）。模試のキーは試験の
 * スラッグ（`PRACTICE_SLUG`）と同じ文字列で、`isQuotaMenu(slug)` が
 * 「その試験の模試に回数制限が掛かるか」の判定になる。
 *
 * @design 本番の試験には掛けない
 *
 * 本番は受験資格（級の順序）とミス 1 回で終了のルールが付き、1 回に解ける
 * 問題数が数問で止まる。合否という機能に課金の壁を置くと「試験が受けられない」
 * 体験になるので、無料のまま残す。模試は時間無制限・記録なしで正解と内訳を
 * 1 問ごとに読めるため、掛けないと和了形の点数計算の無料枠を素通りする
 * 抜け道になる（2026-11 に判断）。
 *
 * @design 下の級（満貫・符・七対子・平和）の模試には掛けない
 *
 * 出題範囲を絞った模試は和了形の点数計算の一部にしか当たらず、級の学習の
 * 足場として無料で残す。1級・初段の模試は範囲を絞らない（30〜50符 / 全部）
 * ので、和了形の点数計算の「すべて」の設定と同じ練習になる。
 *
 * Pro（`PlanBenefit.UnlimitedPractice`）は無制限で、ここの値を見ない。
 *
 * このモジュールは純粋。UI（ペイウォールの文言「ログインすると 1 日 n 問」）
 * からも import する。
 */

/** 回数制限の対象となる練習（URL のスラッグと同じ文字列） */
export const QUOTA_MENUS = [
  "agari-score",
  "tenpai-score",
  "fu-score-exam",
  "score-exam",
] as const;
export type QuotaMenu = (typeof QUOTA_MENUS)[number];

const quotaMenuSet: ReadonlySet<string> = new Set(QUOTA_MENUS);

/** 文字列が回数制限の対象の練習か。Server Action がクライアントの入力を絞るのに使う */
export function isQuotaMenu(value: string): value is QuotaMenu {
  return quotaMenuSet.has(value);
}

/** 練習ごとのその日の回数 */
export type QuotaCounts = Readonly<Record<QuotaMenu, number>>;

/**
 * どの練習もまだ始めていない回数
 * 空の練習回数
 *
 * 未ログイン（web の cookie）とゲスト（アプリの端末）の数え方が、日の変わり目と
 * 保存値が読めないときに戻る値。回数制限の対象（`QUOTA_MENUS`）に練習を足したら
 * ここが型エラーになる。対象外の練習を足しても何も起きない。
 */
export const EMPTY_QUOTA_COUNTS: QuotaCounts = {
  "agari-score": 0,
  "tenpai-score": 0,
  "fu-score-exam": 0,
  "score-exam": 0,
};

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
 * 聴牌形の点数計算（`tenpai-score`）は 1 問が重い（待ちを全部読んでから
 * マスを埋める）ので少なめ、和了形の点数計算（`agari-score`）は 1 問が軽いので多め。
 * 1級・初段の模試は 1 問が和了形の点数計算と同じ重さなので同じ値。本番の
 * 合格ライン（1級 5 問・初段 4 問）が 1 日の枠に収まり、本番 1 回分の
 * 通しの模試が毎日できる。未ログインはどれも 1 問 — 「どんな練習か」を
 * 見せる分だけ。
 */
export const PRACTICE_QUOTA_LIMITS: Readonly<Record<QuotaMenu, QuotaLimit>> = {
  "tenpai-score": { signedIn: 3, anonymous: 1 },
  "agari-score": { signedIn: 5, anonymous: 1 },
  "fu-score-exam": { signedIn: 5, anonymous: 1 },
  "score-exam": { signedIn: 5, anonymous: 1 },
};
