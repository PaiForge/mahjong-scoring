import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {}, purchases: {}, benefitGrants: {} }));

import {
  selectExpiryNotifications,
  type ExpiredEntitlement,
} from "../plan-expiry";

const EXPIRES = new Date("2026-10-01T03:00:00Z");

function expired(
  userId: string,
  id: string,
  type: "purchase" | "benefit_grant" = "purchase",
): ExpiredEntitlement {
  return { userId, target: { type, id }, plan: "pro", expiresAt: EXPIRES };
}

describe("selectExpiryNotifications", () => {
  it("期限切れの行を plan_expired の通知にし、期限を metadata に載せる", () => {
    expect(selectExpiryNotifications([expired("u1", "p1")], new Set())).toEqual(
      [
        {
          userId: "u1",
          type: "plan_expired",
          target: { type: "purchase", id: "p1" },
          metadata: { plan: "pro", expiresAt: "2026-10-01T03:00:00.000Z" },
        },
      ],
    );
  });

  it("まだ Pro の人（買い直し・付与・買い切り）の行は除く", () => {
    const result = selectExpiryNotifications(
      [
        expired("u1", "p1"),
        expired("u2", "p2"),
        expired("u2", "g1", "benefit_grant"),
      ],
      new Set(["u2"]),
    );
    expect(result.map((n) => n.userId)).toEqual(["u1"]);
  });

  it("同じ人の複数の行は、期限が最も遅い 1 行を対象にして 1 通にする", () => {
    const earlier = new Date("2026-09-30T00:00:00Z");
    const result = selectExpiryNotifications(
      [
        { ...expired("u1", "p1"), expiresAt: earlier },
        expired("u1", "g1", "benefit_grant"),
        expired("u2", "p2"),
      ],
      new Set(),
    );
    expect(result.map((n) => [n.userId, n.target])).toEqual([
      ["u1", { type: "benefit_grant", id: "g1" }],
      ["u2", { type: "purchase", id: "p2" }],
    ]);
    expect(result[0]?.metadata).toEqual({
      plan: "pro",
      expiresAt: "2026-10-01T03:00:00.000Z",
    });
  });
});
