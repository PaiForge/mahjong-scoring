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
 * タイトル別リンク一括更新のテスト
 *
 * @description
 * 同じ題の行をまとめて書き換えるので、書き換える前の URL は行ごとに違う。
 * 監査ログの `before` が行ごとの配列で、更新と同じトランザクションに
 * 残ることを固定する。
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
  adCreatives: { id: "id", slot: "slot", href: "href" },
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

import { setAdCreativeHrefByTitle } from "../set-ad-creative-href-by-title";

const BEFORE = [
  { id: "ad-1", href: "https://example.com/old-1" },
  { id: "ad-2", href: "https://example.com/old-2" },
];

let selectChain: QueryChainMock;
let updateChain: QueryChainMock;
let tx: { select: Mock; update: Mock };

beforeEach(() => {
  vi.clearAllMocks();
  selectChain = createQueryChain(BEFORE);
  updateChain = createQueryChain([{ id: "ad-1" }, { id: "ad-2" }]);
  tx = { select: vi.fn(() => selectChain), update: vi.fn(() => updateChain) };
  setupAdminActor(tx);
});

describe("setAdCreativeHrefByTitle", () => {
  it("管理者でなければ errorSaveFailed で DB に触らない", async () => {
    setupNotAdmin();

    expect(
      await setAdCreativeHrefByTitle("本", "web", "https://example.com/new"),
    ).toEqual({ error: "errorSaveFailed" });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("https でない URL は errorHrefInvalid で DB に触らない", async () => {
    expect(
      await setAdCreativeHrefByTitle("本", "web", "http://example.com/new"),
    ).toEqual({ error: "errorHrefInvalid" });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("該当する行が無ければ errorNotFound で更新も記録もしない", async () => {
    selectChain = createQueryChain([]);

    expect(
      await setAdCreativeHrefByTitle("本", "web", "https://example.com/new"),
    ).toEqual({ error: "errorNotFound" });
    expect(tx.update).not.toHaveBeenCalled();
    expect(mockRecordContentAction).not.toHaveBeenCalled();
  });

  it("行を押さえて前の URL を読み、行ごとの before と新しい URL を監査ログに残す", async () => {
    expect(
      await setAdCreativeHrefByTitle("本", "web", " https://example.com/new "),
    ).toEqual({ success: true, updated: 2 });
    expect(selectChain.for).toHaveBeenCalledWith("update");
    expect(updateChain.set).toHaveBeenCalledWith({
      href: "https://example.com/new",
      updatedAt: expect.any(Date),
    });
    expect(mockRecordContentAction).toHaveBeenCalledWith(tx, {
      actorId: ADMIN_ACTOR_ID,
      action: "set_ad_creative_href_by_title",
      target: { type: "ad_title", key: "本" },
      ipAddress: ADMIN_CLIENT_IP,
      metadata: {
        platform: "web",
        before: BEFORE,
        after: "https://example.com/new",
      },
    });
    expect(mockRevalidateAdCreatives).toHaveBeenCalledTimes(1);
  });
});
