import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import {
  ADMIN_ACTOR_ID,
  ADMIN_CLIENT_IP,
  mockRecordContentAction,
  mockTransaction,
  setupAdminActor,
  setupNotAdmin,
} from "@/test/admin-action-mocks";
import { createQueryChain, type QueryChainMock } from "@/test/drizzle-mock";

/**
 * 広告並び替えのテスト
 *
 * @description
 * 並べ替えは「どれを掲載するか」の操作でもある。スロット全体の並びを
 * 連番で書き直し、動かす前後の並びが監査ログに残ること、端で動かせない
 * ときは何も書かないこと、DB の失敗が例外ではなく失敗理由で返ることを固定する。
 */

const { mockRevalidateAdCreatives } = vi.hoisted(() => ({
  mockRevalidateAdCreatives: vi.fn(),
}));

vi.mock("next/cache", async () => await import("@/test/admin-action-mocks"));
vi.mock(
  "@/lib/client-ip",
  async () => await import("@/test/admin-action-mocks"),
);
vi.mock("@/lib/db", async () => ({
  db: {
    transaction: (await import("@/test/admin-action-mocks")).mockTransaction,
  },
  adCreatives: {
    id: "id",
    slot: "slot",
    sortOrder: "sort_order",
    createdAt: "created_at",
  },
}));
vi.mock("drizzle-orm", async () => await import("@/test/drizzle-orm-mock"));
vi.mock(
  "@/app/admin/_lib/auth",
  async () => await import("@/test/admin-action-mocks"),
);
vi.mock("@/app/admin/_lib/content-action", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/app/admin/_lib/content-action")>()),
  recordContentAction: (await import("@/test/admin-action-mocks"))
    .mockRecordContentAction,
}));
vi.mock("../../_lib/revalidate", () => ({
  revalidateAdCreatives: mockRevalidateAdCreatives,
}));

import { moveAdCreative } from "../move-ad-creative";

const SLOT = "practice-grid-native-ad";
const ORDER = [{ id: "ad-1" }, { id: "ad-2" }, { id: "ad-3" }];

let targetChain: QueryChainMock;
let rowsChain: QueryChainMock;
let updateChain: QueryChainMock;
let tx: { select: Mock; update: Mock };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  targetChain = createQueryChain([{ slot: SLOT }]);
  rowsChain = createQueryChain(ORDER);
  updateChain = createQueryChain([]);
  tx = {
    // 1 回目が動かす行のスロット、2 回目がそのスロットの並び
    select: vi
      .fn()
      .mockImplementationOnce(() => targetChain)
      .mockImplementationOnce(() => rowsChain),
    update: vi.fn(() => updateChain),
  };
  setupAdminActor(tx);
});

describe("moveAdCreative", () => {
  it("管理者でなければ errorSaveFailed で DB に触らない", async () => {
    setupNotAdmin();

    expect(await moveAdCreative("ad-2", "up")).toEqual({
      error: "errorSaveFailed",
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("行が無ければ errorNotFound で更新も記録もしない", async () => {
    targetChain = createQueryChain([]);

    expect(await moveAdCreative("missing", "up")).toEqual({
      error: "errorNotFound",
    });
    expect(tx.update).not.toHaveBeenCalled();
    expect(mockRecordContentAction).not.toHaveBeenCalled();
    expect(mockRevalidateAdCreatives).not.toHaveBeenCalled();
  });

  it("端にあって動かせないときは何も書かず、記録もしない", async () => {
    expect(await moveAdCreative("ad-3", "down")).toEqual({ success: true });
    expect(tx.update).not.toHaveBeenCalled();
    expect(mockRecordContentAction).not.toHaveBeenCalled();
  });

  it("スロット全体を連番で書き直し、前後の並びを監査ログに残す", async () => {
    expect(await moveAdCreative("ad-2", "up")).toEqual({ success: true });
    expect(tx.update).toHaveBeenCalledTimes(3);
    expect(updateChain.set.mock.calls).toEqual([
      [{ sortOrder: 0 }],
      [{ sortOrder: 1 }],
      [{ sortOrder: 2 }],
    ]);
    expect(mockRecordContentAction).toHaveBeenCalledWith(tx, {
      actorId: ADMIN_ACTOR_ID,
      action: "move_ad_creative",
      target: { type: "ad_creative", key: "ad-2" },
      ipAddress: ADMIN_CLIENT_IP,
      metadata: {
        slot: SLOT,
        direction: "up",
        before: ["ad-1", "ad-2", "ad-3"],
        after: ["ad-2", "ad-1", "ad-3"],
      },
    });
    expect(mockRevalidateAdCreatives).toHaveBeenCalledTimes(1);
  });

  it("トランザクションが失敗したら errorSaveFailed でログを残し、再検証しない", async () => {
    mockTransaction.mockRejectedValue(new Error("connection lost"));

    expect(await moveAdCreative("ad-2", "up")).toEqual({
      error: "errorSaveFailed",
    });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[moveAdCreative]"),
      "connection lost",
    );
    expect(mockRecordContentAction).not.toHaveBeenCalled();
    expect(mockRevalidateAdCreatives).not.toHaveBeenCalled();
  });
});
