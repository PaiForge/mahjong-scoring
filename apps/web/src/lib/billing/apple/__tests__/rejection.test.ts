import { describe, expect, it } from "vitest";
import { PurchaseKind } from "@mahjong-scoring/features/billing/plans";

import { rejectionOf } from "../rejection";
import type { AppleTransaction } from "../verifier";

const OWNER = "User-A";
const NOBODY: ReadonlySet<string> = new Set();

function transaction(
  overrides: Partial<AppleTransaction> = {},
): AppleTransaction {
  return {
    transactionId: "2000000000000001",
    originalTransactionId: "2000000000000001",
    bundleId: "help.mahjong.score",
    productId: "help.mahjong.score.pro.pass",
    type: "Consumable",
    inAppOwnershipType: "PURCHASED",
    purchaseDate: new Date("2026-10-01T00:00:00Z"),
    appAccountToken: OWNER,
    revocationDate: undefined,
    environment: "Production",
    price: 480000,
    currency: "JPY",
    ...overrides,
  };
}

describe("rejectionOf", () => {
  it("自分のアプリの、売り方どおりの種類の、自分で買った Production の取引は受け入れる", () => {
    expect(
      rejectionOf(OWNER, transaction(), PurchaseKind.Pass, NOBODY),
    ).toBeUndefined();
    expect(
      rejectionOf(
        OWNER,
        transaction({ type: "Non-Consumable" }),
        PurchaseKind.Lifetime,
        NOBODY,
      ),
    ).toBeUndefined();
  });

  it.each([
    [{ bundleId: "other.app" }, PurchaseKind.Pass, "unknownBundle"],
    [{}, undefined, "unknownProduct"],
    [{ type: "Non-Consumable" }, PurchaseKind.Pass, "unexpectedType"],
    [
      { inAppOwnershipType: "FAMILY_SHARED" },
      PurchaseKind.Pass,
      "familyShared",
    ],
    [{ environment: "Sandbox" }, PurchaseKind.Pass, "sandboxNotAccepted"],
  ] as const)("%o は %s で拒む", (overrides, kind, reason) => {
    expect(rejectionOf(OWNER, transaction(overrides), kind, NOBODY)).toBe(
      reason,
    );
  });

  it("許可リストにいる人の Sandbox の取引は受け入れる。比較は小文字で行う", () => {
    const sandbox = transaction({ environment: "Sandbox" });
    expect(
      rejectionOf(OWNER, sandbox, PurchaseKind.Pass, new Set(["user-a"])),
    ).toBeUndefined();
    expect(
      rejectionOf(OWNER, sandbox, PurchaseKind.Pass, new Set(["user-b"])),
    ).toBe("sandboxNotAccepted");
  });
});
