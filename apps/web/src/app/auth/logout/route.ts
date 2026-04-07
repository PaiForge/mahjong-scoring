import { NextResponse } from 'next/server';

import { logActivityEvent } from '../../../lib/activity-log';
import { createClient } from '../../../lib/supabase/server';

/**
 * ログアウト Route Handler。
 * アクティビティログ記録後にサインアウトする。
 * ログアウトAPI
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    logActivityEvent({ userId: user.id, action: 'logout' });
  }

  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
