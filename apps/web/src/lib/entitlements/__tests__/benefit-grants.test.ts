import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSelect } = vi.hoisted(() => ({ mockSelect: vi.fn() }));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db", async () => ({
  db: { select: mockSelect },
  benefitGrants: (await import("@/test/schema-mock")).benefitGrants,
}));

vi.mock("drizzle-orm", async () => await import("@/test/drizzle-orm-mock"));

import { createQueryChain, type QueryChainMock } from "@/test/drizzle-mock";
import type { TransactionClient } from "@/lib/db";

import {
  insertBenefitGrant,
  listBenefitGrants,
  revokeBenefitGrant,
} from "../benefit-grants";

const NOW = new Date("2026-10-01T12:00:00Z");

/** `tx.insert()` / `tx.update()` のチェーンを持つトランザクションのモック */
function fakeTx(chain: QueryChainMock): TransactionClient {
  // テストコードでの型アサーションは規約上許容されている
  return {
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
  } as unknown as TransactionClient;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("insertBenefitGrant", () => {
  it("プランの特典をスナップショットし、日数から期限を決めて INSERT する", async () => {
    const chain = createQueryChain();
    chain.returning.mockResolvedValue([{ id: "g1" }]);
    const tx = fakeTx(chain);

    const row = await insertBenefitGrant(
      tx,
      {
        userId: "u1",
        plan: "pro",
        reason: "モニター",
        grantedBy: "admin-1",
        durationDays: 30,
      },
      NOW,
    );

    expect(row).toEqual({ id: "g1" });
    expect(chain.values).toHaveBeenCalledWith({
      userId: "u1",
      plan: "pro",
      benefits: ["unlimited_practice", "practice_tools"],
      reason: "モニター",
      grantedBy: "admin-1",
      startsAt: NOW,
      expiresAt: new Date("2026-10-31T12:00:00Z"),
    });
  });

  it("日数が無ければ無期限（expires_at は undefined）", async () => {
    const chain = createQueryChain();
    chain.returning.mockResolvedValue([{ id: "g1" }]);

    await insertBenefitGrant(
      fakeTx(chain),
      {
        userId: "u1",
        plan: "pro",
        reason: "補償",
        grantedBy: "admin-1",
        durationDays: undefined,
      },
      NOW,
    );

    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ expiresAt: undefined }),
    );
  });
});

describe("revokeBenefitGrant", () => {
  it("未取消の行だけを対象に revoked_at と理由を立て、更新した行を返す", async () => {
    const chain = createQueryChain();
    chain.returning.mockResolvedValue([{ id: "g1", revokedAt: NOW }]);

    const row = await revokeBenefitGrant(fakeTx(chain), "g1", "誤付与", NOW);

    expect(row).toEqual({ id: "g1", revokedAt: NOW });
    expect(chain.set).toHaveBeenCalledWith({
      revokedAt: NOW,
      revokeReason: "誤付与",
    });
    expect(chain.where).toHaveBeenCalledWith({
      op: "and",
      args: [
        { op: "eq", args: ["id", "g1"] },
        { op: "isNull", args: ["revoked_at"] },
      ],
    });
  });

  it("該当行が無い（取消済み・存在しない）なら undefined", async () => {
    const chain = createQueryChain();
    chain.returning.mockResolvedValue([]);

    expect(
      await revokeBenefitGrant(fakeTx(chain), "missing", "理由", NOW),
    ).toBeUndefined();
  });
});

describe("listBenefitGrants", () => {
  it("ユーザーの付与を新しい順に返す", async () => {
    const chain = createQueryChain([{ id: "g2" }, { id: "g1" }]);
    mockSelect.mockReturnValue(chain);

    const rows = await listBenefitGrants("u1");

    expect(rows).toEqual([{ id: "g2" }, { id: "g1" }]);
    expect(chain.where).toHaveBeenCalledWith({
      op: "eq",
      args: ["user_id", "u1"],
    });
    expect(chain.orderBy).toHaveBeenCalledWith({
      op: "desc",
      args: ["created_at"],
    });
  });

  it("DB が失敗したら空配列でログを残す", async () => {
    mockSelect.mockImplementation(() => {
      throw new Error("down");
    });

    expect(await listBenefitGrants("u1")).toEqual([]);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[listBenefitGrants]"),
      "down",
    );
  });
});
