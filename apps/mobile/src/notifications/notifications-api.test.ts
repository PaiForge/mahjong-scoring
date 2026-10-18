import { beforeEach, describe, expect, it, vi } from "vitest";

import { callMobileApi, jsonResponse } from "../test/api-client-mock";

// api-client は React Native を読むので置き換える
vi.mock(
  "../auth/api-client",
  async () => await import("../test/api-client-mock"),
);

import { fetchNotifications, markNotificationsRead } from "./notifications-api";

const PAGE = {
  items: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      type: "plan_expired",
      metadata: {},
      createdAt: "2026-10-01T03:00:00.000Z",
    },
  ],
  page: 2,
  totalPages: 2,
  unreadCount: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchNotifications", () => {
  it("指定したページを本人の名義で読み、応答を検証して返す", async () => {
    callMobileApi.mockResolvedValue(jsonResponse(200, PAGE));

    expect(await fetchNotifications("user-a", 2)).toEqual(PAGE);
    expect(callMobileApi).toHaveBeenCalledWith(
      "/api/mobile/v1/notifications?page=2",
      { asUser: "user-a" },
    );
  });

  it("409 は usernameRequired（マイページと同じ理由）", async () => {
    callMobileApi.mockResolvedValue(
      jsonResponse(409, { error: "usernameRequired" }),
    );

    expect(await fetchNotifications("user-a", 1)).toEqual({
      error: "usernameRequired",
    });
  });

  it("応答の形が違えば unknown", async () => {
    callMobileApi.mockResolvedValue(jsonResponse(200, { items: [] }));

    expect(await fetchNotifications("user-a", 1)).toEqual({
      error: "unknown",
    });
  });

  it("送れなかった理由はそのまま返す", async () => {
    callMobileApi.mockResolvedValue("userChanged");

    expect(await fetchNotifications("user-a", 1)).toEqual({
      error: "userChanged",
    });
  });
});

describe("markNotificationsRead", () => {
  it("本文をそのまま本人の名義で送る", async () => {
    callMobileApi.mockResolvedValue(jsonResponse(200, { success: true }));

    expect(await markNotificationsRead("user-a", { all: true })).toEqual({
      success: true,
    });
    expect(callMobileApi).toHaveBeenCalledWith(
      "/api/mobile/v1/notifications/read",
      { method: "POST", body: { all: true }, asUser: "user-a" },
    );
  });

  it("失敗は理由を返す", async () => {
    callMobileApi.mockResolvedValue(
      jsonResponse(429, { error: "rateLimited" }),
    );

    expect(
      await markNotificationsRead("user-a", {
        id: "11111111-1111-4111-8111-111111111111",
      }),
    ).toEqual({ error: "rateLimited" });
  });
});
