import { formatJstDateLong } from "../jst";
import { NotificationType, isNotificationType } from "./types";

/**
 * 通知の文面 — 種別と metadata から辞書キーと差し込み値を決める
 * 通知文面
 *
 * 辞書は `notifications.messages.<key>`。web の通知ページとアプリの通知の画面が
 * 同じこれを呼び、同じ文面を出す。`switch` は `NotificationType` を網羅し
 * `never` で閉じるので、種別を足すとここを書くまで型検査が通らない。
 * DB から来る `type` は文字列のままなので、登録に無い値（退役した種別）は
 * 汎用の文面（`unknown`）に落として一覧を落とさない。
 */

/**
 * 文面に使う metadata の値
 * 通知文面メタデータ
 *
 * web は検証済みの `NotificationMetadata`（`lib/notifications/metadata.ts`）を、
 * アプリは API の応答の値を渡す。どちらも知らない値は文字列のまま来るので、
 * 比べるだけにして型を絞らない（知らない売り方・理由は汎用の文面に落ちる）。
 */
export interface NotificationMessageMetadata {
  /** 売り方（`PurchaseKind`）。購入の通知だけ */
  readonly kind?: string;
  /** 特典の終了（ISO 8601）。無期限なら持たない */
  readonly expiresAt?: string;
  /** 取り消しの理由（`PurchaseRevokeReason`）。購入の取り消しだけ */
  readonly revokeReason?: string;
}

/** 文面の辞書キーと差し込み値 */
export interface NotificationMessage {
  /** `notifications.messages` 配下のキー */
  readonly key: string;
  /** `t(key, values)` に渡す値 */
  readonly values?: Readonly<Record<string, string>>;
}

/** 期限を「2026年10月31日」（JST）にする。日時として読めなければ undefined */
function formatUntil(expiresAt: string | undefined): string | undefined {
  if (expiresAt === undefined) return undefined;
  const date = new Date(expiresAt);
  return Number.isNaN(date.getTime()) ? undefined : formatJstDateLong(date);
}

/** 文面を決める */
export function buildNotificationMessage(
  type: string,
  metadata: NotificationMessageMetadata,
): NotificationMessage {
  if (!isNotificationType(type)) return { key: "unknown" };

  const until = formatUntil(metadata.expiresAt);

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
