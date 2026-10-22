import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  authorizeAs,
  mockAuthorizeMobileRequest,
} from "@/test/mobile-auth-mock";

const { mockList, mockCountUnread, mockMarkOne, mockMarkAll } = vi.hoisted(
  () => ({
    mockList: vi.fn(),
    mockCountUnread: vi.fn(),
    mockMarkOne: vi.fn(),
    mockMarkAll: vi.fn(),
  }),
);

vi.mock("./auth", async () => await import("@/test/mobile-auth-mock"));
vi.mock("../notifications/queries", () => ({
  listNotifications: mockList,
  countUnreadNotifications: mockCountUnread,
  markNotificationRead: mockMarkOne,
  markAllNotificationsRead: mockMarkAll,
}));
vi.mock("../log-error", async () => await import("@/test/log-error-mock"));

import {
  handleMarkNotificationsRead,
  handleReadNotifications,
} from "./notifications";
import { postJsonRequest } from "@/test/request";

const URL_BASE = "https://example.test/api/mobile/v1/notifications";
const NOTIFICATION_ID = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
  authorizeAs({ userId: "me", username: "me" });
  mockList.mockResolvedValue({ items: [], totalPages: 1, currentPage: 1 });
  mockCountUnread.mockResolvedValue(0);
  mockMarkOne.mockResolvedValue(undefined);
  mockMarkAll.mockResolvedValue(undefined);
});

/** ユーザー名を決める前の認証の結果 */
function withoutUsername() {
  authorizeAs({ userId: "me" });
}

function postRead(body: unknown) {
  return postJsonRequest(`${URL_BASE}/read`, body, {
    "Content-Type": "application/json",
  });
}

describe("handleReadNotifications", () => {
  it("本人の通知の 1 ページを日時を ISO 8601 にして、未読数と一緒に返す", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: NOTIFICATION_ID,
          type: "purchase_completed",
          metadata: {
            plan: "pro",
            kind: "pass",
            expiresAt: "2026-10-31T03:00:00.000Z",
          },
          readAt: undefined,
          createdAt: new Date("2026-10-01T03:00:00.000Z"),
        },
        {
          id: "22222222-2222-4222-8222-222222222222",
          type: "plan_expired",
          metadata: {},
          readAt: new Date("2026-10-02T03:00:00.000Z"),
          createdAt: new Date("2026-09-01T03:00:00.000Z"),
        },
      ],
      totalPages: 3,
      currentPage: 2,
    });
    mockCountUnread.mockResolvedValue(4);

    const response = await handleReadNotifications(
      new Request(`${URL_BASE}?page=2`),
    );

    expect(mockList).toHaveBeenCalledWith("me", 2);
    expect(mockCountUnread).toHaveBeenCalledWith("me");
    expect(await response.json()).toEqual({
      items: [
        {
          id: NOTIFICATION_ID,
          type: "purchase_completed",
          // 文面に使わないプランの名前は載せない
          metadata: { kind: "pass", expiresAt: "2026-10-31T03:00:00.000Z" },
          createdAt: "2026-10-01T03:00:00.000Z",
        },
        {
          id: "22222222-2222-4222-8222-222222222222",
          type: "plan_expired",
          metadata: {},
          readAt: "2026-10-02T03:00:00.000Z",
          createdAt: "2026-09-01T03:00:00.000Z",
        },
      ],
      page: 2,
      totalPages: 3,
      unreadCount: 4,
    });
  });

  it("ページの指定が無い・不正なら 1 ページ目", async () => {
    await handleReadNotifications(new Request(`${URL_BASE}?page=abc`));

    expect(mockList).toHaveBeenCalledWith("me", 1);
  });

  it("ユーザー名を決める前は読まずに 409 usernameRequired", async () => {
    withoutUsername();

    const response = await handleReadNotifications(new Request(URL_BASE));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "usernameRequired" });
    expect(mockList).not.toHaveBeenCalled();
  });

  it("認証を通らなければ読まずにその応答を返す", async () => {
    mockAuthorizeMobileRequest.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "unauthorized" }, { status: 401 }),
    });

    const response = await handleReadNotifications(new Request(URL_BASE));

    expect(response.status).toBe(401);
    expect(mockList).not.toHaveBeenCalled();
  });

  it("一覧と未読数の回数制限の枠はアプリの読み取り用", async () => {
    await handleReadNotifications(new Request(URL_BASE));

    expect(mockAuthorizeMobileRequest).toHaveBeenCalledWith(
      expect.any(Request),
      "readMobileNotifications",
    );
  });
});

describe("handleMarkNotificationsRead", () => {
  it("id を送ると本人のその 1 件を既読にする", async () => {
    const response = await handleMarkNotificationsRead(
      postRead({ id: NOTIFICATION_ID }),
    );

    expect(mockMarkOne).toHaveBeenCalledWith("me", NOTIFICATION_ID);
    expect(mockMarkAll).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({ success: true });
  });

  it("all を送ると本人の未読をすべて既読にする", async () => {
    const response = await handleMarkNotificationsRead(postRead({ all: true }));

    expect(mockMarkAll).toHaveBeenCalledWith("me");
    expect(mockMarkOne).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({ success: true });
  });

  it("回数制限の枠は web の既読化と共有する", async () => {
    await handleMarkNotificationsRead(postRead({ all: true }));

    expect(mockAuthorizeMobileRequest).toHaveBeenCalledWith(
      expect.any(Request),
      "markNotificationsRead",
    );
  });

  it.each([
    ["UUID でない id", { id: "not-a-uuid" }],
    ["all が true でない", { all: false }],
    ["空の本文", {}],
  ])("%s は既読にせずに 400", async (_, body) => {
    const response = await handleMarkNotificationsRead(postRead(body));

    expect(response.status).toBe(400);
    expect(mockMarkOne).not.toHaveBeenCalled();
    expect(mockMarkAll).not.toHaveBeenCalled();
  });

  it("ユーザー名を決める前は既読にせずに 409 usernameRequired", async () => {
    withoutUsername();

    const response = await handleMarkNotificationsRead(postRead({ all: true }));

    expect(response.status).toBe(409);
    expect(mockMarkAll).not.toHaveBeenCalled();
  });

  it("既読化に失敗したら 500 serverError", async () => {
    mockMarkOne.mockRejectedValue(new Error("db down"));

    const response = await handleMarkNotificationsRead(
      postRead({ id: NOTIFICATION_ID }),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "serverError" });
  });
});
