import "server-only";

import { db, userActivityLog } from "./db";
import type { createClient } from "./supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface ActivityEvent {
  readonly userId: string;
  readonly action: string;
  readonly targetType?: string;
  readonly targetId?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * ユーザーアクティビティイベントを記録する。
 * fire-and-forget 方式で、失敗時はサイレントに無視する。
 * メイン処理を阻害しないことを最優先とする。
 * アクティビティイベント記録
 */
export function logActivityEvent(event: ActivityEvent): void {
  db.insert(userActivityLog)
    .values({
      userId: event.userId,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      metadata: event.metadata ?? {},
    })
    .then(() => {})
    .catch(() => {});
}

/**
 * 現在の認証ユーザーを取得し、そのユーザーに対するイベントを記録する。
 * 未認証時は何もしない。
 * 認証ユーザーのイベント記録
 *
 * ログイン・パスワード変更・ログアウトなど「直前に認証された本人」の
 * 操作ログで共有する。
 */
export async function logCurrentUserEvent(
  supabase: SupabaseServerClient,
  action: string,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    logActivityEvent({ userId: user.id, action });
  }
}
