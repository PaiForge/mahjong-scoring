// @vitest-environment node
import { eq } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock(
  "@/lib/db",
  async () => await import("@/lib/billing/test-database-mock"),
);

import {
  addPassDuration,
  PLANS,
} from "@mahjong-scoring/features/billing/plans";

import { accountDeletions, notifications, purchases } from "../../db/schema";
import { purchaseStateOf } from "../plan-status";
import {
  billingTestDb,
  closeBillingTestDb,
  setupBillingTestDb,
} from "../test-database";
import { GOOGLE_PLAY_PACKAGE_NAME } from "./env";
import { recordGooglePurchase } from "./record";
import type { GooglePurchase } from "./verifier";

const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const PASS_ID = "help.mahjong.score.pro.pass30";
const LIFETIME_ID = "help.mahjong.score.pro.lifetime";

let sequence = 0;
/** 購入トークンを毎回変えた検証済みの購入（実物に近い長さのトークン） */
function purchase(overrides: Partial<GooglePurchase> = {}): GooglePurchase {
  sequence += 1;
  const id = String(sequence).padStart(5, "0");
  return {
    purchaseToken: `token-${id}-${"x".repeat(300)}`,
    productId: PASS_ID,
    packageName: GOOGLE_PLAY_PACKAGE_NAME,
    orderId: `GPA.0000-${id}`,
    purchaseDate: new Date(),
    state: "purchased",
    environment: "Production",
    ...overrides,
  };
}

const lifetime = { productId: LIFETIME_ID } as const;

async function rowsOf(purchaseToken: string) {
  return billingTestDb()
    .select()
    .from(purchases)
    .where(eq(purchases.googlePurchaseToken, purchaseToken));
}

