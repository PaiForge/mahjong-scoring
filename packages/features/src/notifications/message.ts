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
  /** 運営が付与のときに書いたタイトル（一覧の 1 行）。付与の通知だけ */
  readonly title?: string;
  /** 運営が付与のときに書いた本文（行を開くと出る）。付与の通知だけ */
  readonly body?: string;
}

/**
 * 付与の通知に運営が書けるタイトルの最大文字数
 * 付与の通知タイトルの上限
 *
 * 管理画面の入力欄の `maxLength` とサーバーの検証が同じ値を使う。一覧の 1 行の
 * 題名なので短く抑える（長い文は本文に書く）。
 */
export const BENEFIT_GRANT_TITLE_MAX_LENGTH = 60;

/**
 * 付与の通知に運営が書ける本文の最大文字数
 * 付与の通知本文の上限
 */
export const BENEFIT_GRANT_BODY_MAX_LENGTH = 1000;

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
      // 運営が書いたタイトルはそのまま出す（期限の文を足さない — 運営の文と
      // 食い違うことがある）。何を伝えるかは運営がタイトルと本文で決める。
      // 書いた文は 1 言語だけで、英語の画面でも入力したまま出る
      const title = metadata.title?.trim();
      if (title) return { key: "benefitGrantedCustom", values: { title } };
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

/**
 * 行を開いたときに出す詳細
 * 通知詳細
 */
export interface NotificationDetail {
  /** 運営が書いた本文（改行を含み得る） */
  readonly body: string;
}

/**
 * 通知の詳細を決める。本文を持たない通知は undefined（行は遷移先へ進む）
 * 通知詳細決定
 *
 * いま本文を持つのは運営が本文を書いた付与の通知だけ。web とアプリの通知の一覧は、
 * 詳細がある行を押すと遷移せずにその場で開き、本文と遷移先へのリンクを出す。
 * 期間などの定型の文は足さない — 何を伝えるかはタイトルと本文で運営が決める。
 *
 * @param type - 通知の種別（DB の文字列のまま）
 * @param metadata - 差し込みに使う metadata
 */
export function buildNotificationDetail(
  type: string,
  metadata: NotificationMessageMetadata,
): NotificationDetail | undefined {
  if (type !== NotificationType.BenefitGranted) return undefined;
  const body = metadata.body?.trim();
  return body ? { body } : undefined;
}
