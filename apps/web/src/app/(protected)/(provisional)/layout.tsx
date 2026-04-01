import { redirect } from 'next/navigation';

import { getAuthenticatedProfile } from '@/lib/auth';

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
  const { profile } = await getAuthenticatedProfile();

  if (profile) {
    redirect('/mypage');
  }

  return <>{children}</>;
}
