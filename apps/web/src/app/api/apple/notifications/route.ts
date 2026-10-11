import { NextResponse } from "next/server";
import { z } from "zod";

import { getAppleSignedDataVerifier } from "@/lib/billing/apple/default-verifier";
import {
  hasProcessedAppleNotification,
  markAppleNotificationProcessed,
} from "@/lib/billing/apple/notification-events";
import {
  dispatchAppleNotification,
  notificationTransactionId,
} from "@/lib/billing/apple/notifications";
import { logExternalError } from "@/lib/log-error";

const bodySchema = z.object({ signedPayload: z.string().min(1) });

/**
 * App Store Server Notifications（V2）の受け口
 * App Store通知
 *
 * @description
 * 処理の中身は `lib/billing/apple/notifications.ts`。ここは次だけを行う:
 *
 * 1. 本文の `signedPayload` を検証する（外側の通知と内側の署名付き取引の両方）
 * 2. `notificationUUID` で重複を弾く（処理済みなら 200 を返して終わる）
 * 3. 処理 → 扱う種別なら処理済みとして記録（取引を指す種別は取引 ID 付き）
 *
 * 認証は署名のみ（Apple の送信元を IP で絞らない）。Production と Sandbox の
 * 通知が同じ URL に届き、検証器が課金環境ごとに検証する。
 *
 * @design 応答コード（Stripe の受け口と同じ方針）
 *
 * - 400: 本文が無い・署名が通らない。送り直されても直らない
 * - 500: 検証器が無い（設定の不備）・Apple に届かず検証できない・DB 障害。
 *   Apple が再送する（間隔を空けて最長 3 日ほど）。設定の不備も 500 にするのは、
 *   再送させている間に気付いて直せば通知を失わないため
 * - 200: 処理した・処理済み・扱わない種別（記録もしない）
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = bodySchema.safeParse(
    await request.json().catch(() => undefined),
  );
  if (!body.success) {
    return NextResponse.json({ error: "invalidRequest" }, { status: 400 });
  }

  const verifier = getAppleSignedDataVerifier();
  if (!verifier) {
    logExternalError(
      "apple-notification",
      "APPLE_IAP_APP_APPLE_ID is not set; cannot verify notifications",
      undefined,
    );
    return NextResponse.json({ error: "notConfigured" }, { status: 500 });
  }

  const verified = await verifier.verifyNotification(body.data.signedPayload);
  if (!verified.ok) {
    if (verified.reason === "unavailable") {
      return NextResponse.json({ error: "unavailable" }, { status: 500 });
    }
    logExternalError(
      "apple-notification",
      "signature verification failed",
      undefined,
    );
    return NextResponse.json({ error: "invalidSignature" }, { status: 400 });
  }
  const notification = verified.value;

  try {
    if (await hasProcessedAppleNotification(notification.notificationUuid)) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    const handled = await dispatchAppleNotification(notification);
    if (handled) {
      await markAppleNotificationProcessed({
        notificationUuid: notification.notificationUuid,
        notificationType: notification.notificationType,
        subtype: notification.subtype,
        transactionId: notificationTransactionId(notification),
      });
    }
  } catch (error) {
    logExternalError(
      "apple-notification",
      `failed to process ${notification.notificationType} (${notification.notificationUuid})`,
      error,
    );
    return NextResponse.json({ error: "processingFailed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
