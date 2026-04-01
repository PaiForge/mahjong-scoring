import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/lib/auth';
import { getProfileByUserId } from '@/lib/db/queries';

/**
 * プロフィール未作成ユーザー用レイアウト。
 * プロフィールが既に存在する場合は /mypage へリダイレクト。
 *
 * 仮登録レイアウト
 */
export default async function ProvisionalLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();
  const profile = await getProfileByUserId(user.id);

  if (profile) {
    redirect('/mypage');
  }

  return <>{children}</>;
}
