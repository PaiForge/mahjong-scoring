/**
 * Stripe の商品・価格・Webhook を作る（冪等）
 * Stripeブートストラップ
 *
 * `src/lib/billing/plans.ts` の定義どおりに、プランごとの商品と売り方ごとの
 * 一括払いの Price を Stripe に作り、`.env.local` / Vercel に貼る環境変数の行を
 * 出力する。テストモードでも本番でも、鍵を差し替えて同じコマンドで揃えられる。
 *
 * 冪等性は Price の `lookup_key`（`<plan>_<offer>`。例: `pro_pass`）で担保する。
 * 既にあればそれを再利用し、無いものだけ作る。金額は作成時にしか使わない —
 * 既存の Price の金額は変えない（Stripe の Price は金額を変更できず、改定は
 * Dashboard で新しい Price を作って lookup_key を付け替える）。
 *
 * 使い方（`apps/web` で）:
 *
 *   # 鍵は STRIPE_SECRET_KEY（.env.local）か、Stripe CLI のログイン情報から渡す
 *   STRIPE_SECRET_KEY="$(stripe config --list --project-name mahjong-scoring \
 *     | awk -F= '/test_mode_api_key/{print $2}' | tr -d ' ')" \
 *     pnpm stripe:bootstrap
 *
 *   # 金額を指定（最小通貨単位。JPY は円）
 *   pnpm stripe:bootstrap --pass-amount 480 --lifetime-amount 1480
 *
 *   # 本番の Webhook エンドポイントも登録する（署名シークレットは作成時に 1 度だけ出る）
 *   pnpm stripe:bootstrap --webhook-url https://score.mahjong.help/api/stripe/webhook
 *
 * ローカルの Webhook は `stripe listen --forward-to localhost:3000/api/stripe/webhook`
 * を使うため、このスクリプトでは登録しない。
 */
import { parseArgs } from "node:util";

import dotenv from "dotenv";
import Stripe from "stripe";

import {
  OFFER_KEYS,
  PLANS,
  PLAN_KEYS,
  PurchaseKind,
  type OfferDefinition,
  type OfferKey,
  type PlanKey,
} from "@mahjong-scoring/features/billing/plans";
import { STRIPE_API_VERSION } from "../src/lib/billing/api-version";
import { STRIPE_WEBHOOK_EVENTS } from "../src/lib/billing/webhook-events";

dotenv.config({ path: [".env.local", ".env"] });

/** Dashboard と Checkout に出る商品名・価格の表示名 */
const PLAN_DISPLAY: Readonly<
  Record<PlanKey, { readonly name: string; readonly description: string }>
> = {
  pro: {
    name: "Pro",
    description:
      "点数計算練習（和了形・聴牌形の点数計算）の回数無制限と拡張機能",
  },
};

const OFFER_DISPLAY: Readonly<Record<OfferKey, string>> = {
  pass: "30日パス",
  lifetime: "買い切り",
};

/** 金額の既定値（最小通貨単位）。引数で上書きできる */
const DEFAULT_AMOUNTS: Readonly<Record<OfferKey, number>> = {
  pass: 480,
  lifetime: 1480,
};

/** 環境変数名（`src/lib/billing/env.ts` の表と同じ規則） */
function envNameFor(plan: PlanKey, offer: OfferKey): string {
  return `STRIPE_PRICE_ID_${plan.toUpperCase()}_${offer.toUpperCase()}`;
}

function lookupKeyFor(plan: PlanKey, offer: OfferKey): string {
  return `${plan}_${offer}`;
}

function parseAmount(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const amount = Number(value);
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error(`金額は 0 以上の整数で指定してください: ${value}`);
  }
  return amount;
}

const { values: args } = parseArgs({
  options: {
    "pass-amount": { type: "string" },
    "lifetime-amount": { type: "string" },
    currency: { type: "string", default: "jpy" },
    "webhook-url": { type: "string" },
  },
});

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error(
    "stripe-bootstrap: STRIPE_SECRET_KEY が未設定です。\n" +
      "  .env.local に設定するか、Stripe CLI のログイン情報から渡してください:\n" +
      '  STRIPE_SECRET_KEY="$(stripe config --list --project-name mahjong-scoring' +
      " | awk -F= '/test_mode_api_key/{print $2}' | tr -d ' ')\" pnpm stripe:bootstrap",
  );
  process.exit(1);
}

const liveMode = secretKey.includes("_live_");
const currency = (args.currency ?? "jpy").toLowerCase();
const amounts: Readonly<Record<OfferKey, number>> = {
  pass: parseAmount(args["pass-amount"], DEFAULT_AMOUNTS.pass),
  lifetime: parseAmount(args["lifetime-amount"], DEFAULT_AMOUNTS.lifetime),
};

const stripe = new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });

async function findProductForPlan(
  plan: PlanKey,
): Promise<Stripe.Product | undefined> {
  const found = await stripe.products.search({
    query: `metadata['plan']:'${plan}' AND active:'true'`,
    limit: 1,
  });
  return found.data[0];
}

/**
 * 既存の Price（lookup_key）から商品を引く。無ければ undefined
 *
 * `products.search` は索引の更新が遅れる（作成直後の再実行で見つからない）ため、
 * 先に Price から辿る。Price の一覧は即時に一貫している。
 */
async function findProductViaPrices(
  plan: PlanKey,
): Promise<Stripe.Product | undefined> {
  const prices = await stripe.prices.list({
    lookup_keys: OFFER_KEYS.map((offer) => lookupKeyFor(plan, offer)),
    active: true,
    limit: OFFER_KEYS.length,
    expand: ["data.product"],
  });
  const product = prices.data[0]?.product;
  if (!product || typeof product === "string" || product.deleted) {
    return undefined;
  }
  return product;
}

