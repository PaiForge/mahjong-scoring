import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetUser, mockCreateClient, mockGetProfileCore, mockGetClientIp } =
  vi.hoisted(() => {
    const getUser = vi.fn();
    return {
      mockGetUser: getUser,
      mockCreateClient: vi.fn(() => ({ auth: { getUser } })),
      mockGetProfileCore: vi.fn(),
      mockGetClientIp: vi.fn(),
    };
  });

vi.mock("server-only", () => ({}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
  isAuthRetryableFetchError: (error: unknown) =>
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AuthRetryableFetchError",
}));

vi.mock("../supabase/env", () => ({
  getSupabasePublicEnv: () => ({
    url: "https://supabase.test",
    publishableKey: "publishable",
  }),
}));

vi.mock("../client-ip", () => ({
  getClientIp: mockGetClientIp,
}));

vi.mock("../db/queries", () => ({
  getProfileCoreByUserId: mockGetProfileCore,
}));

import { _resetStore } from "../rate-limit-ip";

import { authorizeMobileRequest, readBearerToken } from "./auth";

const LIMIT = { maxRequests: 2, windowMs: 60_000 };

function requestWith(headers: Record<string, string> = {}): Request {
  return new Request("https://example.test/api/mobile/v1/me", { headers });
}

const withToken = () => requestWith({ authorization: "Bearer token-1" });

