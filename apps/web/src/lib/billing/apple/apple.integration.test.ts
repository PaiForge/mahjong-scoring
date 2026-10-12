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

import {
  accountDeletions,
  appleNotificationEvents,
  notifications,
  purchases,
} from "../../db/schema";
import { purchaseStateOf } from "../plan-status";
import {
  billingTestDb,
  closeBillingTestDb,
  setupBillingTestDb,
} from "../test-database";
import { markAppleNotificationProcessed } from "./notification-events";
import { recordAppleTransaction } from "./record";
import { reverseAppleRevocation, revokeAppleTransaction } from "./revoke";
import type { AppleTransaction } from "./verifier";

const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const PASS_ID = "help.mahjong.score.pro.pass30";
const LIFETIME_ID = "help.mahjong.score.pro.lifetime";

let sequence = 0;
/** 取引 ID を毎回変えた検証済みの取引 */
function transaction(
  overrides: Partial<AppleTransaction> = {},
): AppleTransaction {
  sequence += 1;
  const id = `20000000000${String(sequence).padStart(5, "0")}`;
  return {
    transactionId: id,
    originalTransactionId: id,
    bundleId: "help.mahjong.score",
    productId: PASS_ID,
    type: "Non-Renewing Subscription",
    inAppOwnershipType: "PURCHASED",
    purchaseDate: new Date(),
    appAccountToken: owner,
    revocationDate: undefined,
    environment: "Production",
    price: 480000,
    currency: "JPY",
    ...overrides,
  };
}

const lifetime = { productId: LIFETIME_ID, type: "Non-Consumable" } as const;

async function rowsOf(transactionId: string) {
  return billingTestDb()
    .select()
    .from(purchases)
    .where(eq(purchases.appleTransactionId, transactionId));
}

let notificationSequence = 0;
/**
 * 通知ごとに UUID を変えた通知の識別。署名日時を省くと呼んだ順に 1 秒ずつ進む
 * （同じミリ秒に並ぶと前後関係が決まらないため）
 */
function identity(type: string, signedDate?: Date) {
  notificationSequence += 1;
  return {
    notificationUuid: `uuid-${notificationSequence}`,
    notificationType: type,
    subtype: undefined,
    signedDate:
      signedDate ??
      new Date(Date.UTC(2026, 9, 1) + notificationSequence * 1000),
  };
}

function markNotification(
  type: string,
  transactionId: string,
  signedDate?: Date,
) {
  return markAppleNotificationProcessed({
    ...identity(type, signedDate),
    transactionId,
  });
}

async function eventsOf(transactionId: string) {
  return billingTestDb()
    .select()
    .from(appleNotificationEvents)
    .where(eq(appleNotificationEvents.appleTransactionId, transactionId));
}

