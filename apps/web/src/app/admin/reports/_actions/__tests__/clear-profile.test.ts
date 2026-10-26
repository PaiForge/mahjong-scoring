import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockRecordModerationAction,
  mockTransaction,
  setupAdminActor,
  setupNotAdmin,
} from "@/test/admin-action-mocks";
import { createQueryChain } from "@/test/drizzle-mock";

/**
 * 通報への対応「プロフィールを消して解決」のテスト
 *
 * @description
 * avatars は公開バケットで、公開 URL は RLS を通らずに読める。参照を切って
 * 通報を閉じた後で Storage の削除に失敗すると、不適切な画像が公開されたまま
 * 「対応済み」になる。Storage を先に消し、失敗したら DB に触れず通報を
 * 未対応のまま残す（やり直せる）ことを固定する。
 */

const { mockDeleteAvatarObject, mockSelect } = vi.hoisted(() => ({
  mockDeleteAvatarObject: vi.fn(),
  mockSelect: vi.fn(),
}));

vi.mock("next/cache", async () => await import("@/test/admin-action-mocks"));
vi.mock(
  "@/lib/client-ip",
  async () => await import("@/test/admin-action-mocks"),
);
vi.mock("@/lib/db", async () => ({
  db: {
    select: mockSelect,
    transaction: (await import("@/test/admin-action-mocks")).mockTransaction,
  },
  profiles: { id: "profiles.id" },
  reports: {
    id: "reports.id",
    status: "reports.status",
    targetUserId: "reports.target_user_id",
  },
}));
vi.mock("drizzle-orm", async () => await import("@/test/drizzle-orm-mock"));
vi.mock(
  "../../../_lib/auth",
  async () => await import("@/test/admin-action-mocks"),
);
vi.mock("../../../users/_lib/moderation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../users/_lib/moderation")>()),
  recordModerationAction: (await import("@/test/admin-action-mocks"))
    .mockRecordModerationAction,
}));
vi.mock("../../../users/_actions/ban-user", () => ({ banUser: vi.fn() }));
vi.mock("../../../users/_lib/revalidate", () => ({
  revalidateAdminUsers: vi.fn(),
}));
vi.mock("@/lib/users/avatar", () => ({
  deleteAvatarObject: mockDeleteAvatarObject,
}));

import { clearProfileAndResolveReportAction } from "../report-actions";

const TARGET_ID = "target-1";

/** 呼ばれた順（Storage と DB のどちらが先か） */
let order: string[];

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  order = [];
  const tx = {
    update: vi.fn(() => {
      order.push("db");
      return createQueryChain([]);
    }),
  };
  setupAdminActor(tx);
  mockSelect.mockReturnValue(
    createQueryChain([{ id: "report-1", targetUserId: TARGET_ID }]),
  );
  mockDeleteAvatarObject.mockImplementation(async () => {
    order.push("storage");
  });
});

describe("clearProfileAndResolveReportAction", () => {
  it("管理者でなければ Storage にも DB にも触らない", async () => {
    setupNotAdmin();

    expect(
      await clearProfileAndResolveReportAction("report-1", "理由"),
    ).toEqual({ error: "unauthorized" });
    expect(mockDeleteAvatarObject).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("未対応の通報が無ければ notFound で Storage に触らない", async () => {
    mockSelect.mockReturnValue(createQueryChain([]));

    expect(await clearProfileAndResolveReportAction("missing", "理由")).toEqual(
      { error: "notFound" },
    );
    expect(mockDeleteAvatarObject).not.toHaveBeenCalled();
  });

  it("通報の対象者の画像を消してから参照を切り、通報を閉じる", async () => {
    expect(
      await clearProfileAndResolveReportAction("report-1", "理由"),
    ).toEqual({ success: true });
    expect(mockDeleteAvatarObject).toHaveBeenCalledWith(TARGET_ID);
    expect(order[0]).toBe("storage");
    expect(order.slice(1).every((step) => step === "db")).toBe(true);
    expect(mockRecordModerationAction).toHaveBeenCalled();
  });

  it("Storage の削除に失敗したら failed を返し、DB に触らない（通報は未対応のまま）", async () => {
    mockDeleteAvatarObject.mockRejectedValue(new Error("storage remove"));

    expect(
      await clearProfileAndResolveReportAction("report-1", "理由"),
    ).toEqual({ error: "failed" });
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockRecordModerationAction).not.toHaveBeenCalled();
  });
});
