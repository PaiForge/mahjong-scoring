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
 * web とアプリ（iOS）が同じこれを読むので、web にしか無いページ（料金の
 * `/plan`・特商法・Stripe の画面）を返さない。アプリはそれらに触れない
 * （App Store の審査ガイドライン 3.1.1。`apps/mobile/CLAUDE.md`）。そうした
 * 行き先が要る種別を足すときは、web とアプリで行き先を分ける引数をここに足し、
 * アプリでは遷移先なし（押せない行）にする。
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
