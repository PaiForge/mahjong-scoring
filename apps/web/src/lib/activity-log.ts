import 'server-only';

import { db, userActivityLog } from './db';

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
