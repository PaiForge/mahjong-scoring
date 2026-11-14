import { DEFAULT_LOCALE, type SupportedLocale } from "../i18n/locales";
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
  /** 運営が付与のときに書いた文（{@link BENEFIT_GRANT_MESSAGE_MAX_LENGTH}）。付与の通知だけ */
  readonly message?: string;
}

/**
 * 付与の通知に運営が書ける文の最大文字数
 * 付与の通知文の上限
 *
 * 管理画面の入力欄の `maxLength` とサーバーの検証が同じ値を使う。通知は一覧の
 * 1 行の題名として出るので、長文は想定しない。
 */
export const BENEFIT_GRANT_MESSAGE_MAX_LENGTH = 100;

/** 文面の辞書キーと差し込み値 */
export interface NotificationMessage {
  /** `notifications.messages` 配下のキー */
  readonly key: string;
  /** `t(key, values)` に渡す値 */
  readonly values?: Readonly<Record<string, string>>;
}

/**
 * 期限を「2026年10月31日」（JST。英語は「October 31, 2026」）にする。
 * 日時として読めなければ undefined
 */
function formatUntil(
  expiresAt: string | undefined,
  locale: SupportedLocale,
): string | undefined {
  if (expiresAt === undefined) return undefined;
  const date = new Date(expiresAt);
  return Number.isNaN(date.getTime())
    ? undefined
    : formatJstDateLong(date, locale);
}

/**
 * 文面を決める
 *
 * @param type - 通知の種別（DB の文字列のまま）
 * @param metadata - 差し込みに使う metadata
 * @param locale - 差し込む日付の言語（省略時は日本語。日本語固定のアプリは省略する）。
 *   期限の日付は言語に依らず JST で切り、表記だけ変える
 */
export function buildNotificationMessage(
  type: string,
  metadata: NotificationMessageMetadata,
  locale: SupportedLocale = DEFAULT_LOCALE,
): NotificationMessage {
  if (!isNotificationType(type)) return { key: "unknown" };

  const until = formatUntil(metadata.expiresAt, locale);

  switch (type) {
    case NotificationType.PurchaseCompleted:
      if (metadata.kind === "lifetime") {
        return { key: "purchaseCompletedLifetime" };
      }
      if (metadata.kind === "pass" && until) {
        return { key: "purchaseCompletedPass", values: { until } };
      }
      return { key: "purchaseCompleted" };
    case NotificationType.BenefitGranted: {
      // 運営が書いた文は既定の 1 文目（「運営から Pro が付与されました」）に替わる。
      // 期限の文は運営に書かせず辞書が足す（書き間違えた期限を出さない）。
      // 書いた文は 1 言語だけで、英語の画面でも入力したまま出る
      const message = metadata.message?.trim();
      if (message) {
        return until
          ? { key: "benefitGrantedCustomUntil", values: { message, until } }
          : { key: "benefitGrantedCustom", values: { message } };
      }
      return until
        ? { key: "benefitGrantedUntil", values: { until } }
        : { key: "benefitGranted" };
    }
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
