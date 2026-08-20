/**
 * Drizzle スキーマのテスト用スタブ
 * スキーマモック
 *
 * クエリの組み立て（どのカラムを参照したか）だけを検証するテストでは、
 * 実スキーマの代わりにカラム名の対応表があれば足りる。実スキーマに
 * カラムが増えたときの追随漏れを防ぐため定義を1箇所にまとめる。
 *
 * このモジュールはテスト専用。
 */

/** learn_chapter_reads のカラム */
export const learnChapterReads = {
  userId: "user_id",
  chapterSlug: "chapter_slug",
} as const;

/** profiles のカラム（ユーザー名登録で参照するものだけ） */
export const profiles = {
  id: "id",
  username: "username",
  displayName: "display_name",
} as const;
