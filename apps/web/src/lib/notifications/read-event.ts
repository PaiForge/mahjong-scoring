/**
 * 「通知を既読にした」をタブ内で知らせるイベント
 * 既読イベント
 *
 * 通知ページで既読にしたとき、ヘッダーのベル（別のコンポーネントツリー）に
 * 未読数を取り直させるために `window` に投げる。サーバーの状態を押し出す
 * 仕組み（ポーリング・リアルタイム購読）は持たない — 未読数は 1 日に数回しか
 * 動かず、通知ページを開けば一覧は改めて引くため、ベルの数字が遅れても困らない。
 * 届いた通知はページを読み直したときに見える。
 *
 * クライアントとサーバーのどちらからも import できる（`window` には触らない）。
 */
export const NOTIFICATIONS_READ_EVENT = "mahjong-scoring:notifications-read";

/** 既読イベントを投げる（ブラウザ以外では何もしない） */
export function dispatchNotificationsRead(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT));
}
