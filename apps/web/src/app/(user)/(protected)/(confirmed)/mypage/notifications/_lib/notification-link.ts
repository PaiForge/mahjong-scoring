import {
  NotificationType,
  isNotificationType,
} from "@/lib/notifications/types";

/**
 * 通知を押したときの遷移先
 * 通知遷移先
 *
 * `switch` は `NotificationType` を網羅し `never` で閉じる（文面と同じ理由）。
 * 登録に無い種別は通知ページに留まる（遷移先なし）。
 *
 * いまの種別はすべて Pro プランの出来事なので、マイページのプラン状況へ送る。
 */
export const MYPAGE_PLAN_HREF = "/mypage/plan";

/** 遷移先のパス。無ければ undefined */
export function notificationHref(type: string): string | undefined {
  if (!isNotificationType(type)) return undefined;

  switch (type) {
    case NotificationType.PurchaseCompleted:
    case NotificationType.BenefitGranted:
    case NotificationType.PlanExpired:
    case NotificationType.PurchaseRevoked:
    case NotificationType.BenefitGrantRevoked:
      return MYPAGE_PLAN_HREF;
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}
