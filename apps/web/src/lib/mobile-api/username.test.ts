import { beforeEach, describe, expect, it, vi } from "vitest";

import { MOBILE_USERNAME_ERROR_CODES } from "@mahjong-scoring/features/account/mobile-api";

const { mockAuthorize, mockRegister } = vi.hoisted(() => ({
  mockAuthorize: vi.fn(),
  mockRegister: vi.fn(),
}));

vi.mock("./auth", () => ({ authorizeMobileRequest: mockAuthorize }));
vi.mock("../users/register-username", () => ({
  registerUsernameForUser: mockRegister,
}));

import { handleRegisterUsername } from "./username";

function post(body: string): Request {
  return new Request("https://example.test", { method: "POST", body });
}

function postJson(body: unknown): Request {
  return post(JSON.stringify(body));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthorize.mockResolvedValue({
    ok: true,
    user: { id: "user-1" },
    profile: undefined,
  });
  mockRegister.mockResolvedValue({ success: true });
});

describe("handleRegisterUsername", () => {
  it("トークンの本人の名義でユーザー名を登録する", async () => {
    const response = await handleRegisterUsername(
      postJson({ username: "alice" }),
    );

    expect(mockRegister).toHaveBeenCalledWith("user-1", "alice");
    expect(await response.json()).toEqual({ success: true });
  });

  it("表示名を送られても受け取らない（ユーザー名を流用させる）", async () => {
    const response = await handleRegisterUsername(
      postJson({ username: "alice", displayName: "アリス" }),
    );

    expect(mockRegister).toHaveBeenCalledWith("user-1", "alice");
    expect(await response.json()).toEqual({ success: true });
  });

  it("要求の形が通る本文は、最悪の長さでも本文の上限で弾かない", async () => {
    // 制御文字は JSON で \uXXXX（6 バイト）になり、1 文字あたりが最も長い
    const longest = "\u0001".repeat(200);

    const response = await handleRegisterUsername(
      postJson({ username: longest }),
    );

    expect(mockRegister).toHaveBeenCalledWith("user-1", longest);
    expect(response.status).toBe(200);
  });

  it("JSON でない本文は 400", async () => {
    const response = await handleRegisterUsername(post("{"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalidRequest" });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("要求の形に合わない本文は 400", async () => {
    const response = await handleRegisterUsername(
      postJson({ username: "a".repeat(201) }),
    );

    expect(response.status).toBe(400);
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("上限を超える本文は、形が合っていても 400", async () => {
    // 未知のキーは要求の形では捨てられるので、本文の上限だけが弾く
    const response = await handleRegisterUsername(
      postJson({ username: "alice", padding: "x".repeat(5000) }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalidRequest" });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("認証を通った後に退会が受け付けられていれば 403 deleted", async () => {
    mockRegister.mockResolvedValue({ error: "unauthorized" });

    const response = await handleRegisterUsername(
      postJson({ username: "alice" }),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "deleted" });
  });

  it.each(MOBILE_USERNAME_ERROR_CODES)(
    "登録で弾かれた理由 %s は 422 でそのまま返す",
    async (error) => {
      mockRegister.mockResolvedValue({ error });

      const response = await handleRegisterUsername(
        postJson({ username: "alice" }),
      );

      expect(response.status).toBe(422);
      expect(await response.json()).toEqual({ error });
    },
  );

  it("認証に失敗すれば本文を読まずにその応答を返す", async () => {
    const denied = new Response(null, { status: 401 });
    mockAuthorize.mockResolvedValue({ ok: false, response: denied });

    const response = await handleRegisterUsername(
      postJson({ username: "alice" }),
    );

    expect(response).toBe(denied);
    expect(mockRegister).not.toHaveBeenCalled();
  });
});
