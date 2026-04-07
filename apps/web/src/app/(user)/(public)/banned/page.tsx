import { desc, eq, and } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { PageTitle } from '@/app/_components/page-title';
import { ContentContainer } from '@/app/_components/content-container';
import { isUserBanned } from '../../../../lib/ban';
import { db, moderationActions } from '../../../../lib/db';
import { createClient } from '../../../../lib/supabase/server';

/**
 * BAN ページ
 *
 * @description BAN されたユーザーに表示されるページ。BAN 理由を表示する。
 * @flow 認証チェック → BAN チェック → 最新の BAN 理由を取得して表示
 */
export default async function BannedPage() {
  const t = await getTranslations('banned');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未認証ならサインインへ
  if (!user) {
    redirect('/sign-in');
  }

  // BAN されていなければホームへ
  const banned = await isUserBanned(user.id);
  if (!banned) {
    redirect('/');
  }

  // 最新の BAN 理由を取得
  const [latestBan] = await db
    .select({ reason: moderationActions.reason })
    .from(moderationActions)
    .where(
      and(
        eq(moderationActions.targetId, user.id),
        eq(moderationActions.action, 'ban'),
      ),
    )
    .orderBy(desc(moderationActions.createdAt))
    .limit(1);

  const reason = latestBan?.reason;

  return (
    <ContentContainer>
      <div className="py-12 text-center">
        <PageTitle className="mb-6">{t('title')}</PageTitle>
        <p className="mb-4 text-gray-600">{t('message')}</p>
        {reason && (
          <p className="mb-4 rounded bg-red-50 px-4 py-3 text-sm text-red-700">
            {t('reason', { reason })}
          </p>
        )}
        <p className="text-sm text-gray-500">{t('contact')}</p>
      </div>
    </ContentContainer>
  );
}
