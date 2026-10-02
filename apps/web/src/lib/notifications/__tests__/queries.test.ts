import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSelect, mockUpdate } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", async () => ({
  db: { select: mockSelect, update: mockUpdate },
  notifications: (await import("@/test/schema-mock")).notifications,
}));
vi.mock("drizzle-orm", async () => ({
  ...(await import("@/test/drizzle-orm-mock")),
  count: () => "count(*)",
}));

import { createQueryChain } from "@/test/drizzle-mock";

import {
  countUnreadNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../queries";

const OWN_ROWS = { op: "eq", args: ["user_id", "u1"] };
const UNREAD = { op: "isNull", args: ["read_at"] };
const NOW = new Date("2026-10-02T00:00:00Z");

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("listNotifications", () => {
  it("本人の行を新しい順に引き、metadata を検証して返す", async () => {
    const countChain = createQueryChain([{ count: 21 }]);
    const rowsChain = createQueryChain([
      {
        id: "n1",
        type: "plan_expired",
        metadata: { plan: "pro" },
        readAt: null,
        createdAt: NOW,
      },
      {
        id: "n2",
        type: "purchase_completed",
        metadata: "broken",
        readAt: NOW,
        createdAt: NOW,
      },
    ]);
    mockSelect.mockReturnValueOnce(countChain).mockReturnValueOnce(rowsChain);

    const page = await listNotifications("u1", 2);

    expect(rowsChain.where).toHaveBeenCalledWith({
      op: "and",
      args: [OWN_ROWS],
    });
    expect(rowsChain.limit).toHaveBeenCalledWith(20);
    expect(rowsChain.offset).toHaveBeenCalledWith(20);
    expect(page).toEqual({
      items: [
        {
          id: "n1",
          type: "plan_expired",
          metadata: { plan: "pro" },
          readAt: undefined,
          createdAt: NOW,
        },
        {
          id: "n2",
          type: "purchase_completed",
          metadata: {},
          readAt: NOW,
          createdAt: NOW,
        },
      ],
      totalPages: 2,
      currentPage: 2,
    });
  });

  it("件数を超えるページは最後のページに丸め、その行を取る（空の OFFSET を掴まない）", async () => {
    const rowsChain = createQueryChain([
      {
        id: "n1",
        type: "plan_expired",
        metadata: {},
        readAt: null,
        createdAt: NOW,
      },
    ]);
    mockSelect
      .mockReturnValueOnce(createQueryChain([{ count: 3 }]))
      .mockReturnValueOnce(rowsChain);

    const page = await listNotifications("u1", 9);

    expect(rowsChain.offset).toHaveBeenCalledWith(0);
    expect(page.items).toHaveLength(1);
    expect(page.totalPages).toBe(1);
    expect(page.currentPage).toBe(1);
  });

  it("失敗したら空のページでログを残す", async () => {
    mockSelect.mockImplementation(() => {
      throw new Error("down");
    });
    expect(await listNotifications("u1", 1)).toEqual({
      items: [],
      totalPages: 1,
      currentPage: 1,
    });
    expect(console.error).toHaveBeenCalled();
  });
});

describe("countUnreadNotifications", () => {
  it("本人の未読だけを数える", async () => {
    const chain = createQueryChain([{ count: 4 }]);
    mockSelect.mockReturnValue(chain);

    expect(await countUnreadNotifications("u1")).toBe(4);
    expect(chain.where).toHaveBeenCalledWith({
      op: "and",
      args: [OWN_ROWS, UNREAD],
    });
  });

  it("失敗したら 0", async () => {
    mockSelect.mockImplementation(() => {
      throw new Error("down");
    });
    expect(await countUnreadNotifications("u1")).toBe(0);
  });
});

describe("markNotificationRead", () => {
  it("本人の・その id の・未読の行だけを既読にする", async () => {
    const chain = createQueryChain([]);
    mockUpdate.mockReturnValue(chain);

    await markNotificationRead("u1", "n1", NOW);

    expect(chain.set).toHaveBeenCalledWith({ readAt: NOW });
    expect(chain.where).toHaveBeenCalledWith({
      op: "and",
      args: [OWN_ROWS, { op: "eq", args: ["id", "n1"] }, UNREAD],
    });
  });
});

describe("markAllNotificationsRead", () => {
  it("本人の未読をすべて既読にする", async () => {
    const chain = createQueryChain([]);
    mockUpdate.mockReturnValue(chain);

    await markAllNotificationsRead("u1", NOW);

    expect(chain.set).toHaveBeenCalledWith({ readAt: NOW });
    expect(chain.where).toHaveBeenCalledWith({
      op: "and",
      args: [OWN_ROWS, UNREAD],
    });
  });
});
