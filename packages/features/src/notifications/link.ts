import { MYPAGE_PLAN_PATH } from "../routes";
import { NotificationType, isNotificationType } from "./types";

/**
 * 通知を押したときの遷移先
 * 通知遷移先
 *
 * `switch` は `NotificationType` を網羅し `never` で閉じる（文面と同じ理由）。
 * 登録に無い種別は通知の一覧に留まる（遷移先なし）。
 *
 * いまの種別はすべて Pro プランの出来事なので、購入状況（`/mypage/plan`）へ
 * 送る。web は購入状況のページ、アプリ（iOS）はプラン画面で、どちらにも
 * 同じパスがある。
 *
 * @design 遷移先は両プラットフォームにあるパスに限る
 *
 * web とアプリが同じこれを読むので、web にしか無いページ（料金の `/plan`・
 * 特商法・Stripe の画面）を返さない。そうした行き先が要る種別を足すときは、
 * アプリでは遷移先なしにする分岐をここではなくアプリ側に持たせること。
 */
export function notificationHref(type: string): string | undefined {
  if (!isNotificationType(type)) return undefined;

  switch (type) {
    case NotificationType.PurchaseCompleted:
    case NotificationType.BenefitGranted:
    case NotificationType.PlanExpired:
    case NotificationType.PurchaseRevoked:
    case NotificationType.BenefitGrantRevoked:
      return MYPAGE_PLAN_PATH;
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}