async function ensureProduct(plan: PlanKey): Promise<Stripe.Product> {
  const existing =
    (await findProductViaPrices(plan)) ?? (await findProductForPlan(plan));
  if (existing) {
    console.log(`  商品 ${existing.name} は既にあります（${existing.id}）`);
    return existing;
  }
  const display = PLAN_DISPLAY[plan];
  const product = await stripe.products.create(
    {
      name: display.name,
      description: display.description,
      metadata: { plan },
    },
    { idempotencyKey: `bootstrap-product:${plan}` },
  );
  console.log(`  商品 ${product.name} を作成しました（${product.id}）`);
  return product;
}

async function ensurePrice(
  plan: PlanKey,
  offer: OfferDefinition,
  product: Stripe.Product,
): Promise<Stripe.Price> {
  const lookupKey = lookupKeyFor(plan, offer.key);
  const existing = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  const found = existing.data[0];
  if (found) {
    console.log(
      `  価格 ${lookupKey} は既にあります（${found.id}: ${found.unit_amount} ${found.currency}）`,
    );
    return found;
  }

  const amount = amounts[offer.key];
  const price = await stripe.prices.create(
    {
      product: product.id,
      currency,
      unit_amount: amount,
      // 税込の総額表示。Stripe Tax は使わないが、後から有効にしても表示価格が変わらない
      tax_behavior: "inclusive",
      lookup_key: lookupKey,
      nickname: OFFER_DISPLAY[offer.key],
      metadata: {
        plan,
        offer: offer.key,
        kind: offer.kind,
        ...(offer.kind === PurchaseKind.Pass
          ? { durationDays: String(offer.durationDays) }
          : {}),
      },
    },
    { idempotencyKey: `bootstrap-price:${lookupKey}:${currency}:${amount}` },
  );
  console.log(
    `  価格 ${lookupKey} を作成しました（${price.id}: ${amount} ${currency}）`,
  );
  return price;
}

/**
 * 登録済みの Webhook が購読するイベントをアプリの一覧に揃える
 *
 * 一覧（`STRIPE_WEBHOOK_EVENTS`）にイベントを足しても、登録済みの
 * エンドポイントはそのままでは受け取らない。アプリの一覧を正として
 * 差分があれば `enabled_events` を上書きする（Dashboard で手で足した
 * イベントも落とす — 受け口が処理しないイベントを届けても意味が無い）。
 * `*`（全イベント）で登録されているものは触らない
 */
async function syncWebhookEvents(
  existing: Stripe.WebhookEndpoint,
): Promise<Stripe.WebhookEndpoint> {
  const current = existing.enabled_events;
  if (current.includes("*")) {
    console.log("  全イベントを購読する設定のため、イベントの一覧は変えません");
    return existing;
  }
  const wanted = [...STRIPE_WEBHOOK_EVENTS];
  const same =
    current.length === wanted.length &&
    wanted.every((event) => current.includes(event));
  if (same) return existing;

  const updated = await stripe.webhookEndpoints.update(existing.id, {
    enabled_events: wanted,
  });
  console.log(
    `  購読イベントを更新しました: ${current.join(", ") || "(なし)"} → ${wanted.join(", ")}`,
  );
  return updated;
}

async function ensureWebhookEndpoint(
  url: string,
): Promise<Stripe.WebhookEndpoint & { secret?: string }> {
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const existing = endpoints.data.find((endpoint) => endpoint.url === url);
  if (existing) {
    console.log(
      `  Webhook ${url} は既にあります（${existing.id}）。署名シークレットは Dashboard で確認してください`,
    );
    return syncWebhookEvents(existing);
  }
  const endpoint = await stripe.webhookEndpoints.create({
    url,
    enabled_events: [...STRIPE_WEBHOOK_EVENTS],
    description: "mahjong-scoring web（scripts/stripe-bootstrap.ts が作成）",
  });
  console.log(`  Webhook ${url} を作成しました（${endpoint.id}）`);
  return endpoint;
}

async function main() {
  console.log(
    `stripe-bootstrap: ${liveMode ? "本番（ライブモード）" : "テストモード"} に対して実行します`,
  );
  console.log(
    `  通貨 ${currency} / 30日パス ${amounts.pass} / 買い切り ${amounts.lifetime}（既存の Price の金額は変えません）`,
  );

  const envLines: string[] = [];

  for (const planKey of PLAN_KEYS) {
    const plan = PLANS[planKey];
    const product = await ensureProduct(planKey);
    for (const offerKey of OFFER_KEYS) {
      const price = await ensurePrice(planKey, plan.offers[offerKey], product);
      envLines.push(`${envNameFor(planKey, offerKey)}=${price.id}`);
    }
  }

  if (args["webhook-url"]) {
    const endpoint = await ensureWebhookEndpoint(args["webhook-url"]);
    if (endpoint.secret) {
      envLines.push(`STRIPE_WEBHOOK_SECRET=${endpoint.secret}`);
    }
  }

  console.log("");
  console.log(
    liveMode
      ? "Vercel の環境変数に設定してください:"
      : ".env.local に追加してください:",
  );
  for (const line of envLines) console.log(`  ${line}`);
  if (!liveMode) {
    console.log(
      "  STRIPE_WEBHOOK_SECRET は `stripe listen --forward-to localhost:3000/api/stripe/webhook` の出力から",
    );
  }
}

main().catch((error: unknown) => {
  console.error("stripe-bootstrap: 失敗しました:", error);
  process.exit(1);
});
