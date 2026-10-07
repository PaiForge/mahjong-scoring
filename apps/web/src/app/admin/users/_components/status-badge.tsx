import { getTranslations } from "next-intl/server";

import { UserStatus } from "../_lib/user-status";
import { adminChipClasses } from "../../_lib/chip-classes";

interface StatusBadgeProps {
  readonly status: UserStatus;
}

/**
 * 状態ごとのバッジの色。有効は大半の行が該当するため塗らず、
 * それ以外の状態だけが一覧で目に留まるようにする。
 */
const STATUS_CLASSES: Record<UserStatus, string> = {
  [UserStatus.Provisional]: adminChipClasses("warning"),
  [UserStatus.Deleted]: adminChipClasses("neutral"),
  [UserStatus.Banned]: adminChipClasses("danger"),
  [UserStatus.Active]:
    "inline-flex items-center px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-surface-600",
};

/**
 * ユーザーステータスバッジ（仮登録 / 退会済み / BAN済み / 有効）
 * ステータスバッジ
 */
export async function StatusBadge({ status }: StatusBadgeProps) {
  const t = await getTranslations("admin");

  return (
    <span className={STATUS_CLASSES[status]}>
      {t(`usersTable.statuses.${status}`)}
    </span>
  );
}
