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
  expire: vi.fn(),
  payment: vi.fn(),
  refund: vi.fn(),
}));
vi.mock(
  "@/lib/db",
  async () => await import("@/lib/billing/test-database-mock"),
);
vi.mock("./customer", () => ({
  getOrCreateStripeCustomerId: async () => "cus_owner",
}));
vi.mock("./stripe", () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        create: mocks.create,
        retrieve: mocks.retrieve,
        expire: mocks.expire,
      },
    },
    paymentIntents: { retrieve: mocks.payment },
    refunds: { create: mocks.refund },
  }),
}));
import {
  billingTestDb,
  setupBillingTestDb,
  closeBillingTestDb,
} from "./test-database";
import {
  billingCheckouts,
  notifications,
  purchases,
  stripeCustomers,
} from "../db/schema";
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
      await db.delete(notifications);
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
      mocks.expire.mockImplementation(async (id: string) => {
        const session = sessions.get(id)!;
        if (session.status !== "open") throw new Error("session is not open");
        const expired = { ...session, status: "expired", url: null };
        sessions.set(id, expired as Stripe.Checkout.Session);
        return expired;
      });
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
    it("言語を省略した購入開始は日本語の予約になる", async () => {
      await start();
      const [row] = await billingTestDb().select().from(billingCheckouts);
      expect(row?.locale).toBe("ja");
      expect(mocks.create.mock.calls[0]?.[0]).toMatchObject({
        locale: "ja",
        cancel_url: "http://localhost:3000/plan",
      });
    });
    it("英語の購入開始は予約に言語を保存し、別の言語で押し直しても予約の言語の Session に戻る", async () => {
      const origin = "http://localhost:3000";
      const english = await openCheckout(
        owner,
        undefined,
        "pass",
        origin,
        "en",
      );
      expect(mocks.create.mock.calls[0]?.[0]).toMatchObject({
        locale: "en",
        cancel_url: `${origin}/en/plan`,
        success_url: `${origin}/api/stripe/checkout/complete?session_id={CHECKOUT_SESSION_ID}&locale=en`,
      });
      // 冪等パラメータを変えないため、未精算の予約は言語を問わず再利用する
      expect(
        await openCheckout(owner, undefined, "pass", origin, "ja"),
      ).toEqual(english);
      expect(mocks.create).toHaveBeenCalledTimes(1);
      const rows = await billingTestDb().select().from(billingCheckouts);
      expect(rows.map((row) => row.locale)).toEqual(["en"]);
    });
    it("別の売り方を押すと開いている Session を失効させて置き換える", async () => {
      await start();
      expect(await start("lifetime")).toEqual({
        url: "https://checkout.stripe.com/cs_2",
      });
      expect(mocks.expire).toHaveBeenCalledWith("cs_1");
      expect(sessions.get("cs_1")?.status).toBe("expired");
      const rows = await billingTestDb().select().from(billingCheckouts);
      expect(rows.map((r) => [r.offer, r.settledAt !== null]).sort()).toEqual([
        ["lifetime", false],
        ["pass", true],
      ]);
    });
    it("別の売り方の Session を失効できなければ切り替えない", async () => {
      await start();
      mocks.expire.mockRejectedValueOnce(new Error("stripe down"));
      expect(await start("lifetime")).toEqual({ error: "checkoutInProgress" });
      expect(mocks.create).toHaveBeenCalledTimes(1);
      expect(await start()).toEqual({
        url: "https://checkout.stripe.com/cs_1",
      });
    });
    it("別の売り方の Session が支払い済みなら切り替えず記録する", async () => {
      await start();
      paid();
      expect(await start("lifetime")).toEqual({ error: "checkoutPending" });
      expect(mocks.expire).not.toHaveBeenCalled();
      expect(await start("lifetime")).toEqual({ error: "alreadyActive" });
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
    it("App Store の Sandbox の購入は追加購入を止めず、Production は止める", async () => {
      const apple = (environment: "Sandbox" | "Production") => ({
        userId: owner,
        provider: "apple",
        plan: "pro",
        kind: "lifetime",
        benefits: ["unlimited_practice"],
        appleTransactionId: `tx_${environment}`,
        appleOriginalTransactionId: `tx_${environment}`,
        appleProductId: "help.mahjong.score.pro.lifetime",
        appleEnvironment: environment,
        currency: "jpy",
        amount: 0,
        startsAt: new Date(),
      });
      await billingTestDb().insert(purchases).values(apple("Sandbox"));
      expect(await start()).toEqual({
        url: "https://checkout.stripe.com/cs_1",
      });
      await billingTestDb().insert(purchases).values(apple("Production"));
      expect(await start("lifetime")).toEqual({ error: "alreadyActive" });
    });
    it("決済元と列の組み合わせが食い違う行は CHECK で弾く", async () => {
      await expect(
        billingTestDb()
          .insert(purchases)
          .values({
            userId: owner,
            provider: "apple",
            plan: "pro",
            kind: "lifetime",
            benefits: ["unlimited_practice"],
            stripeCheckoutSessionId: "cs_mixed",
            stripePaymentIntentId: "pi_mixed",
            appleTransactionId: "tx_mixed",
            appleOriginalTransactionId: "tx_mixed",
            appleProductId: "help.mahjong.score.pro.lifetime",
            appleEnvironment: "Production",
            currency: "jpy",
            amount: 0,
            startsAt: new Date(),
          }),
      ).rejects.toMatchObject({
        cause: { constraint_name: "purchases_chk_provider_columns" },
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
    it("本当に期限切れなら同じ呼び出しで新しい手続きに置き換える", async () => {
      await start();
      const session = sessions.get("cs_1")!;
      sessions.set(session.id, { ...session, status: "expired", url: null });
      expect(await start()).toEqual({
        url: "https://checkout.stripe.com/cs_2",
      });
      const rows = await billingTestDb().select().from(billingCheckouts);
      expect(rows.map((r) => r.settledAt !== null).sort()).toEqual([
        false,
        true,
      ]);
    });
    it("Session 未発行のまま期限が迫った予約も同じ呼び出しで置き換える", async () => {
      mocks.create.mockRejectedValueOnce(new Error("stripe down"));
      await expect(start()).rejects.toThrow("stripe down");
      await billingTestDb()
        .update(billingCheckouts)
        .set({ expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
      expect(await start()).toEqual({
        url: "https://checkout.stripe.com/cs_1",
      });
      expect(mocks.create).toHaveBeenCalledTimes(2);
      expect(
        await billingTestDb().select().from(billingCheckouts),
      ).toHaveLength(2);
    });
    it("置き換えのやり直しでも有効な購入があれば拒否", async () => {
      await start();
      await recordPurchaseFromCheckoutSession(paid());
      const session = sessions.get("cs_1")!;
      sessions.set(session.id, { ...session, status: "expired", url: null });
      expect(await start()).toEqual({ error: "alreadyActive" });
      expect(mocks.create).toHaveBeenCalledTimes(1);
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
      // 通知も 1 通（一意インデックスで並行記録を 1 つに畳む）
      const notified = await billingTestDb().select().from(notifications);
      expect(notified.map((n) => n.type)).toEqual(["purchase_completed"]);
      expect(notified[0].userId).toBe(owner);
    });
    it("全額返金で取り消すと本人に取り消しが通知される", async () => {
      await start();
      await recordPurchaseFromCheckoutSession(paid());
      await revokePurchaseByPaymentIntent("pi1", "refunded");
      // 再送されても取り消しは 1 回（false）で通知も増えない
      expect(await revokePurchaseByPaymentIntent("pi1", "refunded")).toBe(
        false,
      );
      const types = (await billingTestDb().select().from(notifications))
        .map((n) => n.type)
        .sort();
      expect(types).toEqual(["purchase_completed", "purchase_revoked"]);
    });
    it("通知が無い状態で着地 / Webhook が再送されると、保存済みの行から補完する", async () => {
      await start();
      const session = paid();
      await recordPurchaseFromCheckoutSession(session);
      // 初回の通知 INSERT だけが失敗した状態を作る
      await billingTestDb().delete(notifications);
      expect((await recordPurchaseFromCheckoutSession(session)).outcome).toBe(
        "duplicate",
      );
      expect(
        (await billingTestDb().select().from(notifications)).map((n) => n.type),
      ).toEqual(["purchase_completed"]);

      await revokePurchaseByPaymentIntent("pi1", "refunded");
      await billingTestDb().delete(notifications);
      expect(await revokePurchaseByPaymentIntent("pi1", "refunded")).toBe(
        false,
      );
      expect(
        (await billingTestDb().select().from(notifications)).map((n) => n.type),
      ).toEqual(["purchase_revoked"]);
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
      await billingTestDb().insert(stripeCustomers).values({
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
