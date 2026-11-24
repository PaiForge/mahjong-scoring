import { describe, expect, it } from "vitest";
import type { MobileNotification } from "@mahjong-scoring/features/notifications/mobile-api";

import {
  getUnreadNotifications,
  noteAllNotificationsRead,
  noteNotificationRead,
  publishUnreadNotificationCount,
  publishUnreadNotifications,
  summarizeUnreadNotifications,
} from "./unread-notifications";

function notification(
  id: string,
  type: string,
  read = false,
): MobileNotification {
  return {
    id,
    type,
    metadata: {},
    createdAt: "2026-11-20T03:00:00.000Z",
    ...(read ? { readAt: "2026-11-21T03:00:00.000Z" } : {}),
  };
}

describe("summarizeUnreadNotifications", () => {
  it("未読の付与の通知のうち新しい順で先頭のものを告知に選ぶ", () => {
    const summary = summarizeUnreadNotifications(
      "u1",
      {
        items: [
          notification("n1", "plan_expired"),
          notification("n2", "benefit_granted"),
          notification("n3", "benefit_granted"),
        ],
        unreadCount: 3,
      },
      new Set(),
    );
    expect(summary).toEqual({
      userId: "u1",
      unreadCount: 3,
      unreadGrant: notification("n2", "benefit_granted"),
    });
  });

  it("既読の付与の通知は告知に選ばない", () => {
    const summary = summarizeUnreadNotifications(
      "u1",
      {
        items: [notification("n1", "benefit_granted", true)],
        unreadCount: 0,
      },
      new Set(),
    );
    expect(summary.unreadGrant).toBeUndefined();
    expect(summary.unreadCount).toBe(0);
  });

  it("端末で既読にした通知は応答が未読でも数えず、告知にも選ばない", () => {
    const summary = summarizeUnreadNotifications(
      "u1",
      {
        items: [
          notification("n1", "benefit_granted"),
          notification("n2", "plan_expired"),
        ],
        unreadCount: 2,
      },
      new Set(["n1"]),
    );
    expect(summary.unreadCount).toBe(1);
    expect(summary.unreadGrant).toBeUndefined();
  });
});

describe("未読の通知のストア", () => {
  it("1 件を既読にすると件数が減り、その付与の告知が消える。追い越した読み直しでも戻らない", () => {
    const page = {
      items: [
        notification("g1", "benefit_granted"),
        notification("p1", "plan_expired"),
      ],
      unreadCount: 2,
    };
    publishUnreadNotifications("store-a", page);
    expect(getUnreadNotifications("store-a")?.unreadGrant?.id).toBe("g1");

    noteNotificationRead("store-a", "g1");
    expect(getUnreadNotifications("store-a")).toEqual({
      userId: "store-a",
      unreadCount: 1,
    });

    // 既読化の通信より先に着いた読み直し（まだ未読のまま）
    publishUnreadNotifications("store-a", page);
    expect(getUnreadNotifications("store-a")).toEqual({
      userId: "store-a",
      unreadCount: 1,
    });
  });

  it("別のユーザーの要約は返さない", () => {
    publishUnreadNotificationCount("store-b", 4);
    expect(getUnreadNotifications("store-b")?.unreadCount).toBe(4);
    expect(getUnreadNotifications("store-c")).toBeUndefined();
    expect(getUnreadNotifications(undefined)).toBeUndefined();
  });

  it("件数だけを載せても同じユーザーの付与の告知は残り、0 件なら消える", () => {
    publishUnreadNotifications("store-d", {
      items: [notification("g1", "benefit_granted")],
      unreadCount: 1,
    });
    publishUnreadNotificationCount("store-d", 2);
    expect(getUnreadNotifications("store-d")?.unreadGrant?.id).toBe("g1");
    publishUnreadNotificationCount("store-d", 0);
    expect(getUnreadNotifications("store-d")?.unreadGrant).toBeUndefined();
  });

  it("すべて既読にすると件数も告知も無くなる", () => {
    publishUnreadNotifications("store-e", {
      items: [notification("g1", "benefit_granted")],
      unreadCount: 5,
    });
    noteAllNotificationsRead("store-e");
    expect(getUnreadNotifications("store-e")).toEqual({
      userId: "store-e",
      unreadCount: 0,
    });
  });
});
