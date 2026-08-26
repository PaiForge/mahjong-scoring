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
 * 練習セッションの先頭（{@link PRACTICE_SCROLL_ANCHOR_ID}）へスクロールする。
 * 練習先頭へ戻す
 *
 * 回答・開示・次へ進むのボタンは盤面下端やフッターにあるため、押した位置の
 * まま止まると、盤面上部に出る正誤表示も続けて差し替わる次の問題も画面外に
 * 残る。手牌符・点数計算総合演習のように縦に長い練習で顕著なので、表示が
 * 切り替わる操作のたびにマウント時（`useScrollToElement`）と同じ位置へ戻す。
 *
 * マウント時と違い操作の続きとして動くので、どこへ運ばれたのかが分かるよう
 * 滑らかにスクロールする。動きを減らす設定の環境では即時に切り替える。
 */
export function scrollToPracticeAnchor(): void {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  document.getElementById(PRACTICE_SCROLL_ANCHOR_ID)?.scrollIntoView({
    behavior: prefersReducedMotion ? "instant" : "smooth",
    block: "start",
  });
}