describe.skipIf(!process.env.BILLING_TEST_DATABASE_URL)(
  "Google Play の購入の記録 (PostgreSQL)",
  () => {
    beforeAll(setupBillingTestDb);
    afterAll(async () => {
      vi.unstubAllEnvs();
      await closeBillingTestDb();
    });
    beforeEach(async () => {
      vi.stubEnv("GOOGLE_IAP_PRODUCT_ID_PRO_PASS", PASS_ID);
      vi.stubEnv("GOOGLE_IAP_PRODUCT_ID_PRO_LIFETIME", LIFETIME_ID);
      vi.stubEnv("GOOGLE_IAP_TEST_USER_IDS", "");
      const db = billingTestDb();
      await db.delete(notifications);
      await db.delete(purchases);
      await db.delete(accountDeletions);
    });

    it("初回の記録で Google の行が 1 つ入り（CHECK を満たす）、金額は 0 / jpy", async () => {
      const bought = purchase();
      const result = await recordGooglePurchase(owner, bought);
      expect(result.outcome).toBe("recorded");
      const rows = await rowsOf(bought.purchaseToken);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        userId: owner,
        provider: "google",
        kind: "pass",
        benefits: [...PLANS.pro.benefits],
        googleOrderId: bought.orderId,
        googleProductId: PASS_ID,
        googleEnvironment: "Production",
        stripeCheckoutSessionId: null,
        appleTransactionId: null,
        amount: 0,
        currency: "jpy",
        revokedAt: null,
      });
      const sent = await billingTestDb().select().from(notifications);
      expect(sent.map((n) => n.type)).toEqual(["purchase_completed"]);
    });

    it("注文 ID が無い購入も記録できる（CHECK は注文 ID を問わない）", async () => {
      const bought = purchase({ ...lifetime, orderId: undefined });
      expect((await recordGooglePurchase(owner, bought)).outcome).toBe(
        "recorded",
      );
      const [row] = await rowsOf(bought.purchaseToken);
      expect(row.googleOrderId).toBeNull();
    });

    it("同じ購入は本人なら duplicate、他人なら ownedByAnotherAccount", async () => {
      const bought = purchase({ ...lifetime });
      await recordGooglePurchase(owner, bought);
      expect(await recordGooglePurchase(owner, bought)).toEqual({
        outcome: "duplicate",
      });
      expect(await recordGooglePurchase(other, bought)).toEqual({
        outcome: "ownedByAnotherAccount",
      });
      expect(await rowsOf(bought.purchaseToken)).toHaveLength(1);
    });

    it("並行した 2 本の記録でも行は 1 つ", async () => {
      const bought = purchase({ ...lifetime });
      const results = await Promise.all([
        recordGooglePurchase(owner, bought),
        recordGooglePurchase(owner, bought),
      ]);
      expect(results.map((r) => r.outcome).sort()).toEqual([
        "duplicate",
        "recorded",
      ]);
      expect(await rowsOf(bought.purchaseToken)).toHaveLength(1);
    });

    it("有効なパスがある人の 2 枚目のパスは 1 枚目の期限から始まる開始待ち", async () => {
      const now = new Date();
      const first = purchase({ purchaseDate: now });
      await recordGooglePurchase(owner, first, now);
      const second = purchase({ purchaseDate: now });
      expect((await recordGooglePurchase(owner, second, now)).outcome).toBe(
        "recorded",
      );
      const [firstRow] = await rowsOf(first.purchaseToken);
      const [secondRow] = await rowsOf(second.purchaseToken);
      expect(secondRow.startsAt).toEqual(firstRow.expiresAt);
      expect(secondRow.expiresAt).toEqual(
        addPassDuration(secondRow.startsAt, 30),
      );
      expect(purchaseStateOf(secondRow, now)).toBe("scheduled");
    });

    it("Test の有効なパスは 2 枚目の開始を動かさない", async () => {
      vi.stubEnv("GOOGLE_IAP_TEST_USER_IDS", owner);
      const now = new Date();
      await recordGooglePurchase(
        owner,
        purchase({ purchaseDate: now, environment: "Test" }),
        now,
      );
      const second = purchase({ purchaseDate: now });
      await recordGooglePurchase(owner, second, now);
      const [row] = await rowsOf(second.purchaseToken);
      expect(row.startsAt).toEqual(now);
    });

    it.each([
      [{ packageName: "com.example.other" }, "unknownPackage"],
      [{ productId: "help.mahjong.score.other" }, "unknownProduct"],
      [{ state: "cancelled" }, "cancelled"],
      [{ state: "pending" }, "pending"],
      [{ environment: "Test" }, "testNotAccepted"],
    ] as const)(
      "%o は %s で拒否し、何も書かない",
      async (overrides, reason) => {
        const bought = purchase(overrides);
        expect(await recordGooglePurchase(owner, bought)).toEqual({
          outcome: "rejected",
          reason,
        });
        expect(await rowsOf(bought.purchaseToken)).toHaveLength(0);
      },
    );

    it("許可リストにいる人の Test の購入は記録する", async () => {
      vi.stubEnv("GOOGLE_IAP_TEST_USER_IDS", `${other},${owner}`);
      const bought = purchase({ environment: "Test" });
      expect((await recordGooglePurchase(owner, bought)).outcome).toBe(
        "recorded",
      );
      const [row] = await rowsOf(bought.purchaseToken);
      expect(row.googleEnvironment).toBe("Test");
    });

    it("退会を受け付けた人は accountUnavailable で何も書かない", async () => {
      await billingTestDb().insert(accountDeletions).values({ userId: owner });
      const bought = purchase();
      expect(await recordGooglePurchase(owner, bought)).toEqual({
        outcome: "accountUnavailable",
      });
      expect(await rowsOf(bought.purchaseToken)).toHaveLength(0);
      expect(await billingTestDb().select().from(notifications)).toHaveLength(
        0,
      );
    });

    it("CHECK は Google の行に Apple の列が混ざるのを弾く", async () => {
      await expect(
        billingTestDb()
          .insert(purchases)
          .values({
            userId: owner,
            provider: "google",
            plan: "pro",
            kind: "lifetime",
            benefits: [...PLANS.pro.benefits],
            googlePurchaseToken: "token-mixed",
            googleProductId: LIFETIME_ID,
            googleEnvironment: "Production",
            appleTransactionId: "2000000000099999",
            currency: "jpy",
            amount: 0,
            startsAt: new Date(),
          }),
      ).rejects.toThrow();
    });
  },
);
