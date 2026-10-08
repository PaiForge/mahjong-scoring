import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuthorize } = vi.hoisted(() => ({ mockAuthorize: vi.fn() }));

vi.mock("./auth", () => ({ authorizeMobileRequest: mockAuthorize }));

import { handleReadAccount } from "./me";

function get(): Request {
  return new Request("https://example.test");
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleReadAccount", () => {
  it("ユーザー名を決めた本人にはプロフィールを付けて返す", async () => {
    mockAuthorize.mockResolvedValue({
      ok: true,
      user: { id: "user-1" },
      profile: { username: "alice" },
    });

    const response = await handleReadAccount(get());

    expect(await response.json()).toEqual({
      userId: "user-1",
      profile: { username: "alice" },
    });
  });

  it("ユーザー名を決める前はプロフィールを null で返す", async () => {
    mockAuthorize.mockResolvedValue({
      ok: true,
      user: { id: "user-1" },
      profile: undefined,
    });

    const response = await handleReadAccount(get());

    expect(await response.json()).toEqual({ userId: "user-1", profile: null });
  });

  it("認証に失敗すればその応答を返す", async () => {
    const denied = new Response(null, { status: 401 });
    mockAuthorize.mockResolvedValue({ ok: false, response: denied });

    const response = await handleReadAccount(get());

    expect(response).toBe(denied);
  });
});