/** トークンが有効で、ユーザー名を決めた普通のユーザーにする */
function activeUser() {
  mockGetUser.mockResolvedValue({
    data: { user: { id: "user-1", app_metadata: { provider: "apple" } } },
  });
  mockGetProfileCore.mockResolvedValue({
    username: "alice",
    bannedAt: null,
    deletedAt: null,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  _resetStore();
  mockGetClientIp.mockResolvedValue("127.0.0.1");
});

describe("readBearerToken", () => {
  it("Bearer スキームのトークンを取り出す（スキーム名の大小は問わない）", () => {
    expect(readBearerToken(requestWith({ authorization: "Bearer abc" }))).toBe(
      "abc",
    );
    expect(readBearerToken(requestWith({ authorization: "bearer abc" }))).toBe(
      "abc",
    );
  });

  it("ヘッダが無い・別スキーム・空なら undefined", () => {
    expect(readBearerToken(requestWith())).toBeUndefined();
    expect(
      readBearerToken(requestWith({ authorization: "Basic abc" })),
    ).toBeUndefined();
    expect(
      readBearerToken(requestWith({ authorization: "Bearer " })),
    ).toBeUndefined();
  });
});

describe("authorizeMobileRequest", () => {
  it("有効なトークンならユーザーとプロフィールを返す", async () => {
    activeUser();

    const result = await authorizeMobileRequest(
      withToken(),
      "readMobileAccount",
    );

    expect(result).toMatchObject({
      ok: true,
      user: { id: "user-1", provider: "apple" },
      profile: { username: "alice" },
    });
    expect(mockGetUser).toHaveBeenCalledWith("token-1");
  });

  it("プロフィール未作成は弾かず、profile を undefined で返す", async () => {
    activeUser();
    mockGetProfileCore.mockResolvedValue(undefined);

    const result = await authorizeMobileRequest(
      withToken(),
      "readMobileAccount",
    );

    expect(result.ok).toBe(true);
    expect(result.ok && result.profile).toBeUndefined();
  });

  /**
   * cookie にフォールバックしないことが、Origin 検証を省ける前提
   * （`authorizeMobileRequest` の TSDoc）。cookie だけのリクエストは未認証。
   */
  it("トークンが無ければ cookie があっても 401 で、認証サーバーに問い合わせない", async () => {
    activeUser();

    const result = await authorizeMobileRequest(
      requestWith({ cookie: "sb-access-token=token-1" }),
      "readMobileAccount",
    );

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.response.status).toBe(401);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("失効したトークンは 401", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { name: "AuthSessionMissingError", status: 400 },
    });

    const result = await authorizeMobileRequest(
      withToken(),
      "readMobileAccount",
    );

    expect(result.ok === false && result.response.status).toBe(401);
    await expect(
      result.ok === false ? result.response.json() : undefined,
    ).resolves.toEqual({ error: "unauthorized" });
  });

  /**
   * 認証サーバーに届かない・混んでいるときは、トークンが無効だという
   * 答えではない。401 にするとアプリが有効なログインを捨てる。
   */
  it.each([
    ["届かない", { name: "AuthRetryableFetchError", status: 0 }],
    ["回数制限", { name: "AuthApiError", status: 429 }],
    ["障害", { name: "AuthApiError", status: 502 }],
  ])("認証サーバーが%sときは 503 で authUnavailable", async (_, error) => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error });

    const result = await authorizeMobileRequest(
      withToken(),
      "readMobileAccount",
    );

    expect(result.ok === false && result.response.status).toBe(503);
    await expect(
      result.ok === false ? result.response.json() : undefined,
    ).resolves.toEqual({ error: "authUnavailable" });
  });

  it("認証サーバーが無効と答えたトークンは 401", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { name: "AuthApiError", status: 403, code: "bad_jwt" },
    });

    const result = await authorizeMobileRequest(
      withToken(),
      "readMobileAccount",
    );

    expect(result.ok === false && result.response.status).toBe(401);
  });

  it("BAN 済みは 403", async () => {
    activeUser();
    mockGetProfileCore.mockResolvedValue({
      username: "alice",
      bannedAt: new Date(),
      deletedAt: null,
    });

    const result = await authorizeMobileRequest(
      withToken(),
      "readMobileAccount",
    );

    expect(result.ok === false && result.response.status).toBe(403);
    await expect(
      result.ok === false ? result.response.json() : undefined,
    ).resolves.toEqual({ error: "banned" });
  });

  /**
   * 退会の途中で Auth の削除だけが失敗すると、トークンは有効なまま
   * DB は消えている。その状態で書き込ませない。
   */
  it("退会済みは 401 で deleted を返す", async () => {
    activeUser();
    mockGetProfileCore.mockResolvedValue({
      username: "alice",
      bannedAt: null,
      deletedAt: new Date(),
    });

    const result = await authorizeMobileRequest(
      withToken(),
      "readMobileAccount",
    );

    expect(result.ok === false && result.response.status).toBe(401);
    await expect(
      result.ok === false ? result.response.json() : undefined,
    ).resolves.toEqual({ error: "deleted" });
  });

  it("退会のやり直しでは退会済みを通す", async () => {
    activeUser();
    mockGetProfileCore.mockResolvedValue({
      username: "alice",
      bannedAt: null,
      deletedAt: new Date(),
    });

    const result = await authorizeMobileRequest(withToken(), "deleteAccount", {
      allowDeleted: true,
    });

    expect(result.ok).toBe(true);
  });

  it("応答は共有キャッシュに乗せず、Expo の web 版が読める CORS ヘッダを付ける", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { name: "AuthApiError", status: 403 },
    });

    const result = await authorizeMobileRequest(
      withToken(),
      "readMobileAccount",
    );

    const headers = result.ok === false ? result.response.headers : undefined;
    expect(headers?.get("Cache-Control")).toBe("private, no-store");
    expect(headers?.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("IP の枠を超えたら 429 で、認証サーバーに問い合わせない", async () => {
    activeUser();
    await authorizeMobileRequest(withToken(), "readMobileAccount", {
      config: LIMIT,
    });
    await authorizeMobileRequest(withToken(), "readMobileAccount", {
      config: LIMIT,
    });
    mockGetUser.mockClear();

    const result = await authorizeMobileRequest(
      withToken(),
      "readMobileAccount",
      { config: LIMIT },
    );

    expect(result.ok === false && result.response.status).toBe(429);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("ユーザーの枠は IP の枠と別に数える", async () => {
    activeUser();
    // 回線を変えながら同じアカウントで叩く。IP の枠には掛からない
    mockGetClientIp
      .mockResolvedValueOnce("10.0.0.1")
      .mockResolvedValueOnce("10.0.0.2")
      .mockResolvedValueOnce("10.0.0.3");

    await authorizeMobileRequest(withToken(), "readMobileAccount", {
      config: LIMIT,
    });
    await authorizeMobileRequest(withToken(), "readMobileAccount", {
      config: LIMIT,
    });
    const result = await authorizeMobileRequest(
      withToken(),
      "readMobileAccount",
      { config: LIMIT },
    );

    expect(result.ok === false && result.response.status).toBe(429);
  });
});
