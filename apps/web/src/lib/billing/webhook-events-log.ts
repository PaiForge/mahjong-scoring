import { eq } from "drizzle-orm";
import "server-only";

import { db, stripeWebhookEvents } from "@/lib/db";

/**
 * Webhook イベントの重複排除
 * Webhook重複排除
 *
 * Stripe は同じイベントを複数回届ける（再送・並行配信）。処理済みの
 * `event.id` を `stripe_webhook_events` に残し、2 回目以降は処理しない。
 *
 * @design 記録は処理の **後**
 *
 * 先に記録してから処理すると、処理が失敗（500 → Stripe が再送）したときに
 * 再送が「処理済み」として捨てられ、二度と処理されない。処理が成功して
 * から記録する。並行して同じイベントが 2 本届いた場合は両方処理されうるが、
 * 購入の記録も取り消しも冪等（UNIQUE / 条件付き UPDATE）なので害がない。
 */

/** 処理済みか */
export async function hasProcessedWebhookEvent(
  eventId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ eventId: stripeWebhookEvents.eventId })
    .from(stripeWebhookEvents)
    .where(eq(stripeWebhookEvents.eventId, eventId))
    .limit(1);
  return row !== undefined;
}

/** 処理済みとして記録する（既にあれば何もしない） */
export async function markWebhookEventProcessed(
  eventId: string,
  eventType: string,
): Promise<void> {
  await db
    .insert(stripeWebhookEvents)
    .values({ eventId, eventType })
    .onConflictDoNothing({ target: stripeWebhookEvents.eventId });
}
