import { describe, expect, it } from "vitest";

import { checkoutStatusOf } from "../checkout-landing";
import type { RecordPurchaseResult } from "../purchases";

describe("checkoutStatusOf", () => {
  it.each<[RecordPurchaseResult, string | undefined]>([
    [{ outcome: "recorded", purchaseId: "p1" }, "success"],
    [{ outcome: "ignored", reason: "notPaid" }, "pending"],
    [{ outcome: "ignored", reason: "unknownCheckout" }, "failed"],
    [{ outcome: "refunded", purchaseId: "p1" }, undefined],
    [{ outcome: "duplicate" }, undefined],
  ])("%o → %s", (result, expected) => {
    expect(checkoutStatusOf(result)).toBe(expected);
  });
});
