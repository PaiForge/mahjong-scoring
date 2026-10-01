// @vitest-environment node
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type Stripe from "stripe";
const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  retrieve: vi.fn(),
  payment: vi.fn(),
  refund: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", async () => {
  const { billingTestDb } = await import("./test-database");
  return {
    ...(await import("../db/schema")),
    db: process.env.BILLING_TEST_DATABASE_URL ? billingTestDb() : undefined,
  };
});
vi.mock("./customer", () => ({
  getOrCreateStripeCustomerId: async () => "cus_owner",
}));
vi.mock("./stripe", () => ({
  getStripe: () => ({
    checkout: { sessions: { create: mocks.create, retrieve: mocks.retrieve } },
    paymentIntents: { retrieve: mocks.payment },
    refunds: { create: mocks.refund },
  }),
}));
import {
  billingTestDb,
  setupBillingTestDb,
  closeBillingTestDb,
} from "./test-database";
import { billingCheckouts, purchases, stripeCustomers } from "../db/schema";
import { openCheckout } from "./checkout";
import {
  recordPurchaseFromCheckoutSession,
  revokePurchaseByPaymentIntent,
} from "./purchases";
const owner = "11111111-1111-4111-8111-111111111111";
const sessions = new Map<string, Stripe.Checkout.Session>();
const keys = new Map<string, Stripe.Checkout.Session>();
function start(offer: "pass" | "lifetime" = "pass") {
  return openCheckout(owner, undefined, offer, "http://localhost:3000");
}
function paid() {
  const session = {
    ...sessions.get("cs_1"),
    status: "complete",
    payment_status: "paid",
    payment_intent: "pi1",
    url: null,
  } as Stripe.Checkout.Session;
  sessions.set(session.id, session);
  return session;
}
function charge(refunded = 0) {
  return {
    latest_charge: {
      created: Math.floor(Date.now() / 1000),
      amount: 480,
      amount_refunded: refunded,
    },
  };
}
describe.skipIf(!process.env.BILLING_TEST_DATABASE_URL)(
  "billing transactions (PostgreSQL)",
  () => {
    beforeAll(setupBillingTestDb);
    afterAll(async () => {
      vi.unstubAllEnvs();
      await closeBillingTestDb();
    });
    beforeEach(async () => {
      vi.clearAllMocks();
      keys.clear();
      sessions.clear();
      vi.stubEnv("STRIPE_PRICE_ID_PRO_PASS", "price_pass");
      vi.stubEnv("STRIPE_PRICE_ID_PRO_LIFETIME", "price_lifetime");
      const db = billingTestDb();
      await db.delete(purchases);
      await db.delete(stripeCustomers);
      await db
        .insert(stripeCustomers)
        .values({ userId: owner, stripeCustomerId: "cus_owner" });
      mocks.create.mockImplementation(
        async (
          params: Stripe.Checkout.SessionCreateParams,
          opts: { idempotencyKey: string },
        ) => {
          const previous = keys.get(opts.idempotencyKey);
          if (previous) return previous;
          const id = `cs_${keys.size + 1}`;
          const session = {
            id,
            customer: params.customer,
            metadata: params.metadata,
            mode: "payment",
            status: "open",
            payment_status: "unpaid",
            url: `https://checkout.stripe.com/${id}`,
            currency: "jpy",
            amount_total: 480,
            line_items: {
              data: [
                { price: { id: params.line_items?.[0].price }, quantity: 1 },
              ],
              has_more: false,
            },
          } as unknown as Stripe.Checkout.Session;
          keys.set(opts.idempotencyKey, session);
          sessions.set(id, session);
          return session;
        },
      );
      mocks.retrieve.mockImplementation(async (id: string) => sessions.get(id));
      mocks.payment.mockResolvedValue(charge());
      mocks.refund.mockResolvedValue({ id: "re1" });
    });
    it("同時購入開始は1つの Session に集約", async () => {
      const results = await Promise.all([start(), start(), start()]);
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);
      expect(mocks.create).toHaveBeenCalledTimes(1);
      expect(
        await billingTestDb().select().from(billingCheckouts),
      ).toHaveLength(1);
    });
    it("Stripe 作成後の応答喪失から同じキー・条件で回復", async () => {
      const create = mocks.create.getMockImplementation();
      mocks.create.mockImplementationOnce(async (...args) => {
        await create?.(...args);
        throw new Error("response lost");
      });
      await expect(start()).rejects.toThrow("response lost");
      vi.stubEnv("STRIPE_PRICE_ID_PRO_PASS", "new_price");
      expect(await start()).toEqual({
        url: "https://checkout.stripe.com/cs_1",
      });
      expect(keys.size).toBe(1);
      expect(mocks.create.mock.calls[0]).toEqual(mocks.create.mock.calls[1]);
    });
    it("別の売り方でも新しい Session を作らない", async () => {
      await start();
      expect(await start("lifetime")).toEqual({ error: "checkoutInProgress" });
      expect(mocks.create).toHaveBeenCalledTimes(1);
    });
    it.each(["pass", "lifetime"] as const)(
      "%s 有効中は追加購入不可",
      async (offer) => {
        await start(offer);
        await recordPurchaseFromCheckoutSession(paid());
        expect(await start()).toEqual({ error: "alreadyActive" });
        expect(await start("lifetime")).toEqual({ error: "alreadyActive" });
      },
    );
    it("パス期限切れ後は再購入できる", async () => {
      await start();
      await recordPurchaseFromCheckoutSession(paid());
      await billingTestDb()
        .update(purchases)
        .set({ expiresAt: new Date(Date.now() - 1) });
      expect(await start()).toEqual({
        url: "https://checkout.stripe.com/cs_2",
      });
    });
    it("Webhook 未到着の決済済み Session を期限切れと誤認しない", async () => {
      await start();
      paid();
      await billingTestDb()
        .update(billingCheckouts)
        .set({ expiresAt: new Date(Date.now() - 1000) });
      expect(await start()).toEqual({ error: "checkoutPending" });
      expect(await start()).toEqual({ error: "alreadyActive" });
    });
    it("本当に期限切れなら次の購入を許可", async () => {
      await start();
      const session = sessions.get("cs_1")!;
      sessions.set(session.id, { ...session, status: "expired", url: null });
      expect(await start()).toEqual({ error: "checkoutExpired" });
      expect(await start()).toEqual({
        url: "https://checkout.stripe.com/cs_2",
      });
    });
    it("着地と Webhook の並行記録は1行", async () => {
      await start();
      const session = paid();
      const results = await Promise.all([
        recordPurchaseFromCheckoutSession(session),
        recordPurchaseFromCheckoutSession(session),
      ]);
      expect(results.map((r) => r.outcome).sort()).toEqual([
        "duplicate",
        "recorded",
      ]);
      expect(await billingTestDb().select().from(purchases)).toHaveLength(1);
    });
    it("購入前の返金は取消済みとして復元", async () => {
      await start();
      const session = paid();
      await revokePurchaseByPaymentIntent("pi1", "refunded");
      mocks.payment.mockResolvedValue(charge(480));
      expect((await recordPurchaseFromCheckoutSession(session)).outcome).toBe(
        "refunded",
      );
      expect(
        (await billingTestDb().select().from(purchases))[0].revokedAt,
      ).not.toBeNull();
    });
    it("購入記録の途中の返金はロック解放後に反映", async () => {
      await start();
      const session = paid();
      let release!: () => void;
      let started!: () => void;
      const reached = new Promise<void>((resolve) => {
        started = resolve;
      });
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      mocks.payment.mockImplementationOnce(async () => {
        started();
        await gate;
        return charge();
      });
      const recording = recordPurchaseFromCheckoutSession(session);
      await reached;
      const revoking = revokePurchaseByPaymentIntent("pi1", "refunded");
      release();
      await Promise.all([recording, revoking]);
      expect(
        (await billingTestDb().select().from(purchases))[0].revokedAt,
      ).not.toBeNull();
    });
    it("旧価格・旧特典を使い、別の顧客の予約を使わせない", async () => {
      await start();
      const session = paid();
      vi.stubEnv("STRIPE_PRICE_ID_PRO_PASS", "price_new");
      await billingTestDb()
        .update(billingCheckouts)
        .set({ benefits: ["unlimited_practice"] });
      await recordPurchaseFromCheckoutSession(session);
      expect(
        (await billingTestDb().select().from(purchases))[0].benefits,
      ).toEqual(["unlimited_practice"]);
      await billingTestDb()
        .insert(stripeCustomers)
        .values({
          userId: "22222222-2222-4222-8222-222222222222",
          stripeCustomerId: "cus_other",
        });
      expect(
        await recordPurchaseFromCheckoutSession({
          ...session,
          id: "cs_other",
          payment_intent: "pi_other",
          customer: "cus_other",
        }),
      ).toEqual({ outcome: "ignored", reason: "unknownCheckout" });
    });
    it("顧客削除で予約も CASCADE", async () => {
      await start();
      await billingTestDb().delete(stripeCustomers);
      expect(
        await billingTestDb().select().from(billingCheckouts),
      ).toHaveLength(0);
    });
  },
);
