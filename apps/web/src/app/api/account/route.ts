import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { logActivityEvent } from '@/lib/activity-log';
import { getClientIp } from '@/lib/client-ip';
import { db, profiles } from '@/lib/db';
import { IP_RATE_LIMITS, checkIpRateLimitGuard } from '@/lib/rate-limit-ip';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * アカウント退会エンドポイント。
 *
 * `profiles.id` は `auth.users(id)` に対し ON DELETE RESTRICT のため物理削除はできない。
 * Supabase Admin API のソフトデリート（`deleteUser(id, true)`）で auth ユーザーを無効化し、
 * プロフィールの個人情報を NULL 化したうえで `deletedAt` を記録する。
 * username は再利用防止のため保持する。スコア・ランキングデータは保持する。
 *
 * アカウント退会API
 */
export async function DELETE() {
  const ipRateLimited = checkIpRateLimitGuard(
    await getClientIp(),
    'deleteAccount',
    IP_RATE_LIMITS.deleteAccount,
  );
  if (ipRateLimited) {
    return NextResponse.json({ error: 'rateLimited' }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // auth ユーザーを先にソフトデリートする。失敗時はプロフィールを更新しない。
  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(user.id, true);
  if (error) {
    return NextResponse.json({ error: 'deleteFailed' }, { status: 500 });
  }

  // 個人情報を NULL 化し、退会日時を記録する（username は再利用防止のため保持）。
  await db
    .update(profiles)
    .set({
      displayName: null,
      avatarUrl: null,
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, user.id));

  logActivityEvent({
    userId: user.id,
    action: 'delete_account',
    targetType: 'user',
    targetId: user.id,
  });

  return NextResponse.json({ success: true });
}
