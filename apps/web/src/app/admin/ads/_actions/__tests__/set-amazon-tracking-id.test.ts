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
 * トラッキング ID の設定のテスト
 *
 * @description
 * トラッキング ID は収益の行き先で、設定行は `updated_at` しか持たない。
 * 設定・差し替え・削除のどれでも、変更前後の値が同じトランザクションで
 * 監査ログに残ることを固定する。
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
  adNetworkSettings: {
    network: "network",
    platform: "platform",
    trackingId: "tracking_id",
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

import { setAmazonTrackingId } from "../set-amazon-tracking-id";

let selectChain: QueryChainMock;
let insertChain: QueryChainMock;
let deleteChain: QueryChainMock;
let tx: { select: Mock; insert: Mock; delete: Mock };

beforeEach(() => {
  vi.clearAllMocks();
  selectChain = createQueryChain([{ trackingId: "old-22" }]);
  insertChain = createQueryChain([]);
  deleteChain = createQueryChain([]);
  tx = {
    select: vi.fn(() => selectChain),
    insert: vi.fn(() => insertChain),
    delete: vi.fn(() => deleteChain),
  };
  setupAdminActor(tx);
});

describe("setAmazonTrackingId", () => {
  it("管理者でなければ errorSaveFailed で DB に触らない", async () => {
    setupNotAdmin();

    expect(await setAmazonTrackingId("web", "new-22")).toEqual({
      error: "errorSaveFailed",
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("形式が不正な ID は errorTrackingIdInvalid で DB に触らない", async () => {
    expect(await setAmazonTrackingId("web", "NOT VALID")).toEqual({
      error: "errorTrackingIdInvalid",
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("差し替えは前の値を押さえて読み、前後の値を監査ログに残す", async () => {
    expect(await setAmazonTrackingId("web", " new-22 ")).toEqual({
      success: true,
    });
    expect(selectChain.for).toHaveBeenCalledWith("update");
    expect(insertChain.values).toHaveBeenCalledWith({
      network: "amazon_jp",
      platform: "web",
      trackingId: "new-22",
    });
    expect(tx.delete).not.toHaveBeenCalled();
    expect(mockRecordContentAction).toHaveBeenCalledWith(tx, {
      actorId: ADMIN_ACTOR_ID,
      action: "set_amazon_tracking_id",
      target: { type: "ad_network_setting", key: "amazon_jp:web" },
      ipAddress: ADMIN_CLIENT_IP,
      metadata: {
        network: "amazon_jp",
        platform: "web",
        before: "old-22",
        after: "new-22",
      },
    });
    expect(mockRevalidateAdCreatives).toHaveBeenCalledTimes(1);
  });

  it("空文字は設定を消し、after を null で残す", async () => {
    expect(await setAmazonTrackingId("mobile", "")).toEqual({ success: true });
    expect(tx.delete).toHaveBeenCalledTimes(1);
    expect(tx.insert).not.toHaveBeenCalled();
    expect(mockRecordContentAction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        target: { type: "ad_network_setting", key: "amazon_jp:mobile" },
        metadata: expect.objectContaining({ before: "old-22", after: null }),
      }),
    );
  });

  it("未設定からの設定は before を null で残す", async () => {
    selectChain = createQueryChain([]);

    expect(await setAmazonTrackingId("web", "new-22")).toEqual({
      success: true,
    });
    expect(mockRecordContentAction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        metadata: expect.objectContaining({ before: null, after: "new-22" }),
      }),
    );
  });
});
