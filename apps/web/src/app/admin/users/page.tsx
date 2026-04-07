import { getTranslations } from 'next-intl/server';

import type { User } from '@supabase/supabase-js';
import { PageTitle } from '@/app/_components/page-title';
import { inArray } from 'drizzle-orm';
import { createSearchParamsCache, parseAsInteger } from 'nuqs/server';

import { db, profiles } from '../../../lib/db';
import { getPaginationData, DEFAULT_PAGE_SIZE } from '../../../lib/pagination';
import { createClient } from '../../../lib/supabase/server';
import { createAdminClient } from '../../../lib/supabase/admin';
import { PaginationNav } from '../../_components/pagination-nav';

import type { Profile } from '../../../lib/db';
import { StatusBadge } from './_components/status-badge';
import { BanButton } from './_components/ban-button';
import { UnbanButton } from './_components/unban-button';

const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
});

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { page } = await searchParamsCache.parse(searchParams);
  const adminClient = createAdminClient();
  const t = await getTranslations('Admin');

  // 現在のユーザー ID を取得（自分自身の BAN を防ぐため）
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: usersData, error } = await adminClient.auth.admin.listUsers({
    page,
    perPage: DEFAULT_PAGE_SIZE,
  });
  if (error) {
    // Next.js error boundary に委任する意図的な throw
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  const users: User[] = usersData.users ?? [];
  const totalCount = usersData.total ?? 0;

  const pagination = getPaginationData(page, totalCount);

  const userIds = users.map((u) => u.id);
  const userProfiles: Profile[] =
    userIds.length > 0
      ? await db.select().from(profiles).where(inArray(profiles.id, userIds))
      : [];
  const profileMap = new Map(userProfiles.map((p) => [p.id, p]));

  const buildHref = (p: number) => `/admin/users?page=${String(p)}`;

  return (
    <div>
      <PageTitle className="mb-6">{t('users')}</PageTitle>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 font-medium">{t('usersTable.email')}</th>
              <th className="px-4 py-3 font-medium">{t('usersTable.username')}</th>
              <th className="px-4 py-3 font-medium">{t('usersTable.displayName')}</th>
              <th className="px-4 py-3 font-medium">{t('usersTable.status')}</th>
              <th className="px-4 py-3 font-medium">{t('usersTable.createdAt')}</th>
              <th className="px-4 py-3 font-medium">{t('usersTable.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  {t('usersTable.noUsersFound')}
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const profile = profileMap.get(user.id);
                const isBanned = profile?.bannedAt != null;
                const isCurrentUser = currentUser?.id === user.id;
                return (
                  <tr key={user.id} className="border-t border-gray-200">
                    <td className="px-4 py-3">{user.email ?? '-'}</td>
                    <td className="px-4 py-3">{profile?.username ?? '-'}</td>
                    <td className="px-4 py-3">{profile?.displayName ?? '-'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge isBanned={isBanned} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString('ja-JP')
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {!isCurrentUser && (
                        isBanned ? (
                          <UnbanButton targetUserId={user.id} />
                        ) : (
                          <BanButton targetUserId={user.id} />
                        )
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <PaginationNav
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        buildHref={buildHref}
      />
    </div>
  );
}
