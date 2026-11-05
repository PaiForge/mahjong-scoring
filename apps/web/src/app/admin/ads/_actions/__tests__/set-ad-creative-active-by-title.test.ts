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
 * タイトル別掲載一括切替のテスト
 *
 * @description
 * 同じ題の行をまとめて切り替えるので、切り替える前の掲載状態は行ごとに
 * 違う。監査ログの `before` が行ごとの配列で、更新と同じトランザクションに
 * 残ることと、DB の失敗が例外ではなく失敗理由で返ることを固定する。
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
  adCreatives: { id: "id", slot: "slot", isActive: "is_active" },
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
vi.mock("../../_lib/creatives-by-title", () => ({
  creativeIdsWithTitle: vi.fn(() => "ids-with-title"),
}));

import { setAdCreativeActiveByTitle } from "../set-ad-creative-active-by-title";

const BEFORE = [
  { id: "ad-1", isActive: false },
  { id: "ad-2", isActive: true },
];

let selectChain: QueryChainMock;
let updateChain: QueryChainMock;
let tx: { select: Mock; update: Mock };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  selectChain = createQueryChain(BEFORE);
  updateChain = createQueryChain([{ id: "ad-1" }, { id: "ad-2" }]);
  tx = { select: vi.fn(() => selectChain), update: vi.fn(() => updateChain) };
  setupAdminActor(tx);
});

describe("setAdCreativeActiveByTitle", () => {
  it("管理者でなければ errorSaveFailed で DB に触らない", async () => {
    setupNotAdmin();

    expect(await setAdCreativeActiveByTitle("本", true)).toEqual({
      error: "errorSaveFailed",
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("該当する行が無ければ errorNotFound で更新も記録もしない", async () => {
    selectChain = createQueryChain([]);

    expect(await setAdCreativeActiveByTitle("本", true, "web")).toEqual({
      error: "errorNotFound",
    });
    expect(tx.update).not.toHaveBeenCalled();
    expect(mockRecordContentAction).not.toHaveBeenCalled();
  });

  it("行を押さえて前の掲載状態を読み、行ごとの before を監査ログに残す", async () => {
    expect(await setAdCreativeActiveByTitle("本", true, "web")).toEqual({
      success: true,
      updated: 2,
    });
    expect(selectChain.for).toHaveBeenCalledWith("update");
    expect(updateChain.set).toHaveBeenCalledWith({
      isActive: true,
      updatedAt: expect.any(Date),
    });
    expect(mockRecordContentAction).toHaveBeenCalledWith(tx, {
      actorId: ADMIN_ACTOR_ID,
      action: "set_ad_creative_active_by_title",
      target: { type: "ad_title", key: "本" },
      ipAddress: ADMIN_CLIENT_IP,
      metadata: { platform: "web", before: BEFORE, after: true },
    });
    expect(mockRevalidateAdCreatives).toHaveBeenCalledTimes(1);
  });

  it("トランザクションが失敗したら errorSaveFailed でログを残し、再検証しない", async () => {
    mockTransaction.mockRejectedValue(new Error("connection lost"));

    expect(await setAdCreativeActiveByTitle("本", true)).toEqual({
      error: "errorSaveFailed",
    });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[setAdCreativeActiveByTitle]"),
      "connection lost",
    );
    expect(mockRecordContentAction).not.toHaveBeenCalled();
    expect(mockRevalidateAdCreatives).not.toHaveBeenCalled();
  });
});
