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

/**
 * 練習セッションの先頭（{@link PRACTICE_SCROLL_ANCHOR_ID}）へ即時スクロールする。
 * 練習先頭へ戻す
 *
 * 手牌符のように縦に長い盤面では、画面下端のボタン（答え合わせ・わからない）を
 * 押した位置のまま止まるため、正誤表示も次の問題も画面外に残る。
 * マウント時（`useScrollToElement`）と同じ位置へ戻すことでこれを防ぐ。
 */
export function scrollToPracticeAnchor(): void {
  document
    .getElementById(PRACTICE_SCROLL_ANCHOR_ID)
    ?.scrollIntoView({ behavior: "instant", block: "start" });
}
