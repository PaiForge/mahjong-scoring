import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/lib/auth';
import { getProfileByUserId } from '@/lib/db/queries';

/**
 * プロフィール作成済みユーザー用レイアウト。
 * プロフィールが存在しない場合は /mypage/setup-username へリダイレクト。
 *
 * 本登録レイアウト
 */
export default async function ConfirmedLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();
  const profile = await getProfileByUserId(user.id);

  if (!profile) {
    redirect('/mypage/setup-username');
  }

  return <>{children}</>;
}
