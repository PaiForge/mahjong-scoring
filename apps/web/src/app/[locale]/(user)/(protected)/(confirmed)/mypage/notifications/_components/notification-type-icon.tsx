import { CheckIcon } from "@/app/[locale]/(user)/_components/icons/check-icon";
import { GiftIcon } from "@/app/[locale]/(user)/_components/icons/gift-icon";
import { ClockIcon } from "@/app/[locale]/(user)/_components/icons/clock-icon";
import { XMarkIcon } from "@/app/[locale]/(user)/_components/icons/x-mark-icon";
import {
  NotificationType,
  isNotificationType,
} from "@mahjong-scoring/features/notifications/types";

interface NotificationTypeIconProps {
  readonly type: string;
}

/**
 * 通知の行頭に置く種別のアイコン
 * 通知種別アイコン
 *
 * 行の「先頭の視覚要素」のスロット。行為者を持つ通知（フォロー等）が来たら
 * ここをアバターに差し替える。装飾なので読み上げない（文面が内容を持つ）。
 *
 * 良い知らせは緑（購入はチェック、運営からの付与はプレゼント）、期限切れは時計、取り消しは赤のバツ。
 * 影は付けない（押せる面の記号なので）。登録に無い種別（DB に残った古い値等）は
 * 期限切れと同じ中立の時計にする。`switch` は `never` で閉じ、種別を足したら
 * ここも型エラーで気づけるようにする（遷移先・文面と同じ）。
 */
export function NotificationTypeIcon({ type }: NotificationTypeIconProps) {
  const { icon, tone } = appearanceOf(type);
  return (
    <span
      aria-hidden="true"
      className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 ${tone}`}
    >
      {icon}
    </span>
  );
}

/** 良い知らせ（購入・付与）の色 */
const GOOD_NEWS_TONE = "border-success bg-success-subtle text-success-strong";

const NEUTRAL = {
  icon: <ClockIcon className="size-4" />,
  tone: "border-surface-300 bg-surface-50 text-surface-600",
};

function appearanceOf(type: string) {
  if (!isNotificationType(type)) return NEUTRAL;

  switch (type) {
    case NotificationType.PurchaseCompleted:
      return { icon: <CheckIcon className="size-4" />, tone: GOOD_NEWS_TONE };
    case NotificationType.BenefitGranted:
      return { icon: <GiftIcon className="size-4" />, tone: GOOD_NEWS_TONE };
    case NotificationType.PurchaseRevoked:
    case NotificationType.BenefitGrantRevoked:
      return {
        icon: <XMarkIcon className="size-4" />,
        tone: "border-destructive bg-destructive-subtle text-destructive",
      };
    case NotificationType.PlanExpired:
      return NEUTRAL;
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}
