import { JST_TIME_ZONE } from "@mahjong-scoring/features/jst";

/**
 * 管理画面の日時表示ロケール
 *
 * 管理画面は運用者向けで日本語固定。エンドユーザー向けの画面は next-intl の
 * ロケールに従うため、こちらの関数を使ってはいけない
 * （お知らせの公開日なら features の `announcements/format.ts` の
 * `formatPublishedDate` のように、ロケールを受け取る関数を使う）。
 */
const ADMIN_LOCALE = "ja-JP";

/**
 * 管理画面の日時表示オプション
 *
 * 呼び出し元はサーバーコンポーネントで、Vercel のサーバーは UTC。タイムゾーンを
 * 渡さないと UTC の時刻・日付で出て、JST の 0〜9 時の記録が前日の日付になる。
 * アプリの日付境界と同じ JST で表示する。
 */
const ADMIN_DATE_OPTIONS = { timeZone: JST_TIME_ZONE } as const;

/** 値が未設定のときに表示する文字列 */
const EMPTY = "-";

/**
 * 管理画面の日時（年月日 + 時刻）を整形する
 * 管理日時フォーマット
 *
 * @param value - 日時。未設定なら `-` を返す
 */
export function formatAdminDateTime(
  value: Date | string | null | undefined,
): string {
  if (!value) return EMPTY;
  return new Date(value).toLocaleString(ADMIN_LOCALE, ADMIN_DATE_OPTIONS);
}

/**
 * 管理画面の日付（年月日）を整形する
 * 管理日付フォーマット
 *
 * @param value - 日付。未設定なら `-` を返す
 */
export function formatAdminDate(
  value: Date | string | null | undefined,
): string {
  if (!value) return EMPTY;
  return new Date(value).toLocaleDateString(ADMIN_LOCALE, ADMIN_DATE_OPTIONS);
}
