import "server-only";

import { db, userActivityLog } from "./db";
import { logExternalError } from "./log-error";

interface ActivityEvent {
  readonly userId: string;
  readonly action: string;
  readonly targetType?: string;
  readonly targetId?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * ユーザーアクティビティイベントを記録する。
 * fire-and-forget 方式で、失敗してもメイン処理には伝えない（阻害しないことを
 * 最優先とする）。失敗はログにだけ残し、書き込みが落ち続けても気づけるようにする。
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
    .catch((error: unknown) => {
      logExternalError(
        "logActivityEvent",
        `failed to record ${event.action}`,
        error,
      );
    });
}
