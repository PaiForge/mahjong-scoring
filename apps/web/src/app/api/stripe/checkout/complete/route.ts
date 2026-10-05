import { NextResponse } from "next/server";

import { jsonPrivate } from "@/lib/api-response";
import { getOptionalVerifiedUser } from "@/lib/auth";
import { getStripeCustomerId } from "@/lib/billing/customer";
import { recordPurchaseFromCheckoutSession } from "@/lib/billing/purchases";
import { getStripe } from "@/lib/billing/stripe";
import { logExternalError } from "@/lib/log-error";
import { enforceIpRateLimit } from "@/lib/rate-limit-ip";
import { buildSignInHref } from "@/lib/redirect";

/** Checkout 完了後に着地するマイページのパス */
const MYPAGE_PLAN_PATH = "/mypage/plan";

/**
 * Stripe Checkout の完了着地
 * Checkout完了着地
 *
 * @description
 * Checkout の `success_url`。Stripe の決済画面から
 * `?session_id=cs_...` 付きでここへ戻ってくる。Webhook より先に着くことが
 * 多いので、ここで Session を取り直して購入を同期的に記録してから
 * マイページへ送る。マイページに着いた時点で特典が付いている。
 * Webhook 側も同じ記録処理を呼ぶが、`stripe_checkout_session_id` の UNIQUE で
 * 1 行になる。
 *
 * @design 所有者の検証
 *
 * `session_id` は URL に載る値で、他人のものを貼れる。Session の `customer` が
 * **ログインしているユーザーの** `stripe_customers` と一致しなければ 403 にし、
 * 記録しない（他人の購入を自分に付けられない。Webhook 側は顧客対応から
 * 所有者を決めるので、そもそも貼った人には付かないが、ここで記録を
 * 走らせる理由も無い）。
 *
 * @design 認証は `authorizeApiRequest` を使わない
 *
 * あれは `Origin` ヘッダを要求する（CSRF 対策）が、Stripe からのリダイレクトで
 * 戻るトップレベルのナビゲーションは `Origin` を持たない。この着地は状態を
 * 変えるといっても「本人の支払い済み Session を本人に記録する」だけで、
 * 所有者の検証が CSRF の守りを兼ねる。
 *
 * @design 戻り先はリクエストのオリジン
 *
 * `SITE_URL` はローカルで本番 URL に落ちる。認証のコールバックと同じく
 * `new URL(request.url).origin` を使う。
 *
 * @design 未ログインならこの着地へ戻すサインインに送る
 *
 * `?session_id=` ごとサインインの `redirect` に載せる。所有者の検証は
 * サインイン後に改めて走るので、`session_id` を知っているだけでは
 * 何も得られない点は変わらない。
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin, pathname, search } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  const toPlan = (status?: string) =>
    NextResponse.redirect(
      `${origin}${MYPAGE_PLAN_PATH}${status ? `?status=${status}` : ""}`,
    );

  if (!sessionId) return toPlan();

  const rateLimited = await enforceIpRateLimit("completeCheckout");
  if (rateLimited) {
    return jsonPrivate({ error: "rateLimited" }, { status: 429 });
  }

  const user = await getOptionalVerifiedUser();
  if (!user) {
    // Stripe の画面に居る間にログインが切れた（別のブラウザで支払った）
    // 場合。戻り先はこの着地そのもの（`session_id` 込み）にして、サインイン後に
    // 同期記録と結果表示をやり直す。マイページに直接戻すと `session_id` が
    // 失われ、Webhook が遅れている間は支払い直後なのに「無料プラン」が見える
    return NextResponse.redirect(
      `${origin}${buildSignInHref(`${pathname}${search}`)}`,
    );
  }

  try {
    const [session, ownCustomerId] = await Promise.all([
      getStripe().checkout.sessions.retrieve(sessionId, {
        expand: ["line_items"],
      }),
      getStripeCustomerId(user.id),
    ]);

    const sessionCustomerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;
    if (!ownCustomerId || sessionCustomerId !== ownCustomerId) {
      logExternalError(
        "checkout-complete",
        `session ${sessionId} does not belong to user ${user.id}`,
        undefined,
      );
      return jsonPrivate({ error: "forbidden" }, { status: 403 });
    }

    const result = await recordPurchaseFromCheckoutSession(session);
    if (result.outcome === "ignored" && result.reason === "notPaid") {
      // 非同期の支払い方法（いまは使わない）で未確定のまま戻った場合
      return toPlan("pending");
    }
    if (result.outcome === "ignored") {
      logExternalError(
        "checkout-complete",
        `purchase ignored: ${result.reason}`,
        undefined,
      );
      return toPlan("failed");
    }
    return toPlan(result.outcome === "recorded" ? "success" : undefined);
  } catch (error) {
    // Stripe や DB の一時的な失敗。Webhook が後から記録するので、
    // ユーザーはマイページで結果を待てる
    logExternalError(
      "checkout-complete",
      `failed to record session ${sessionId}`,
      error,
    );
    return toPlan("pending");
  }
}
