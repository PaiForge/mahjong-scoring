import { formatPlanDate } from "@/lib/billing/plan-status";
import type { NotificationMetadata } from "@/lib/notifications/metadata";
import {
  NotificationType,
  isNotificationType,
} from "@/lib/notifications/types";

/**
 * 通知の文面 — 種別と metadata から辞書キーと差し込み値を決める
 * 通知文面
 *
 * 辞書は `notifications.messages.<key>`。`switch` は `NotificationType` を
 * 網羅し `never` で閉じるので、種別を足すとここを書くまで型検査が通らない。
 * DB から来る `type` は文字列のままなので、登録に無い値（退役した種別）は
 * 汎用の文面（`unknown`）に落として一覧を落とさない。
 */

/** 文面の辞書キーと差し込み値 */
export interface NotificationMessage {
  /** `notifications.messages` 配下のキー */
  readonly key: string;
  /** `t(key, values)` に渡す値 */
  readonly values?: Readonly<Record<string, string>>;
}

/** 文面を決める */
export function buildNotificationMessage(
  type: string,
  metadata: NotificationMetadata,
): NotificationMessage {
  if (!isNotificationType(type)) return { key: "unknown" };

  const until = metadata.expiresAt
    ? formatPlanDate(new Date(metadata.expiresAt))
    : undefined;

  switch (type) {
    case NotificationType.PurchaseCompleted:
      if (metadata.kind === "lifetime") {
        return { key: "purchaseCompletedLifetime" };
      }
      if (metadata.kind === "pass" && until) {
        return { key: "purchaseCompletedPass", values: { until } };
      }
      return { key: "purchaseCompleted" };
    case NotificationType.BenefitGranted:
      return until
        ? { key: "benefitGrantedUntil", values: { until } }
        : { key: "benefitGranted" };
    case NotificationType.PlanExpired:
      return { key: "planExpired" };
    case NotificationType.PurchaseRevoked:
      return metadata.revokeReason === "refunded"
        ? { key: "purchaseRefunded" }
        : { key: "purchaseRevoked" };
    case NotificationType.BenefitGrantRevoked:
      return { key: "benefitGrantRevoked" };
    default: {
      // 種別を足したら上の分岐も足すこと（ここで型検査が止まる）
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}
