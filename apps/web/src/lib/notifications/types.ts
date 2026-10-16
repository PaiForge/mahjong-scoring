/**
 * 通知の対象の表
 * 通知対象種別
 *
 * `notifications.target_type` の値。対象の行の id（`target_id`）と対で入り、
 * 一意インデックスの一部として「同じ事実には 1 通知」を担う。
 *
 * 通知の種別（`notifications.type`）は web とアプリが同じ文面を出すため
 * `@mahjong-scoring/features/notifications/types` に置いている。こちらは
 * 書き込み側（サーバー）だけが使う。
 */
export const NotificationTargetType = {
  Purchase: "purchase",
  BenefitGrant: "benefit_grant",
} as const;
export type NotificationTargetType =
  (typeof NotificationTargetType)[keyof typeof NotificationTargetType];
