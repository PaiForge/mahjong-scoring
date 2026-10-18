import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  authorizeAs,
  mockAuthorizeMobileRequest,
} from "@/test/mobile-auth-mock";

const { mockGetProfileCard } = vi.hoisted(() => ({
  mockGetProfileCard: vi.fn(),
}));

vi.mock("./auth", async () => await import("@/test/mobile-auth-mock"));
vi.mock("../db/queries", () => ({
  getProfileCardByUserId: mockGetProfileCard,
}));
vi.mock("../log-error", async () => await import("@/test/log-error-mock"));

import { logExternalError } from "../log-error";
import { handleReadAccount } from "./me";

function get(): Request {
  return new Request("https://example.test");
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleReadAccount", () => {
  it("ユーザー名を決めた本人にはプロフィールを付けて返す", async () => {
    authorizeAs({ userId: "user-1", username: "alice" });
    mockGetProfileCard.mockResolvedValue({
      username: "alice",
      displayName: null,
      avatarUrl: "https://example.test/a.webp",
    });

    const response = await handleReadAccount(get());

    expect(await response.json()).toEqual({
      userId: "user-1",
      profile: { username: "alice", avatarUrl: "https://example.test/a.webp" },
    });
  });

  it("アバターが無ければ avatarUrl を付けない", async () => {
    authorizeAs({ userId: "user-1", username: "alice" });
    mockGetProfileCard.mockResolvedValue({
      username: "alice",
      displayName: null,
      avatarUrl: null,
    });

    const response = await handleReadAccount(get());

    expect(await response.json()).toEqual({
      userId: "user-1",
      profile: { username: "alice" },
    });
  });

  it("アバターを読めなくても失敗にせず、avatarUrl を付けずに返す", async () => {
    authorizeAs({ userId: "user-1", username: "alice" });
    mockGetProfileCard.mockRejectedValue(new Error("db down"));

    const response = await handleReadAccount(get());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      userId: "user-1",
      profile: { username: "alice" },
    });
    expect(logExternalError).toHaveBeenCalled();
  });

  it("ユーザー名を決める前はプロフィールを null で返す", async () => {
    authorizeAs({ userId: "user-1" });

    const response = await handleReadAccount(get());

    expect(await response.json()).toEqual({ userId: "user-1", profile: null });
    expect(mockGetProfileCard).not.toHaveBeenCalled();
  });

  it("認証に失敗すればその応答を返す", async () => {
    const denied = new Response(null, { status: 401 });
    mockAuthorizeMobileRequest.mockResolvedValue({
      ok: false,
      response: denied,
    });

    const response = await handleReadAccount(get());

    expect(response).toBe(denied);
  });
});
