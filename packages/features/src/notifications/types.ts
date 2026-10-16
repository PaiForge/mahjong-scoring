/**
 * 通知の種別 — アプリが発する通知の値の閉じた集合
 * 通知種別
 *
 * `notifications.type` 列は varchar で、DB は値を制約しない。この一覧が唯一の
 * 登録簿で、次の仕掛けで集合が黙って広がらないようにしている:
 *
 * - 書き込み（web の `lib/notifications/create-notification.ts`）の `type` は
 *   この union。新しい値を発するにはまずここへ足す
 * - 文面（`message.ts`）と遷移先（`link.ts`）はこの union を `switch` で網羅し、
 *   `never` で閉じる。値を足すと両方を書くまで型検査が通らない — 「文面の無い
 *   通知」が出荷されない。web とアプリは同じ文面・同じ遷移先を読む
 *
 * 値は **保存されるデータ** なので改名しない。退役した値は古い行に残り得るため、
 * 読み取り側は未知の値を汎用の文面に落とす（例外にしない）。
 *
 * 種別は「ユーザーに見える出来事」で切る。Pro の期限切れは購入由来でも付与由来でも
 * 同じ文面・同じ遷移先なので 1 つ（`plan_expired`）、取り消しは文面が違う
 * （返金 / 付与の取り下げ）ので分ける。
 */
export const NotificationType = {
  /** Pro の購入が完了した。対象は `purchases` */
  PurchaseCompleted: "purchase_completed",
  /** 運営が Pro を付与した。対象は `benefit_grants` */
  BenefitGranted: "benefit_granted",
  /** Pro の期限が切れた。対象は `purchases` か `benefit_grants` */
  PlanExpired: "plan_expired",
  /** 購入が取り消された（返金・不正）。対象は `purchases` */
  PurchaseRevoked: "purchase_revoked",
  /** 付与が取り消された。対象は `benefit_grants` */
  BenefitGrantRevoked: "benefit_grant_revoked",
} as const;
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

/** すべての種別（網羅テスト・辞書の整合性検査用） */
export const NOTIFICATION_TYPES: readonly NotificationType[] =
  Object.values(NotificationType);

/** 文字列が登録済みの通知種別か */
export function isNotificationType(value: unknown): value is NotificationType {
  return (
    typeof value === "string" &&
    NOTIFICATION_TYPES.some((type) => type === value)
  );
}
