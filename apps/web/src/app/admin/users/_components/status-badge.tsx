import { getTranslations } from "next-intl/server";

import { UserStatus } from "../_lib/user-status";

interface StatusBadgeProps {
  readonly status: UserStatus;
}

/** 状態ごとのバッジの色 */
const STATUS_CLASSES: Record<UserStatus, string> = {
  [UserStatus.Provisional]: "bg-amber-100 text-amber-800",
  [UserStatus.Deleted]: "bg-surface-100 text-surface-600",
  [UserStatus.Banned]: "bg-red-100 text-red-700",
  [UserStatus.Active]: "text-surface-600",
};

/**
 * ユーザーステータスバッジ（仮登録 / 退会済み / BAN済み / 有効）
 * ステータスバッジ
 */
export async function StatusBadge({ status }: StatusBadgeProps) {
  const t = await getTranslations("admin");

  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_CLASSES[status]}`}
    >
      {t(`usersTable.statuses.${status}`)}
    </span>
  );
}
