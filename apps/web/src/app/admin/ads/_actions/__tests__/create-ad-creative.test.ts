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
 * 広告作成のテスト
 *
 * @description
 * 本体と文言の行と監査ログを 1 つのトランザクションで書くこと、並び順が
 * スロットの末尾になること、DB の失敗が例外ではなく失敗理由で返ることを固定する。
 * 入力の検証そのものは `validation.test.ts` が持つ。
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
  adCreatives: { id: "id", slot: "slot", sortOrder: "sort_order" },
  adCreativeTranslations: { creativeId: "creative_id" },
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
vi.mock("../../_lib/image-url", () => ({
  adImageUrlPrefix: () => "https://storage.example/ad-creatives/",
}));

import { createAdCreative } from "../create-ad-creative";

const INPUT: AdCreativeInput = {
  slot: "practice-grid-native-ad",
  asin: "",
  href: "https://example.com/book",
  isActive: true,
  icon: "📘",
  imageUrl: "",
  imageAlt: "",
  hand: "",
  title: { ja: "本" },
  description: {},
};

let selectChain: QueryChainMock;
let insertChain: QueryChainMock;
let tx: { select: Mock; insert: Mock };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  selectChain = createQueryChain([{ sortOrder: 2 }]);
  insertChain = createQueryChain([{ id: "ad-new" }]);
  tx = { select: vi.fn(() => selectChain), insert: vi.fn(() => insertChain) };
  setupAdminActor(tx);
});

describe("createAdCreative", () => {
  it("管理者でなければ errorSaveFailed で DB に触らない", async () => {
    setupNotAdmin();

    expect(await createAdCreative(INPUT)).toEqual({
      error: "errorSaveFailed",
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("検証に落ちる入力は DB に触らない", async () => {
    expect(await createAdCreative({ ...INPUT, title: {} })).toEqual({
      error: "errorTitleRequired",
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("スロットの末尾に入れ、本体・文言・監査ログを同じトランザクションで書く", async () => {
    expect(await createAdCreative(INPUT)).toEqual({
      success: true,
      id: "ad-new",
    });
    expect(tx.insert).toHaveBeenCalledTimes(2);
    expect(insertChain.values).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        slot: "practice-grid-native-ad",
        href: "https://example.com/book",
        sortOrder: 3,
      }),
    );
    expect(insertChain.values).toHaveBeenNthCalledWith(2, [
      expect.objectContaining({ creativeId: "ad-new", title: "本" }),
    ]);
    expect(mockRecordContentAction).toHaveBeenCalledWith(tx, {
      actorId: ADMIN_ACTOR_ID,
      action: "create_ad_creative",
      target: { type: "ad_creative", key: "ad-new" },
      ipAddress: ADMIN_CLIENT_IP,
      metadata: {
        after: expect.objectContaining({
          sortOrder: 3,
          copy: { title: { ja: "本" }, description: {} },
        }),
      },
    });
    expect(mockRevalidateAdCreatives).toHaveBeenCalledTimes(1);
  });

  it("トランザクションが失敗したら errorSaveFailed でログを残し、再検証しない", async () => {
    mockTransaction.mockRejectedValue(new Error("connection lost"));

    expect(await createAdCreative(INPUT)).toEqual({
      error: "errorSaveFailed",
    });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[createAdCreative]"),
      "connection lost",
    );
    expect(mockRecordContentAction).not.toHaveBeenCalled();
    expect(mockRevalidateAdCreatives).not.toHaveBeenCalled();
  });
});
