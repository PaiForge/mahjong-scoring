import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

import { db, userRoles } from '../../../lib/db';
import { createClient } from '../../../lib/supabase/server';

interface AuthSuccess {
  userId: string;
}

interface AuthFailure {
  error: 'unauthorized';
}

type AuthResult = AuthSuccess | AuthFailure;

/**
 * 管理者認証チェック
 *
 * Supabase Auth でユーザー認証を確認し、user_roles テーブルで admin ロールを検証する。
 */
export async function requireAdmin(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'unauthorized' };
  }

  const [userRole] = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, user.id))
    .limit(1);

  if (!userRole || userRole.role !== 'admin') {
    return { error: 'unauthorized' };
  }

  return { userId: user.id };
}

/**
 * 管理ページ用の認証ガード。
 *
 * `requireAdmin()` に失敗したら `notFound()` で打ち切る。レイアウトではなく
 * 各ページで呼ぶことで、サイドバー（シェル）を即時描画しつつ、ページ本体の
 * 認証待ちとデータ取得を 1 つの loading 境界（各ルートの loading.tsx）で覆える。
 *
 * @returns 認証済みユーザーの ID
 */
export async function requireAdminPage(): Promise<string> {
  const result = await requireAdmin();

  if ('error' in result) {
    notFound();
  }

  return result.userId;
}
