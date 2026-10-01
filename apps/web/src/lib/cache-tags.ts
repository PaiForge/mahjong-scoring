/**
 * ランキングのキャッシュタグ
 * ランキングキャッシュタグ
 *
 * 一覧（`get-leaderboard.ts`）と自分の順位（`get-user-ranks.ts`）は別々に
 * `unstable_cache` へ載せているが、無効化はまとめて行いたいので同じタグを共有する。
 * 文字列を各所に散らすと片方だけ purge され、順位と一覧が食い違う。
 */
export const LEADERBOARD_CACHE_TAG = "leaderboard";

/**
 * ネイティブ広告のキャッシュタグ
 * 広告キャッシュタグ
 *
 * 各画面が読む広告（`lib/ads/creatives.ts`）はこのタグで `unstable_cache` に
 * 載る。管理画面の書き込みはすべて `revalidateAdCreatives()` 経由でこのタグを
 * 捨て、静的ページの広告も次のリクエストで入れ替わる。
 */
export const AD_CREATIVES_CACHE_TAG = "ad-creatives";

/**
 * 有料プランの表示価格のキャッシュタグ
 * 表示価格キャッシュタグ
 *
 * 料金ページが読む Stripe の Price（`lib/billing/prices.ts`）はこのタグで
 * `unstable_cache` に載る（1 日）。Dashboard で価格を改定してすぐ反映したい
 * ときに捨てる。管理画面に捨てる操作はまだ無い。
 */
export const PLAN_PRICES_CACHE_TAG = "plan-prices";
