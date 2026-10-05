import { JST_TIME_ZONE } from "@mahjong-scoring/features/jst";

/**
 * 通知の日時を「2026/10/02 10:30」の形にする（JST）
 * 通知日時表示
 *
 * 相対表記（「3 日前」）にしない。サーバーで描いた文字列をそのまま出すので、
 * クライアントの時計とのずれでハイドレーションが崩れない。
 */
export function formatNotificationDate(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: JST_TIME_ZONE,
  }).format(date);
}
