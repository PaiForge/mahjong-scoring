import type { SupabaseClient, User } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BenefitGrant, Purchase } from "@/lib/db";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { createSelectSequenceMock } from "@/test/drizzle-mock";

import { fetchPlanStatusMap, fetchUsersPageData } from "../queries";

const selectMock = vi.hoisted(() => ({
  select: vi.fn(),
}));

vi.mock("@/lib/db", async () => ({
  db: { select: selectMock.select },
  ...(await import("@/test/schema-mock")),
}));
vi.mock("drizzle-orm", async () => await import("@/test/drizzle-orm-mock"));

vi.mock("@/app/admin/_lib/log-query-helpers", () => ({
  findUserIdsMatching: vi.fn(),
}));
vi.mock("@/lib/supabase/list-all-auth-users", () => ({
  listAllAuthUsers: vi.fn(),
}));

const listUsers = vi.fn();
const adminClient = {
  auth: { admin: { listUsers } },
} as unknown as SupabaseClient;

function fakeUser(id: string): User {
  return { id } as User;
}

describe("fetchUsersPageData（検索なし）", () => {
  beforeEach(() => {
    listUsers.mockReset();
  });

  it("範囲内のページは 1 回の取得で返す", async () => {
    listUsers.mockResolvedValue({
      data: { users: [fakeUser("a")], total: 45 },
      error: undefined,
    });

    const result = await fetchUsersPageData(adminClient, 2, "");

    expect(listUsers).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ currentPage: 2, totalPages: 3 });
  });

  it("最終ページを超えたら最終ページに丸めて引き直す", async () => {
    listUsers
      .mockResolvedValueOnce({
        data: { users: [], total: 45 },
        error: undefined,
      })
      .mockResolvedValueOnce({
        data: { users: [fakeUser("last")], total: 45 },
        error: undefined,
      });

    const result = await fetchUsersPageData(adminClient, 9, "");

    expect(listUsers).toHaveBeenLastCalledWith({
      page: 3,
      perPage: DEFAULT_PAGE_SIZE,
    });
    expect(result).toEqual({
      users: [fakeUser("last")],
      totalCount: 45,
      currentPage: 3,
      totalPages: 3,
    });
  });
});

const NOW = new Date("2026-10-01T03:00:00Z");

function purchase(overrides: Partial<Purchase>): Purchase {
  return {
    id: "p",
    userId: "u",
    plan: "pro",
    kind: "pass",
    benefits: ["unlimited_practice"],
    provider: "stripe",
    stripeCheckoutSessionId: "cs",
    stripePaymentIntentId: "pi",
    appleTransactionId: null,
    appleOriginalTransactionId: null,
    appleProductId: null,
    appleEnvironment: null,
    googlePurchaseToken: null,
    googleOrderId: null,
    googleProductId: null,
    googleEnvironment: null,
    currency: "jpy",
    amount: 480,
    startsAt: new Date("2026-09-20T00:00:00Z"),
    expiresAt: new Date("2026-10-20T00:00:00Z"),
    revokedAt: null,
    revokeReason: null,
    createdAt: new Date("2026-09-20T00:00:00Z"),
    ...overrides,
  };
}

function grant(overrides: Partial<BenefitGrant>): BenefitGrant {
  return {
    id: "g",
    userId: "u",
    plan: "pro",
    benefits: ["unlimited_practice"],
    reason: "モニター",
    grantedBy: "admin",
    startsAt: new Date("2026-09-25T00:00:00Z"),
    expiresAt: null,
    revokedAt: null,
    revokeReason: null,
    createdAt: new Date("2026-09-25T00:00:00Z"),
    ...overrides,
  };
}

describe("fetchPlanStatusMap", () => {
  const sequence = createSelectSequenceMock();

  beforeEach(() => {
    selectMock.select.mockReset();
    selectMock.select.mockImplementation(sequence.select);
  });

  it("利用者が居なければ DB を引かない", async () => {
    sequence.setResults();

    const result = await fetchPlanStatusMap([], NOW);

    expect(selectMock.select).not.toHaveBeenCalled();
    expect(result.size).toBe(0);
  });

  it("購入と付与をページの利用者分だけ 1 回ずつ引く（N+1 にしない）", async () => {
    sequence.setResults([], []);

    await fetchPlanStatusMap(["a", "b", "c"], NOW);

    expect(selectMock.select).toHaveBeenCalledTimes(2);
    const [purchaseChain, grantChain] = sequence.chains;
    expect(purchaseChain?.where).toHaveBeenCalledWith({
      op: "inArray",
      args: ["user_id", ["a", "b", "c"]],
    });
    expect(grantChain?.where).toHaveBeenCalledWith({
      op: "inArray",
      args: ["user_id", ["a", "b", "c"]],
    });
  });

  it("利用者ごとに行を planStatusOf へ渡し、購入の Pro と付与の VIP と無料を分ける", async () => {
    const until = new Date("2026-10-20T00:00:00Z");
    sequence.setResults(
      [
        purchase({ userId: "buyer", expiresAt: until }),
        // 取り消し済みの購入は SQL で落とさず planStatusOf が無効と判定する
        purchase({ userId: "revoked", revokedAt: new Date("2026-09-21") }),
      ],
      [grant({ userId: "granted" })],
    );

    const result = await fetchPlanStatusMap(
      ["buyer", "granted", "revoked", "nobody"],
      NOW,
    );

    expect(result.get("buyer")).toEqual({ kind: "pass", until });
    expect(result.get("granted")).toEqual({
      kind: "granted",
      until: undefined,
    });
    expect(result.get("revoked")).toEqual({ kind: "free" });
    expect(result.get("nobody")).toEqual({ kind: "free" });
  });
});
