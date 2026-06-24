/**
 * 練習セッション（play / training）のスクロール先アンカー。
 * 練習スクロールアンカー
 *
 * `ContentContainer` の `id` に付与し、説明ページ・結果ページからの遷移リンクに
 * ハッシュ（`#practice-session`）として付けることで、クライアント遷移でも
 * ブラウザのネイティブスクロールでグローバルヘッダを画面外へ送る。
 * `useScrollToElement` は直接読み込み時のフォールバックとして併用する。
 */
export const PRACTICE_SCROLL_ANCHOR_ID = "practice-session";

/** ナビゲーション URL に付与するハッシュ（例: `/practice/jantou-fu/play#practice-session`） */
export const PRACTICE_SCROLL_HASH = `#${PRACTICE_SCROLL_ANCHOR_ID}`;
