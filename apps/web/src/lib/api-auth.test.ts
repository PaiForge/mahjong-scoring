import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCheckIpRateLimitGuard, mockGetUser, mockGetAccountStanding } =
  vi.hoisted(() => ({
    mockCheckIpRateLimitGuard: vi.fn(),
    mockGetUser: vi.fn(),
    mockGetAccountStanding: vi.fn(),
  }));

vi.mock("./client-ip", () => ({
  getClientIp: () => Promise.resolve("127.0.0.1"),
}));

vi.mock("./rate-limit-ip", () => ({
  IP_RATE_LIMITS: { uploadAvatar: { limit: 1, windowMs: 1 } },
  checkIpRateLimitGuard: mockCheckIpRateLimitGuard,
}));

vi.mock("./supabase/server", () => ({
  createClient: () => Promise.resolve({ auth: { getUser: mockGetUser } }),
}));

vi.mock("./ban", () => ({
  getAccountStanding: mockGetAccountStanding,
}));

import { authorizeApiRequest } from "./api-auth";

/** 同一オリジンからの POST（ブラウザは非単純メソッドで必ず Origin を送る） */
function sameOriginRequest(): Request {
  return new Request("https://example.test/api/profile/avatar", {
    method: "POST",
    headers: { origin: "https://example.test", host: "example.test" },
  });
}

/** レートリミットも認証も通過し、BAN もされていない状態にする */
function authorized() {
  mockCheckIpRateLimitGuard.mockReturnValue(undefined);
  mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  mockGetAccountStanding.mockResolvedValue("active");
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("authorizeApiRequest", () => {
  it("認証済みで BAN されていなければ user を返す", async () => {
    authorized();

    const result = await authorizeApiRequest(
      sameOriginRequest(),
      "uploadAvatar",
    );

    expect(result.ok).toBe(true);
    expect(result.ok && result.user.id).toBe("user-1");
  });

  it("レートリミット超過は 429 で、認証も BAN も見に行かない", async () => {
    mockCheckIpRateLimitGuard.mockReturnValue({ error: "rateLimited" });

    const result = await authorizeApiRequest(
      sameOriginRequest(),
      "uploadAvatar",
    );

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.response.status).toBe(429);
    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockGetAccountStanding).not.toHaveBeenCalled();
  });

  it("未認証は 401 で、BAN を見に行かない", async () => {
    mockCheckIpRateLimitGuard.mockReturnValue(undefined);
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await authorizeApiRequest(
      sameOriginRequest(),
      "uploadAvatar",
    );

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.response.status).toBe(401);
    expect(mockGetAccountStanding).not.toHaveBeenCalled();
  });

  it("拒否の応答も共有キャッシュに乗せない（private, no-store）", async () => {
    mockCheckIpRateLimitGuard.mockReturnValue(undefined);
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await authorizeApiRequest(
      sameOriginRequest(),
      "uploadAvatar",
    );

    expect(
      result.ok === false && result.response.headers.get("Cache-Control"),
    ).toBe("private, no-store");
  });

  /**
   * ページガードは画面遷移しか守らないため、Route Handler を直接叩かれると
   * BAN が効かない。ここで弾いていることを固定する。
   */
  it("BAN 済みユーザーは 403 で banned を返す", async () => {
    authorized();
    mockGetAccountStanding.mockResolvedValue("banned");

    const result = await authorizeApiRequest(
      sameOriginRequest(),
      "uploadAvatar",
    );

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.response.status).toBe(403);
    await expect(
      result.ok === false ? result.response.json() : undefined,
    ).resolves.toEqual({ error: "banned" });
  });

  /**
   * 退会の途中で Auth の削除だけが失敗すると、ログインは生きたまま DB は
   * 消えている。その状態の書き込みで消したデータを蘇らせない。
   */
  it("退会済みユーザーは未認証として 401 を返す", async () => {
    authorized();
    mockGetAccountStanding.mockResolvedValue("deleted");

    const result = await authorizeApiRequest(
      sameOriginRequest(),
      "uploadAvatar",
    );

    expect(result.ok === false && result.response.status).toBe(401);
  });

  /**
   * Server Action と違い Route Handler には CSRF 防御が無い。他サイトの
   * フォームから認証 cookie 込みで叩かれる経路をここで塞いでいることを固定する。
   */
  it("別オリジンからのリクエストは 403 で、レートリミットも認証も見に行かない", async () => {
    authorized();

    const result = await authorizeApiRequest(
      new Request("https://example.test/api/profile/avatar", {
        method: "POST",
        headers: { origin: "https://evil.test", host: "example.test" },
      }),
      "uploadAvatar",
    );

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.response.status).toBe(403);
    await expect(
      result.ok === false ? result.response.json() : undefined,
    ).resolves.toEqual({ error: "forbidden" });
    expect(mockCheckIpRateLimitGuard).not.toHaveBeenCalled();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("Origin ヘッダが無いリクエストは 403", async () => {
    authorized();

    const result = await authorizeApiRequest(
      new Request("https://example.test/api/profile/avatar", {
        method: "POST",
        headers: { host: "example.test" },
      }),
      "uploadAvatar",
    );

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.response.status).toBe(403);
  });
});
