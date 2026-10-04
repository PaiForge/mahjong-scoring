import { CheckIcon } from "@/app/(user)/_components/icons/check-icon";
import { ClockIcon } from "@/app/(user)/_components/icons/clock-icon";
import { XMarkIcon } from "@/app/(user)/_components/icons/x-mark-icon";
import {
  NotificationType,
  isNotificationType,
} from "@/lib/notifications/types";

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
 * 良い知らせ（購入・付与）は緑のチェック、期限切れは時計、取り消しは赤のバツ。
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

const NEUTRAL = {
  icon: <ClockIcon className="size-4" />,
  tone: "border-surface-300 bg-surface-50 text-surface-600",
};

function appearanceOf(type: string) {
  if (!isNotificationType(type)) return NEUTRAL;

  switch (type) {
    case NotificationType.PurchaseCompleted:
    case NotificationType.BenefitGranted:
      return {
        icon: <CheckIcon className="size-4" />,
        tone: "border-primary-500 bg-primary-50 text-primary-700",
      };
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
