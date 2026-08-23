/**
 * ランキングのキャッシュタグ
 * ランキングキャッシュタグ
 *
 * 一覧（`get-leaderboard.ts`）と自分の順位（`get-user-ranks.ts`）は別々に
 * `unstable_cache` へ載せているが、無効化はまとめて行いたいので同じタグを共有する。
 * 文字列を各所に散らすと片方だけ purge され、順位と一覧が食い違う。
 */
export const LEADERBOARD_CACHE_TAG = "leaderboard";
