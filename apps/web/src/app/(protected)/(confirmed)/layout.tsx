import { redirect } from 'next/navigation';

import { getAuthenticatedProfile } from '@/lib/auth';

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
  const { profile } = await getAuthenticatedProfile();

  if (!profile) {
    redirect('/mypage/setup-username');
  }

  return <>{children}</>;
}
