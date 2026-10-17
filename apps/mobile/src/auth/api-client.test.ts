import { beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse } from "../test/api-client-mock";

const mocks = vi.hoisted(() => ({
  session: undefined as
    { user: { id: string }; access_token: string } | undefined,
  refreshSession: vi.fn(),
  signOut: vi.fn(),
  showDeletionNotice: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock("./supabase-client", () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: mocks.session ?? null } }),
      refreshSession: mocks.refreshSession,
      signOut: mocks.signOut,
    },
  },
}));
// 実物は expo-constants を読む
vi.mock("../lib/app-site-url", () => ({ SITE_URL: "https://example.test" }));
vi.mock("./use-deletion-notice", () => ({
  showDeletionNotice: mocks.showDeletionNotice,
}));

const { callMobileApi, onAccountDeleted } = await import("./api-client");

function session(accessToken: string) {
  return { user: { id: "user-a" }, access_token: accessToken };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.session = session("token-1");
  mocks.signOut.mockImplementation(async () => {
    mocks.session = undefined;
    return { error: null };
  });
});

describe("callMobileApi", () => {
  it("応答をそのまま返す", async () => {
    mocks.fetch.mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const result = await callMobileApi("/api/x");

    expect(result).toBeInstanceOf(Response);
    expect(mocks.fetch).toHaveBeenCalledWith(
      "https://example.test/api/x",
      expect.objectContaining({
        headers: { Authorization: "Bearer token-1" },
      }),
    );
  });

  it("要求が届かなければ network を返す", async () => {
    mocks.fetch.mockRejectedValueOnce(new TypeError("Network request failed"));

    expect(await callMobileApi("/api/x")).toBe("network");
  });

  it("ログインしていなければ送らずに unauthorized を返す", async () => {
    mocks.session = undefined;

    expect(await callMobileApi("/api/x")).toBe("unauthorized");
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("401 ならトークンを更新して 1 度だけ送り直す", async () => {
    mocks.fetch
      .mockResolvedValueOnce(jsonResponse(401, { error: "unauthorized" }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    mocks.refreshSession.mockResolvedValueOnce({
      data: { session: session("token-2") },
    });

    const result = await callMobileApi("/api/x");

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(200);
    expect(mocks.fetch).toHaveBeenLastCalledWith(
      "https://example.test/api/x",
      expect.objectContaining({
        headers: { Authorization: "Bearer token-2" },
      }),
    );
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("送り直しても 401 ならログインを捨てる", async () => {
    mocks.fetch
      .mockResolvedValueOnce(jsonResponse(401, { error: "unauthorized" }))
      .mockResolvedValueOnce(jsonResponse(401, { error: "unauthorized" }));
    mocks.refreshSession.mockImplementationOnce(async () => {
      mocks.session = session("token-2");
      return { data: { session: mocks.session } };
    });

    const result = await callMobileApi("/api/x");

    expect((result as Response).status).toBe(401);
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("403 deleted なら退会を知らせてログインを捨てる", async () => {
    const deleted = vi.fn();
    const unsubscribe = onAccountDeleted(deleted);
    mocks.fetch.mockResolvedValueOnce(jsonResponse(403, { error: "deleted" }));

    const result = await callMobileApi("/api/x");
    unsubscribe();

    expect((result as Response).status).toBe(403);
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(deleted).toHaveBeenCalledWith("user-a");
    expect(mocks.showDeletionNotice).toHaveBeenCalledWith("pending");
  });

  it("応答を受け取った後の処理が投げても network にせず応答を返す", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const unsubscribe = onAccountDeleted(() => {
      throw new Error("listener failed");
    });
    mocks.fetch.mockResolvedValueOnce(jsonResponse(403, { error: "deleted" }));

    const result = await callMobileApi("/api/x");
    unsubscribe();

    expect((result as Response).status).toBe(403);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
