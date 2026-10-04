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

vi.mock("@/lib/db", async () => {
  const { billingTestDb } = await import("../billing/test-database");
  return {
    ...(await import("../db/schema")),
    db: process.env.BILLING_TEST_DATABASE_URL ? billingTestDb() : undefined,
  };
});

import {
  billingTestDb,
  closeBillingTestDb,
  setupBillingTestDb,
} from "../billing/test-database";
import { benefitGrants, notifications, purchases } from "../db/schema";
import { EXPIRY_LOOKBACK_MS, notifyExpiredPlans } from "./plan-expiry";

const NOW = new Date("2026-10-15T01:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";

let seq = 0;
function pass(userId: string, expiresAt: Date, revoked = false) {
  seq += 1;
  return {
    userId,
    plan: "pro",
    kind: "pass",
    benefits: ["unlimited_practice"],
    stripeCheckoutSessionId: `cs_${seq}`,
    stripePaymentIntentId: `pi_${seq}`,
    currency: "jpy",
    amount: 480,
    startsAt: new Date(expiresAt.getTime() - 30 * DAY),
    expiresAt,
    revokedAt: revoked ? NOW : null,
    revokeReason: revoked ? "refunded" : null,
  };
}

describe.skipIf(!process.env.BILLING_TEST_DATABASE_URL)(
  "notifyExpiredPlans (PostgreSQL)",
  () => {
    beforeAll(setupBillingTestDb);
    afterAll(closeBillingTestDb);
    beforeEach(async () => {
      const db = billingTestDb();
      await db.delete(notifications);
      await db.delete(purchases);
      await db.delete(benefitGrants);
    });

    it("窓の中で切れたパスだけを通知し、何度走っても 1 通", async () => {
      const db = billingTestDb();
      await db.insert(purchases).values([
        pass(alice, new Date(NOW.getTime() - DAY)), // 昨日切れた → 通知
        pass(bob, new Date(NOW.getTime() - EXPIRY_LOOKBACK_MS - DAY)), // 窓の外
      ]);

      expect(await notifyExpiredPlans(NOW)).toEqual({
        expired: 1,
        stillActive: 0,
        candidates: 1,
        notified: 1,
      });
      // 翌日もう一度走っても増えない
      expect(await notifyExpiredPlans(new Date(NOW.getTime() + DAY))).toEqual({
        expired: 1,
        stillActive: 0,
        candidates: 1,
        notified: 0,
      });

      const rows = await db.select().from(notifications);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        userId: alice,
        type: "plan_expired",
        targetType: "purchase",
        readAt: null,
      });
    });

    it("買い直して Pro のままの人・取り消し済みの行には出さない", async () => {
      const db = billingTestDb();
      await db.insert(purchases).values([
        pass(alice, new Date(NOW.getTime() - DAY)), // 古いパスが切れた
        pass(alice, new Date(NOW.getTime() + 29 * DAY)), // 新しいパスが有効
        pass(bob, new Date(NOW.getTime() - DAY), true), // 返金済み
      ]);

      expect(await notifyExpiredPlans(NOW)).toEqual({
        expired: 1,
        stillActive: 1,
        candidates: 0,
        notified: 0,
      });
      expect(await db.select().from(notifications)).toHaveLength(0);
    });

    it("購入と付与が重なっていた人には、日をまたいで cron が走っても 1 通", async () => {
      const db = billingTestDb();
      // パスは 10/14 に、重なっていた付与は 10/15 に切れる
      await db
        .insert(purchases)
        .values([pass(alice, new Date(NOW.getTime() - DAY))]);
      await db.insert(benefitGrants).values([
        {
          userId: alice,
          plan: "pro",
          benefits: ["unlimited_practice"],
          reason: "補償",
          grantedBy: bob,
          startsAt: new Date(NOW.getTime() - 10 * DAY),
          expiresAt: new Date(NOW.getTime() + 0.5 * DAY),
        },
      ]);

      // 10/14 の cron: パスは切れたが付与が有効なので出さない
      expect(await notifyExpiredPlans(NOW)).toMatchObject({
        expired: 1,
        stillActive: 1,
        notified: 0,
      });
      // 10/15 の cron: 両方が窓に入るが、本人への通知は 1 通（対象は後に切れた付与）
      expect(
        await notifyExpiredPlans(new Date(NOW.getTime() + DAY)),
      ).toMatchObject({
        expired: 2,
        stillActive: 0,
        candidates: 1,
        notified: 1,
      });
      // 10/16 の cron: 同じ代表行なので増えない
      expect(
        await notifyExpiredPlans(new Date(NOW.getTime() + 2 * DAY)),
      ).toMatchObject({ candidates: 1, notified: 0 });

      const rows = await db.select().from(notifications);
      expect(rows.map((r) => [r.userId, r.type, r.targetType])).toEqual([
        [alice, "plan_expired", "benefit_grant"],
      ]);
    });

    it("付与の期限切れも同じ種別で通知し、まだ有効な付与があれば出さない", async () => {
      const db = billingTestDb();
      await db.insert(benefitGrants).values([
        {
          userId: alice,
          plan: "pro",
          benefits: ["unlimited_practice"],
          reason: "モニター",
          grantedBy: bob,
          startsAt: new Date(NOW.getTime() - 61 * DAY),
          expiresAt: new Date(NOW.getTime() - DAY),
        },
        {
          userId: bob,
          plan: "pro",
          benefits: ["unlimited_practice"],
          reason: "補償",
          grantedBy: bob,
          startsAt: new Date(NOW.getTime() - 61 * DAY),
          expiresAt: new Date(NOW.getTime() - DAY),
        },
        {
          userId: bob,
          plan: "pro",
          benefits: ["unlimited_practice"],
          reason: "無期限",
          grantedBy: bob,
          startsAt: new Date(NOW.getTime() - DAY),
          expiresAt: null,
        },
      ]);

      expect(await notifyExpiredPlans(NOW)).toEqual({
        expired: 2,
        stillActive: 1,
        candidates: 1,
        notified: 1,
      });
      const rows = await db.select().from(notifications);
      expect(rows.map((r) => [r.userId, r.type, r.targetType])).toEqual([
        [alice, "plan_expired", "benefit_grant"],
      ]);
    });
  },
);
