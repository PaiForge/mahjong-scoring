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

/**
 * 説明ページの出題設定セクションのアンカー。
 * 出題設定アンカー
 *
 * 結果ページの「設定を変更する」から説明ページの設定セクションへ直接送るために
 * 使う。設定を持つ練習（レジストリの `hasSetup`）の説明ページが `id` に付ける。
 */
export const PRACTICE_SETUP_ANCHOR_ID = "practice-setup";

/** ナビゲーション URL に付与するハッシュ（例: `/practice/score-table#practice-setup`） */
export const PRACTICE_SETUP_HASH = `#${PRACTICE_SETUP_ANCHOR_ID}`;
