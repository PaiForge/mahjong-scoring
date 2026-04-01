import { eq } from 'drizzle-orm';

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
