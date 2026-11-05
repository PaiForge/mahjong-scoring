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

import type { AdCreativeInput } from "../../_lib/validation";

/**
 * 広告更新のテスト
 *
 * @description
 * スロットは既存の行のものを使い入力では動かさないこと、文言は行ごと
 * 入れ替えて更新前の行と文言を監査ログに残すこと、DB の失敗が例外ではなく
 * 失敗理由で返ることを固定する。
 */

const { mockRevalidateAdCreatives, mockSelect } = vi.hoisted(() => ({
  mockRevalidateAdCreatives: vi.fn(),
  mockSelect: vi.fn(),
}));

vi.mock("next/cache", async () => await import("@/test/admin-action-mocks"));
vi.mock("@/lib/db", async () => {
  const shared = await import("@/test/admin-action-db-mock");
  return { ...shared, db: { ...shared.db, select: mockSelect } };
});
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
vi.mock("../../_lib/image-url", () => ({
  adImageUrlPrefix: () => "https://storage.example/ad-creatives/",
}));

import { updateAdCreative } from "../update-ad-creative";

const SLOT = "practice-grid-native-ad";
const INPUT: AdCreativeInput = {
  // 入力のスロットは無視され、既存の行のスロットで検証・保存される
  slot: "ignored",
  asin: "",
  href: "https://example.com/new",
  isActive: true,
  icon: "📗",
  imageUrl: "",
  imageAlt: "",
  hand: "",
  title: { ja: "新しい題" },
  description: {},
};
const BEFORE = {
  id: "ad-1",
  slot: SLOT,
  href: "https://example.com/old",
  isActive: false,
};
const BEFORE_COPY = [
  { creativeId: "ad-1", locale: "ja", title: "古い題", description: null },
];

let beforeChain: QueryChainMock;
let copyChain: QueryChainMock;
let updateChain: QueryChainMock;
let deleteChain: QueryChainMock;
let insertChain: QueryChainMock;
let tx: { select: Mock; update: Mock; delete: Mock; insert: Mock };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  mockSelect.mockImplementation(() => createQueryChain([{ slot: SLOT }]));
  beforeChain = createQueryChain([BEFORE]);
  copyChain = createQueryChain(BEFORE_COPY);
  updateChain = createQueryChain([]);
  deleteChain = createQueryChain([]);
  insertChain = createQueryChain([]);
  tx = {
    // 1 回目が更新前の行、2 回目が更新前の文言
    select: vi
      .fn()
      .mockImplementationOnce(() => beforeChain)
      .mockImplementationOnce(() => copyChain),
    update: vi.fn(() => updateChain),
    delete: vi.fn(() => deleteChain),
    insert: vi.fn(() => insertChain),
  };
  setupAdminActor(tx);
});

describe("updateAdCreative", () => {
  it("管理者でなければ errorSaveFailed で DB に触らない", async () => {
    setupNotAdmin();

    expect(await updateAdCreative("ad-1", INPUT)).toEqual({
      error: "errorSaveFailed",
    });
    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("行が無ければ errorNotFound でトランザクションを開かない", async () => {
    mockSelect.mockImplementation(() => createQueryChain([]));

    expect(await updateAdCreative("missing", INPUT)).toEqual({
      error: "errorNotFound",
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("既存のスロットで保存し、更新前の行と文言を監査ログに残す", async () => {
    expect(await updateAdCreative("ad-1", INPUT)).toEqual({
      success: true,
      id: "ad-1",
    });
    expect(beforeChain.for).toHaveBeenCalledWith("update");
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        slot: SLOT,
        href: "https://example.com/new",
        updatedAt: expect.any(Date),
      }),
    );
    expect(tx.delete).toHaveBeenCalledTimes(1);
    expect(insertChain.values).toHaveBeenCalledWith([
      expect.objectContaining({ creativeId: "ad-1", title: "新しい題" }),
    ]);
    expect(mockRecordContentAction).toHaveBeenCalledWith(tx, {
      actorId: ADMIN_ACTOR_ID,
      action: "update_ad_creative",
      target: { type: "ad_creative", key: "ad-1" },
      ipAddress: ADMIN_CLIENT_IP,
      metadata: {
        before: {
          ...BEFORE,
          copy: { title: { ja: "古い題" }, description: {} },
        },
        after: expect.objectContaining({
          slot: SLOT,
          href: "https://example.com/new",
          copy: { title: { ja: "新しい題" }, description: {} },
        }),
      },
    });
    expect(mockRevalidateAdCreatives).toHaveBeenCalledTimes(1);
  });

  it("トランザクションが失敗したら errorSaveFailed でログを残し、再検証しない", async () => {
    mockTransaction.mockRejectedValue(new Error("connection lost"));

    expect(await updateAdCreative("ad-1", INPUT)).toEqual({
      error: "errorSaveFailed",
    });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[updateAdCreative]"),
      "connection lost",
    );
    expect(mockRecordContentAction).not.toHaveBeenCalled();
    expect(mockRevalidateAdCreatives).not.toHaveBeenCalled();
  });
});
