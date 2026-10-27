import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import {
  ADMIN_ACTOR_ID,
  ADMIN_CLIENT_IP,
  mockRecordContentAction,
  setupAdminActor,
} from "@/test/admin-action-mocks";
import { createQueryChain, type QueryChainMock } from "@/test/drizzle-mock";

/** 広告の掲載切替のテスト。前後の掲載状態が監査ログに残ることを固定する */

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
  adCreatives: { id: "id", isActive: "is_active" },
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

import { setAdCreativeActive } from "../set-ad-creative-active";

let selectChain: QueryChainMock;
let updateChain: QueryChainMock;
let tx: { select: Mock; update: Mock };

beforeEach(() => {
  vi.clearAllMocks();
  selectChain = createQueryChain([{ isActive: false }]);
  updateChain = createQueryChain([]);
  tx = { select: vi.fn(() => selectChain), update: vi.fn(() => updateChain) };
  setupAdminActor(tx);
});

describe("setAdCreativeActive", () => {
  it("行が無ければ errorNotFound で更新も記録もしない", async () => {
    selectChain = createQueryChain([]);

    expect(await setAdCreativeActive("missing", true)).toEqual({
      error: "errorNotFound",
    });
    expect(tx.update).not.toHaveBeenCalled();
    expect(mockRecordContentAction).not.toHaveBeenCalled();
    expect(mockRevalidateAdCreatives).not.toHaveBeenCalled();
  });

  it("前の掲載状態を押さえて読み、前後を監査ログに残す", async () => {
    expect(await setAdCreativeActive("ad-1", true)).toEqual({ success: true });
    expect(selectChain.for).toHaveBeenCalledWith("update");
    expect(updateChain.set).toHaveBeenCalledWith({
      isActive: true,
      updatedAt: expect.any(Date),
    });
    expect(mockRecordContentAction).toHaveBeenCalledWith(tx, {
      actorId: ADMIN_ACTOR_ID,
      action: "set_ad_creative_active",
      target: { type: "ad_creative", key: "ad-1" },
      ipAddress: ADMIN_CLIENT_IP,
      metadata: { before: false, after: true },
    });
    expect(mockRevalidateAdCreatives).toHaveBeenCalledTimes(1);
  });
});
