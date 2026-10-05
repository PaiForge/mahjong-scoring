/**
 * レッスンの本文（白カード）のスクロール先アンカー。
 * レッスンスクロールアンカー
 *
 * 確認問題・完了画面へ進んだときと次の問題へ進んだときに、ここを画面の
 * 先頭へ送る。練習（`PRACTICE_SCROLL_ANCHOR_ID`）と同じく `ContentContainer`
 * の `fillViewport` と組み、グローバルヘッダとタイトル帯を画面外へ出して
 * 問題を最上部に置く。説明の段階は読む画面なので送らない。
 */
export const LESSON_SCROLL_ANCHOR_ID = "lesson-body";
