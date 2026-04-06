import { NextResponse } from 'next/server';

import { getClientIp } from '@/lib/client-ip';
import { db, profiles } from '@/lib/db';
import { extractPgErrorCode } from '@/lib/db/extract-pg-error-code';
import { profileExistsByUserId } from '@/lib/db/queries';
import { IP_RATE_LIMITS, checkIpRateLimitGuard } from '@/lib/rate-limit-ip';
import { createClient } from '@/lib/supabase/server';
import { validateUsername } from '@/lib/username';

const PG_UNIQUE_VIOLATION = '23505';

/**
 * ユーザー名登録エンドポイント。
 * 初回ログイン後にプロフィールを作成する。
 *
 * ユーザー名登録API
 */
export async function POST(request: Request) {
  const ipRateLimited = checkIpRateLimitGuard(
    await getClientIp(),
    'username',
    IP_RATE_LIMITS.username,
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

  let body: { username?: string; displayName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const username = body.username?.trim();
  if (!username) {
    return NextResponse.json({ error: 'username_required' }, { status: 400 });
  }

  const displayName = body.displayName?.trim() || username;

  const validationError = validateUsername(username);
  if (validationError) {
    const status = validationError === 'reserved' ? 409 : 400;
    return NextResponse.json({ error: validationError }, { status });
  }

  // Check if profile already exists (prevent double creation)
  if (await profileExistsByUserId(user.id)) {
    return NextResponse.json({ error: 'username_already_set' }, { status: 409 });
  }

  // Create profile with chosen username.
  // The DB UNIQUE constraint on username handles race conditions.
  try {
    await db.insert(profiles).values({
      id: user.id,
      username,
      displayName,
    });
  } catch (e) {
    if (extractPgErrorCode(e) === PG_UNIQUE_VIOLATION) {
      return NextResponse.json({ error: 'username_taken' }, { status: 409 });
    }
    throw e;
  }

  return NextResponse.json({ success: true });
}
