'use server';

import type { ActionResult } from '@/lib/action-types';
import { logActivityEvent } from '@/lib/activity-log';
import { getClientIp } from '@/lib/client-ip';
import { IP_RATE_LIMITS, checkIpRateLimitGuard } from '@/lib/rate-limit-ip';
import { createClient } from '@/lib/supabase/server';
import { getPasswordValidationError } from '@/lib/validations/password';

export type ResetPasswordResult = ActionResult;

/**
 * パスワード再設定 Server Action。
 * レートリミット付きでサーバーサイドから Supabase の updateUser を呼び出す。
 * パスワード再設定
 */
export async function resetPassword(
  password: string,
): Promise<ResetPasswordResult> {
  const ipRateLimited = checkIpRateLimitGuard(
    await getClientIp(),
    'resetPassword',
    IP_RATE_LIMITS.resetPassword,
  );
  if (ipRateLimited) {
    return ipRateLimited;
  }

  const passwordError = getPasswordValidationError(password);
  if (passwordError) {
    return { error: `password:${passwordError}` };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: 'updateFailed' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    logActivityEvent({ userId: user.id, action: 'change_password' });
  }

  return { success: true };
}
