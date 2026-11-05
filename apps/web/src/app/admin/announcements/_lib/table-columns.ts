/**
 * お知らせ一覧テーブル（スラッグ単位の表）の列（左から順）。辞書キー
 * `admin.announcements.<key>` と一致させる
 *
 * 見出し（page.tsx）とスケルトンの列数（loading.tsx）はこの配列から列数を取る。
 * 列を足す・消すときはここだけを直す
 */
export const ANNOUNCEMENT_TABLE_COLUMNS = [
  "locale",
  "title",
  "status",
  "publishedAt",
  "actions",
] as const;
