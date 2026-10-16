import { beforeEach, describe, expect, it, vi } from "vitest";
import { isMobileApiErrorCode } from "@mahjong-scoring/features/account/mobile-api";

const mocks = vi.hoisted(() => ({ callMobileApi: vi.fn() }));

// api-client は React Native を読むので、使う関数だけを置き換える
vi.mock("../auth/api-client", () => {
  const errorOf = async (response: Response): Promise<unknown> => {
    const body: unknown = await response.json().catch(() => undefined);
    return typeof body === "object" && body !== null && "error" in body
      ? body.error
      : undefined;
  };
  return {
    callMobileApi: mocks.callMobileApi,
    errorOf,
    apiFailureOf: async (response: Response) => {
      const error = await errorOf(response);
      return isMobileApiErrorCode(error) ? error : "unknown";
    },
  };
});

import { fetchNotifications, markNotificationsRead } from "./notifications-api";

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

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
    mocks.callMobileApi.mockResolvedValue(json(200, PAGE));

    expect(await fetchNotifications("user-a", 2)).toEqual(PAGE);
    expect(mocks.callMobileApi).toHaveBeenCalledWith(
      "/api/mobile/v1/notifications?page=2",
      { asUser: "user-a" },
    );
  });

  it("409 は usernameRequired（マイページと同じ理由）", async () => {
    mocks.callMobileApi.mockResolvedValue(
      json(409, { error: "usernameRequired" }),
    );

    expect(await fetchNotifications("user-a", 1)).toEqual({
      error: "usernameRequired",
    });
  });

  it("応答の形が違えば unknown", async () => {
    mocks.callMobileApi.mockResolvedValue(json(200, { items: [] }));

    expect(await fetchNotifications("user-a", 1)).toEqual({
      error: "unknown",
    });
  });

  it("送れなかった理由はそのまま返す", async () => {
    mocks.callMobileApi.mockResolvedValue("userChanged");

    expect(await fetchNotifications("user-a", 1)).toEqual({
      error: "userChanged",
    });
  });
});

describe("markNotificationsRead", () => {
  it("本文をそのまま本人の名義で送る", async () => {
    mocks.callMobileApi.mockResolvedValue(json(200, { success: true }));

    expect(await markNotificationsRead("user-a", { all: true })).toEqual({
      success: true,
    });
    expect(mocks.callMobileApi).toHaveBeenCalledWith(
      "/api/mobile/v1/notifications/read",
      { method: "POST", body: { all: true }, asUser: "user-a" },
    );
  });

  it("失敗は理由を返す", async () => {
    mocks.callMobileApi.mockResolvedValue(json(429, { error: "rateLimited" }));

    expect(
      await markNotificationsRead("user-a", {
        id: "11111111-1111-4111-8111-111111111111",
      }),
    ).toEqual({ error: "rateLimited" });
  });
});
