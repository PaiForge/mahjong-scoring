import Image from 'next/image';

import type { LeaderboardRow } from '../_lib/types';

interface PlayerCellProps {
  readonly row: LeaderboardRow;
}

/**
 * プレイヤーセル
 * リーダーボードのプレイヤー情報表示
 */
export function PlayerCell({ row }: PlayerCellProps) {
  const name = row.displayName ?? row.username;

  return (
    <div className="flex items-center gap-3 min-w-0">
      {row.avatarUrl ? (
        <Image
          src={row.avatarUrl}
          alt={name}
          width={32}
          height={32}
          className="rounded-full object-cover h-8 w-8 flex-shrink-0"
          unoptimized
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-100 text-surface-400 flex-shrink-0">
          <span className="text-sm font-medium">{name.charAt(0).toUpperCase()}</span>
        </div>
      )}
      <div className="min-w-0">
        <span className="text-sm font-medium text-surface-700 truncate block">{name}</span>
      </div>
    </div>
  );
}
