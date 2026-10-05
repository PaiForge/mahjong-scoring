import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockInsert } = vi.hoisted(() => ({ mockInsert: vi.fn() }));

vi.mock("@/lib/db", async () => ({
  db: { insert: mockInsert },
  notifications: (await import("@/test/schema-mock")).notifications,
}));

import { createQueryChain } from "@/test/drizzle-mock";

import {
  insertNotification,
  insertNotifications,
  notifyQuietly,
} from "../create-notification";
import { NotificationTargetType, NotificationType } from "../types";

const INPUT = {
  userId: "u1",
  type: NotificationType.PurchaseCompleted,
  target: { type: NotificationTargetType.Purchase, id: "p1" },
  metadata: { plan: "pro", kind: "pass" as const },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("insertNotification", () => {
  it("対象の表と id を列に展開し、同じ事実は ON CONFLICT DO NOTHING で飛ばす", async () => {
    const chain = createQueryChain();
    chain.returning.mockResolvedValue([{ id: "n1" }]);
    mockInsert.mockReturnValue(chain);

    const db = { insert: mockInsert };
    // テストコードでの型アサーションは規約上許容されている
    const inserted = await insertNotification(
      db as unknown as Parameters<typeof insertNotification>[0],
      INPUT,
    );

    expect(inserted).toBe(true);
    expect(chain.values).toHaveBeenCalledWith([
      {
        userId: "u1",
        type: "purchase_completed",
        targetType: "purchase",
        targetId: "p1",
        metadata: { plan: "pro", kind: "pass" },
      },
    ]);
    expect(chain.onConflictDoNothing).toHaveBeenCalledWith({
      target: ["user_id", "type", "target_type", "target_id"],
    });
  });

  it("単件も複数件と同じ INSERT を通る（抑止条件の差し込み口が 1 つ）", async () => {
    const chain = createQueryChain();
    chain.returning.mockResolvedValue([{ id: "n1" }]);
    mockInsert.mockReturnValue(chain);

    const db = { insert: mockInsert };
    await insertNotification(
      db as unknown as Parameters<typeof insertNotification>[0],
      INPUT,
    );
    // 複数件版は配列で values() を呼ぶ。単件もその形で通っている
    expect(chain.values).toHaveBeenCalledWith([
      expect.objectContaining({ userId: "u1", targetId: "p1" }),
    ]);
  });

  it("既にあって何も入らなければ false", async () => {
    const chain = createQueryChain();
    chain.returning.mockResolvedValue([]);
    mockInsert.mockReturnValue(chain);

    const db = { insert: mockInsert };
    expect(
      await insertNotification(
        db as unknown as Parameters<typeof insertNotification>[0],
        INPUT,
      ),
    ).toBe(false);
  });
});

describe("insertNotifications", () => {
  it("空なら DB に行かない", async () => {
    const db = { insert: mockInsert };
    expect(
      await insertNotifications(
        db as unknown as Parameters<typeof insertNotifications>[0],
        [],
      ),
    ).toBe(0);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("新しく入った件数を返す", async () => {
    const chain = createQueryChain();
    chain.returning.mockResolvedValue([{ id: "n1" }, { id: "n2" }]);
    mockInsert.mockReturnValue(chain);

    const db = { insert: mockInsert };
    expect(
      await insertNotifications(
        db as unknown as Parameters<typeof insertNotifications>[0],
        [INPUT, { ...INPUT, target: { ...INPUT.target, id: "p2" } }],
      ),
    ).toBe(2);
  });
});

describe("notifyQuietly", () => {
  it("INSERT が失敗しても投げず、ログに残す", async () => {
    const chain = createQueryChain();
    chain.returning.mockRejectedValue(new Error("db down"));
    mockInsert.mockReturnValue(chain);

    await expect(notifyQuietly(INPUT)).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[notifyQuietly]"),
      "db down",
    );
  });
});