describe.skipIf(!process.env.BILLING_TEST_DATABASE_URL)(
  "App Store の購入の記録 (PostgreSQL)",
  () => {
    beforeAll(setupBillingTestDb);
    afterAll(async () => {
      vi.unstubAllEnvs();
      await closeBillingTestDb();
    });
    beforeEach(async () => {
      vi.stubEnv("APPLE_IAP_PRODUCT_ID_PRO_PASS", PASS_ID);
      vi.stubEnv("APPLE_IAP_PRODUCT_ID_PRO_LIFETIME", LIFETIME_ID);
      vi.stubEnv("APPLE_IAP_SANDBOX_USER_IDS", "");
      const db = billingTestDb();
      await db.delete(notifications);
      await db.delete(purchases);
      await db.delete(appleNotificationEvents);
      await db.delete(accountDeletions);
    });

    it("初回の記録で Apple の行が 1 つ入り、特典は今のプランのもの", async () => {
      const tx = transaction();
      const result = await recordAppleTransaction(owner, tx);
      expect(result.outcome).toBe("recorded");
      const rows = await rowsOf(tx.transactionId);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        userId: owner,
        provider: "apple",
        kind: "pass",
        benefits: [...PLANS.pro.benefits],
        appleEnvironment: "Production",
        amount: 480,
        currency: "jpy",
        revokedAt: null,
      });
      const sent = await billingTestDb().select().from(notifications);
      expect(sent.map((n) => n.type)).toEqual(["purchase_completed"]);
    });

    it("同じ取引は本人なら duplicate、他人なら ownedByAnotherAccount", async () => {
      const tx = transaction({ ...lifetime });
      await recordAppleTransaction(owner, tx);
      expect(await recordAppleTransaction(owner, tx)).toEqual({
        outcome: "duplicate",
      });
      expect(await recordAppleTransaction(other, tx)).toEqual({
        outcome: "ownedByAnotherAccount",
      });
      expect(await rowsOf(tx.transactionId)).toHaveLength(1);
    });

    it("並行した 2 本の記録でも行は 1 つ", async () => {
      const tx = transaction({ ...lifetime });
      const results = await Promise.all([
        recordAppleTransaction(owner, tx),
        recordAppleTransaction(owner, tx),
      ]);
      expect(results.map((r) => r.outcome).sort()).toEqual([
        "duplicate",
        "recorded",
      ]);
      expect(await rowsOf(tx.transactionId)).toHaveLength(1);
    });

    it("revocationDate 付きの取引は返金済みで入る", async () => {
      const revokedAt = new Date();
      const tx = transaction({ revocationDate: revokedAt });
      expect((await recordAppleTransaction(owner, tx)).outcome).toBe(
        "refunded",
      );
      const [row] = await rowsOf(tx.transactionId);
      expect(row.revokedAt).toEqual(revokedAt);
      expect(row.revokeReason).toBe("refunded");
    });

    it("先に届いた REFUND を見て返金済みで入れ、REFUND_REVERSED の後なら有効で入れる", async () => {
      const refunded = transaction();
      await markNotification("REFUND", refunded.transactionId);
      expect((await recordAppleTransaction(owner, refunded)).outcome).toBe(
        "refunded",
      );
      const [row] = await rowsOf(refunded.transactionId);
      expect(row.revokeReason).toBe("refunded");

      const reversed = transaction({ ...lifetime });
      await markNotification("REFUND", reversed.transactionId);
      await markNotification("REFUND_REVERSED", reversed.transactionId);
      expect((await recordAppleTransaction(owner, reversed)).outcome).toBe(
        "recorded",
      );
    });

    it("REFUND_REVERSED が先に届き REFUND が後に届いても、署名順で有効で入れる", async () => {
      const tx = transaction({ ...lifetime });
      const refundSignedAt = new Date("2026-10-01T00:00:00Z");
      const reversedSignedAt = new Date("2026-10-02T00:00:00Z");
      await markNotification(
        "REFUND_REVERSED",
        tx.transactionId,
        reversedSignedAt,
      );
      await markNotification("REFUND", tx.transactionId, refundSignedAt);
      expect((await recordAppleTransaction(owner, tx)).outcome).toBe(
        "recorded",
      );
    });

    it("先に届いた REFUND の取り消しの日時はその署名日時", async () => {
      const tx = transaction();
      const signedAt = new Date("2026-10-03T00:00:00Z");
      await markNotification("REFUND", tx.transactionId, signedAt);
      await recordAppleTransaction(owner, tx);
      const [row] = await rowsOf(tx.transactionId);
      expect(row.revokedAt).toEqual(signedAt);
    });

    it("先に届いた REVOKE は revoked で入れる", async () => {
      const tx = transaction();
      await markNotification("REVOKE", tx.transactionId);
      expect((await recordAppleTransaction(owner, tx)).outcome).toBe(
        "refunded",
      );
      const [row] = await rowsOf(tx.transactionId);
      expect(row.revokeReason).toBe("revoked");
    });

    it("有効なパスがある人の 2 枚目のパスは 1 枚目の期限から始まる開始待ち", async () => {
      const now = new Date();
      const first = transaction({ purchaseDate: now });
      await recordAppleTransaction(owner, first, now);
      const second = transaction({ purchaseDate: now });
      expect((await recordAppleTransaction(owner, second, now)).outcome).toBe(
        "recorded",
      );
      const [firstRow] = await rowsOf(first.transactionId);
      const [secondRow] = await rowsOf(second.transactionId);
      expect(secondRow.startsAt).toEqual(firstRow.expiresAt);
      expect(secondRow.expiresAt).toEqual(
        addPassDuration(secondRow.startsAt, 30),
      );
      expect(purchaseStateOf(secondRow, now)).toBe("scheduled");
    });

    it("Sandbox の有効なパスは 2 枚目の開始を動かさない", async () => {
      vi.stubEnv("APPLE_IAP_SANDBOX_USER_IDS", owner);
      const now = new Date();
      await recordAppleTransaction(
        owner,
        transaction({ purchaseDate: now, environment: "Sandbox" }),
        now,
      );
      const second = transaction({ purchaseDate: now });
      await recordAppleTransaction(owner, second, now);
      const [row] = await rowsOf(second.transactionId);
      expect(row.startsAt).toEqual(now);
    });

    it.each([
      [{ inAppOwnershipType: "FAMILY_SHARED" }, "familyShared"],
      [{ productId: "help.mahjong.score.other" }, "unknownProduct"],
      [{ type: "Non-Consumable" }, "unexpectedType"],
      [{ bundleId: "com.example.other" }, "unknownBundle"],
      [{ environment: "Sandbox" }, "sandboxNotAccepted"],
    ] as const)(
      "%o は %s で拒否し、何も書かない",
      async (overrides, reason) => {
        const tx = transaction(overrides);
        expect(await recordAppleTransaction(owner, tx)).toEqual({
          outcome: "rejected",
          reason,
        });
        expect(await rowsOf(tx.transactionId)).toHaveLength(0);
      },
    );

    it("許可リストにいる人の Sandbox の取引は記録する", async () => {
      vi.stubEnv("APPLE_IAP_SANDBOX_USER_IDS", `${other},${owner}`);
      const tx = transaction({ environment: "Sandbox" });
      expect((await recordAppleTransaction(owner, tx)).outcome).toBe(
        "recorded",
      );
      const [row] = await rowsOf(tx.transactionId);
      expect(row.appleEnvironment).toBe("Sandbox");
    });

    it("退会を受け付けた人は accountUnavailable で何も書かない", async () => {
      await billingTestDb().insert(accountDeletions).values({ userId: owner });
      const tx = transaction();
      expect(await recordAppleTransaction(owner, tx)).toEqual({
        outcome: "accountUnavailable",
      });
      expect(await rowsOf(tx.transactionId)).toHaveLength(0);
      expect(await billingTestDb().select().from(notifications)).toHaveLength(
        0,
      );
    });

    it("取り消して戻すと行が有効に戻り、取り消しは本人に通知される", async () => {
      const tx = transaction({ ...lifetime });
      await recordAppleTransaction(owner, tx);
      expect(
        await revokeAppleTransaction(
          tx.transactionId,
          "refunded",
          identity("REFUND"),
        ),
      ).toBe("revoked");
      expect(
        await revokeAppleTransaction(
          tx.transactionId,
          "refunded",
          identity("REFUND"),
        ),
      ).toBe("alreadyRevoked");
      const [revoked] = await rowsOf(tx.transactionId);
      expect(revoked.revokeReason).toBe("refunded");
      const sent = await billingTestDb().select().from(notifications);
      expect(sent.map((n) => n.type).sort()).toEqual([
        "purchase_completed",
        "purchase_revoked",
      ]);

      expect(
        await reverseAppleRevocation(
          tx.transactionId,
          identity("REFUND_REVERSED"),
        ),
      ).toBe("reversed");
      const [restored] = await rowsOf(tx.transactionId);
      expect(restored.revokedAt).toBeNull();
      expect(restored.revokeReason).toBeNull();
      expect(
        await reverseAppleRevocation(
          tx.transactionId,
          identity("REFUND_REVERSED"),
        ),
      ).toBe("notRefunded");
    });

    it("fraud で止めた行は返金の覆りで戻さない", async () => {
      const tx = transaction({ ...lifetime });
      await recordAppleTransaction(owner, tx);
      await billingTestDb()
        .update(purchases)
        .set({ revokedAt: new Date(), revokeReason: "fraud" })
        .where(eq(purchases.appleTransactionId, tx.transactionId));
      expect(
        await reverseAppleRevocation(
          tx.transactionId,
          identity("REFUND_REVERSED"),
        ),
      ).toBe("notRefunded");
      const [row] = await rowsOf(tx.transactionId);
      expect(row.revokeReason).toBe("fraud");
    });

    it("行の無い取引の取り消し・戻しは notFound で、同じトランザクションで記録表に書く", async () => {
      const refund = identity("REFUND");
      expect(await revokeAppleTransaction("missing", "refunded", refund)).toBe(
        "notFound",
      );
      expect(await eventsOf("missing")).toMatchObject([
        {
          notificationUuid: refund.notificationUuid,
          notificationType: "REFUND",
        },
      ]);
      expect(
        await reverseAppleRevocation("missing", identity("REFUND_REVERSED")),
      ).toBe("notFound");
      expect(
        (await eventsOf("missing")).map((e) => e.notificationType).sort(),
      ).toEqual(["REFUND", "REFUND_REVERSED"]);
    });

    it("取り消しと記録が並行しても、行は取り消し済みで終わる", async () => {
      for (let i = 0; i < 10; i += 1) {
        const tx = transaction({ ...lifetime });
        await Promise.all([
          revokeAppleTransaction(
            tx.transactionId,
            "refunded",
            identity("REFUND"),
          ),
          recordAppleTransaction(owner, tx),
        ]);
        const [row] = await rowsOf(tx.transactionId);
        expect(row.revokedAt).not.toBeNull();
        expect(row.revokeReason).toBe("refunded");
      }
    });

    it("退会を受け付けた人の行は取り消さず、通知を記録表に書く", async () => {
      const tx = transaction({ ...lifetime });
      await recordAppleTransaction(owner, tx);
      await billingTestDb().insert(accountDeletions).values({ userId: owner });
      expect(
        await revokeAppleTransaction(
          tx.transactionId,
          "refunded",
          identity("REFUND"),
        ),
      ).toBe("notFound");
      const [row] = await rowsOf(tx.transactionId);
      expect(row.revokedAt).toBeNull();
      expect(
        (await eventsOf(tx.transactionId)).map((e) => e.notificationType),
      ).toEqual(["REFUND"]);
    });
  },
);
