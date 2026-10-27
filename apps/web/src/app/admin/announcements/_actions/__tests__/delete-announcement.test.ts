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
 * お知らせ削除のテスト
 *
 * @description
 * 物理削除で本文は他に残らない。消した行を RETURNING で受け取り、
 * 行ごと監査ログに残すことを固定する。
 */

const { mockRevalidateAnnouncementPaths } = vi.hoisted(() => ({
  mockRevalidateAnnouncementPaths: vi.fn(),
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
vi.mock("../../_lib/announcement-row", () => ({
  revalidateAnnouncementPaths: mockRevalidateAnnouncementPaths,
}));

import { deleteAnnouncement } from "../delete-announcement";

const ROW = {
  id: "ann-1",
  slug: "hello",
  title: "題",
  content: "# 本文",
  locale: "ja",
  status: "published",
};

let deleteChain: QueryChainMock;
let tx: { delete: Mock };

beforeEach(() => {
  vi.clearAllMocks();
  deleteChain = createQueryChain([ROW]);
  tx = { delete: vi.fn(() => deleteChain) };
  setupAdminActor(tx);
});

describe("deleteAnnouncement", () => {
  it("管理者でなければ errorDeleteFailed で DB に触らない", async () => {
    setupNotAdmin();

    expect(await deleteAnnouncement("ann-1")).toEqual({
      error: "errorDeleteFailed",
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("行が無ければ errorNotFound で記録も再検証もしない", async () => {
    deleteChain = createQueryChain([]);

    expect(await deleteAnnouncement("missing")).toEqual({
      error: "errorNotFound",
    });
    expect(mockRecordContentAction).not.toHaveBeenCalled();
    expect(mockRevalidateAnnouncementPaths).not.toHaveBeenCalled();
  });

  it("消した行を RETURNING で受け取り、行ごと監査ログに残してから再検証する", async () => {
    expect(await deleteAnnouncement("ann-1")).toEqual({ success: true });
    expect(deleteChain.returning).toHaveBeenCalledTimes(1);
    expect(mockRecordContentAction).toHaveBeenCalledWith(tx, {
      actorId: ADMIN_ACTOR_ID,
      action: "delete_announcement",
      target: { type: "announcement", key: "ann-1" },
      ipAddress: ADMIN_CLIENT_IP,
      metadata: { before: ROW },
    });
    expect(mockRevalidateAnnouncementPaths).toHaveBeenCalledWith("hello");
  });
});
