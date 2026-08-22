import Link from "next/link";

import { UserAvatar } from "@/app/(user)/_components/user-avatar";
import type { RankedLeaderboardRow } from "@/lib/db/leaderboard-queries";

interface PlayerCellProps {
  readonly row: RankedLeaderboardRow;
}

/**
 * プレイヤーセル
 * リーダーボードのプレイヤー情報表示
 */
export function PlayerCell({ row }: PlayerCellProps) {
  const name = row.displayName ?? row.username;

  return (
    <Link
      href={`/u/${row.username}`}
      className="flex items-center gap-3 min-w-0 rounded-lg transition-colors hover:bg-surface-100"
    >
      <UserAvatar avatarUrl={row.avatarUrl ?? null} name={name} size="sm" />
      <div className="min-w-0">
        <span className="text-sm font-medium text-surface-700 truncate block hover:text-surface-900">
          {name}
        </span>
      </div>
    </Link>
  );
}
