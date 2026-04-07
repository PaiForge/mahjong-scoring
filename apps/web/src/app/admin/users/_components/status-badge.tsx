import { getTranslations } from 'next-intl/server';

interface StatusBadgeProps {
  readonly isBanned: boolean;
}

/**
 * ユーザーステータスバッジ（BAN済み / 有効）
 * ステータスバッジ
 */
export async function StatusBadge({ isBanned }: StatusBadgeProps) {
  const t = await getTranslations('Admin');

  if (isBanned) {
    return (
      <span className="inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        {t('usersTable.banned')}
      </span>
    );
  }

  return (
    <span className="inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      {t('usersTable.active')}
    </span>
  );
}
