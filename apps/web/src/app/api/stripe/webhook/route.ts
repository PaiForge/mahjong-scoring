import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripeSecretKey, getStripeWebhookSecret } from "@/lib/billing/env";
import { getStripe } from "@/lib/billing/stripe";
import {
  hasProcessedWebhookEvent,
  markWebhookEventProcessed,
} from "@/lib/billing/webhook-events-log";
import { dispatchStripeEvent } from "@/lib/billing/webhook-handlers";
import { logExternalError } from "@/lib/log-error";

/**
 * Stripe Webhook の受け口
 * Stripe Webhook
 *
 * @description
 * 購読イベントは `lib/billing/webhook-events.ts`。処理の中身は
 * `lib/billing/webhook-handlers.ts`。ここは次だけを行う:
 *
 * 1. 生のボディで署名を検証する（JSON に解釈してからでは検証できない）
 * 2. `livemode` が環境と一致するか（本番にテストのイベントが来たら 400）
 * 3. `event.id` で重複を弾く（処理済みなら 200 を返して終わる）
 * 4. 処理 → 成功したら処理済みとして記録
 *
 * 認証は署名のみ。proxy（セッション更新）は `/api/` を通らない。
 *
 * @design 応答コード
 *
 * - 400: 署名が無い・検証失敗・livemode 不一致。再送されても直らないので再送させない
 * - 500: DB 障害など一時的な失敗。Stripe が再送する（最長 3 日）
 * - 200: 処理した・処理済み・購読していない種別（記録もしない）。回復不能な見送り
 *   （知らない価格・未登録の顧客）も 200 — 再送で直らず、500 を返し続けると
 *   エンドポイントのエラー率で Stripe 側に無効化されうる。ログで追う
 */
export async function POST(request: Request): Promise<NextResponse> {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missingSignature" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      getStripeWebhookSecret(),
    );
  } catch (error) {
    logExternalError("stripe-webhook", "signature verification failed", error);
    return NextResponse.json({ error: "invalidSignature" }, { status: 400 });
  }

  if (event.livemode !== isLiveModeExpected()) {
    logExternalError(
      "stripe-webhook",
      `livemode mismatch: event ${event.id} livemode=${String(event.livemode)}`,
      undefined,
    );
    return NextResponse.json({ error: "livemodeMismatch" }, { status: 400 });
  }

  try {
    if (await hasProcessedWebhookEvent(event.id)) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    const handled = await dispatchStripeEvent(event);
    if (handled) await markWebhookEventProcessed(event.id, event.type);
  } catch (error) {
    logExternalError(
      "stripe-webhook",
      `failed to process ${event.type} (${event.id})`,
      error,
    );
    return NextResponse.json({ error: "processingFailed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/** 秘密鍵がライブモードのものなら、ライブモードのイベントだけを受ける */
function isLiveModeExpected(): boolean {
  return getStripeSecretKey().includes("_live_");
}
