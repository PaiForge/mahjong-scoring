import { NextResponse } from 'next/server';

import { getProfileByUserId } from '@/lib/db/queries';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth コールバックハンドラ。
 * Google OAuth の認可コードをセッションに交換する。
 *
 * Note: ログインセッションはユーザー名設定前にここで確立される。
 * OAuth の認可コードは使い捨てかつ短命であるため、即座に交換しないと
 * ユーザーの identity を失う。プロフィール未作成ユーザーは
 * setup-username ページにリダイレクトし、confirmed レイアウトガードが
 * オンボーディング完了まで他ページへのアクセスを防ぐ。
 *
 * OAuth認証コールバック
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/mypage';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/mypage';

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const userId = data.session.user.id;

      const profile = await getProfileByUserId(userId);

      if (!profile) {
        return NextResponse.redirect(`${origin}/mypage/setup-username`);
      }

      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_error`);
}
