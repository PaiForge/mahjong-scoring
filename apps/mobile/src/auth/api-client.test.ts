import { beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse } from "../test/api-client-mock";

const mocks = vi.hoisted(() => ({
  session: undefined as
    { user: { id: string }; access_token: string } | undefined,
  getSession: vi.fn(),
  refreshSession: vi.fn(),
  signOut: vi.fn(),
  showDeletionNotice: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock("./supabase-client", () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      refreshSession: mocks.refreshSession,
      signOut: mocks.signOut,
    },
  },
}));
// 実物は expo-constants を読む
vi.mock("../lib/app-site-url", () => ({ SITE_URL: "https://example.test" }));
// 実物は expo-constants と react-native を読む
vi.mock("../app-version/app-version", () => ({
  APP_VERSION: "1.0.0",
  APP_PLATFORM: "ios",
}));
vi.mock("./use-deletion-notice", () => ({
  showDeletionNotice: mocks.showDeletionNotice,
}));

const { callMobileApi, onAccountDeleted } = await import("./api-client");

/** アプリの版と OS を知らせるヘッダ（上のモックの値） */
const APP_HEADERS = { "X-App-Version": "1.0.0", "X-App-Platform": "ios" };

function session(accessToken: string) {
  return { user: { id: "user-a" }, access_token: accessToken };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.session = session("token-1");
  mocks.getSession.mockImplementation(async () => ({
    data: { session: mocks.session ?? null },
  }));
  mocks.signOut.mockImplementation(async () => {
    mocks.session = undefined;
    return { error: null };
  });
});

describe("callMobileApi", () => {
  it("保存用に認証回復を無効にすると、401 を再送せずログインも捨てない", async () => {
    mocks.fetch.mockResolvedValueOnce(
      jsonResponse(401, { error: "unauthorized" }),
    );
    const result = await callMobileApi("/api/x", { retryUnauthorized: false });
    expect(result).toBeInstanceOf(Response);
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(mocks.refreshSession).not.toHaveBeenCalled();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("中断済みなら認証取得も通信もしない", async () => {
    const controller = new AbortController();
    controller.abort();
    expect(await callMobileApi("/api/x", { signal: controller.signal })).toBe(
      "network",
    );
    expect(mocks.getSession).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("セッション取得中に中断したら、取得後に遅れて送信しない", async () => {
    const controller = new AbortController();
    const pending = Promise.withResolvers<{
      data: { session: ReturnType<typeof session> };
    }>();
    mocks.getSession.mockReturnValueOnce(pending.promise);
    const result = callMobileApi("/api/x", { signal: controller.signal });
    controller.abort();
    pending.resolve({ data: { session: session("token-1") } });
    expect(await result).toBe("network");
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("signal を fetch に渡し、送信中の中断を通信失敗にする", async () => {
    const controller = new AbortController();
    const started = Promise.withResolvers<void>();
    mocks.fetch.mockImplementationOnce(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          expect(init.signal).toBe(controller.signal);
          init.signal?.addEventListener(
            "abort",
            () => reject(new Error("aborted")),
            { once: true },
          );
          started.resolve();
        }),
    );
    const result = callMobileApi("/api/x", { signal: controller.signal });
    await started.promise;
    controller.abort();
    expect(await result).toBe("network");
    expect(mocks.refreshSession).not.toHaveBeenCalled();
  });

  it("401 の認証回復中に中断したら、回復後も再送しない", async () => {
    const controller = new AbortController();
    mocks.fetch.mockResolvedValueOnce(
      jsonResponse(401, { error: "unauthorized" }),
    );
    mocks.refreshSession.mockImplementationOnce(async () => {
      controller.abort();
      return { data: { session: session("token-2") } };
    });
    expect(await callMobileApi("/api/x", { signal: controller.signal })).toBe(
      "network",
    );
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("応答をそのまま返す", async () => {
    mocks.fetch.mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const result = await callMobileApi("/api/x");

    expect(result).toBeInstanceOf(Response);
    expect(mocks.fetch).toHaveBeenCalledWith(
      "https://example.test/api/x",
      expect.objectContaining({
        headers: { Authorization: "Bearer token-1", ...APP_HEADERS },
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
        headers: { Authorization: "Bearer token-2", ...APP_HEADERS },
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
