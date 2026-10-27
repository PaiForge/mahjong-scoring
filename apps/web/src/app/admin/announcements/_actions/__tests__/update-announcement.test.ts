import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import {
  ADMIN_ACTOR_ID,
  ADMIN_CLIENT_IP,
  mockRecordContentAction,
  mockTransaction,
  setupAdminActor,
} from "@/test/admin-action-mocks";
import { createQueryChain, type QueryChainMock } from "@/test/drizzle-mock";

/**
 * お知らせ更新のテスト
 *
 * @description
 * 更新前の行を押さえて読み、更新後の行と一緒に監査ログに残すこと、
 * slug の重複は errorDuplicate に落ちることを固定する。
 */

const { mockRevalidateAnnouncementPaths, DUPLICATE } = vi.hoisted(() => ({
  mockRevalidateAnnouncementPaths: vi.fn(),
  DUPLICATE: new Error("duplicate"),
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
  announcements: { id: "id" },
}));
vi.mock("@/lib/db/extract-pg-error-code", () => ({
  isUniqueViolation: (error: unknown) => error === DUPLICATE,
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
vi.mock("../../_lib/announcement-row", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../_lib/announcement-row")>()),
  revalidateAnnouncementPaths: mockRevalidateAnnouncementPaths,
}));

import { updateAnnouncement } from "../update-announcement";

const INPUT = {
  slug: "hello",
  title: "新しい題",
  content: "# 新しい本文",
  locale: "ja",
  status: "draft",
  publishedAt: null,
  pinned: false,
};

const BEFORE = {
  id: "ann-1",
  slug: "hello",
  title: "古い題",
  content: "# 古い本文",
  pinnedAt: null,
};
const AFTER = { ...BEFORE, title: "新しい題", content: "# 新しい本文" };

let selectChain: QueryChainMock;
let updateChain: QueryChainMock;
let tx: { select: Mock; update: Mock };

beforeEach(() => {
  vi.clearAllMocks();
  selectChain = createQueryChain([BEFORE]);
  updateChain = createQueryChain([AFTER]);
  tx = { select: vi.fn(() => selectChain), update: vi.fn(() => updateChain) };
  setupAdminActor(tx);
});

describe("updateAnnouncement", () => {
  it("入力が不正なら DB に触らない", async () => {
    expect(await updateAnnouncement("ann-1", { ...INPUT, title: "" })).toEqual({
      error: "errorTitleRequired",
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("行が無ければ errorNotFound で更新も記録もしない", async () => {
    selectChain = createQueryChain([]);

    expect(await updateAnnouncement("missing", INPUT)).toEqual({
      error: "errorNotFound",
    });
    expect(tx.update).not.toHaveBeenCalled();
    expect(mockRecordContentAction).not.toHaveBeenCalled();
  });

  it("slug の重複は errorDuplicate", async () => {
    mockTransaction.mockRejectedValue(DUPLICATE);

    expect(await updateAnnouncement("ann-1", INPUT)).toEqual({
      error: "errorDuplicate",
    });
    expect(mockRevalidateAnnouncementPaths).not.toHaveBeenCalled();
  });

  it("更新前の行を押さえて読み、更新後の行と一緒に監査ログに残す", async () => {
    expect(await updateAnnouncement("ann-1", INPUT)).toEqual({
      success: true,
      id: "ann-1",
    });
    expect(selectChain.for).toHaveBeenCalledWith("update");
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ title: "新しい題", content: "# 新しい本文" }),
    );
    expect(mockRecordContentAction).toHaveBeenCalledWith(tx, {
      actorId: ADMIN_ACTOR_ID,
      action: "update_announcement",
      target: { type: "announcement", key: "ann-1" },
      ipAddress: ADMIN_CLIENT_IP,
      metadata: { before: BEFORE, after: AFTER },
    });
    expect(mockRevalidateAnnouncementPaths).toHaveBeenCalledWith("hello");
  });
});
