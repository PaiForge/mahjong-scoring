import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuthorize, mockConfig, mockExchange, mockSave } = vi.hoisted(
  () => ({
    mockAuthorize: vi.fn(),
    mockConfig: vi.fn(),
    mockExchange: vi.fn(),
    mockSave: vi.fn(),
  }),
);

vi.mock("server-only", () => ({}));
vi.mock("./auth", () => ({ authorizeMobileRequest: mockAuthorize }));
vi.mock("../apple/config", () => ({ readAppleServerConfig: mockConfig }));
vi.mock("../apple/apple-id-api", () => ({
  exchangeAppleAuthorizationCode: mockExchange,
}));
vi.mock("../apple/refresh-tokens", () => ({
  saveAppleRefreshToken: mockSave,
}));
vi.mock("../log-error", () => ({ logExternalError: vi.fn() }));

import { handleSaveAppleToken } from "./apple";

const CONFIG = {
  teamId: "TEAM",
  keyId: "KEY",
  privateKey: "pem",
  encryptionKey: Buffer.alloc(32),
};

function post(body: unknown): Request {
  return new Request("https://example.test", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthorize.mockResolvedValue({
    ok: true,
    user: { id: "user-1" },
    profile: undefined,
    appleSubject: "apple-sub-1",
  });
  mockConfig.mockReturnValue(CONFIG);
  mockExchange.mockResolvedValue({
    ok: true,
    refreshToken: "apple-refresh",
    subject: "apple-sub-1",
  });
  mockSave.mockResolvedValue(undefined);
});

describe("handleSaveAppleToken", () => {
  it("コードをアプリの Bundle ID で交換し、本人の Apple の連携と一致すれば保存する", async () => {
    const response = await handleSaveAppleToken(
      post({ authorizationCode: "code-1" }),
    );

    expect(response.status).toBe(200);
    expect(mockExchange).toHaveBeenCalledWith(
      CONFIG,
      "help.mahjong.score",
      "code-1",
    );
    expect(mockSave).toHaveBeenCalledWith("user-1", {
      appleSubject: "apple-sub-1",
      clientId: "help.mahjong.score",
      refreshToken: "apple-refresh",
      encryptionKey: CONFIG.encryptionKey,
    });
  });

  it("交換の結果が別の Apple アカウントなら保存しない", async () => {
    mockExchange.mockResolvedValue({
      ok: true,
      refreshToken: "other-refresh",
      subject: "apple-sub-2",
    });

    const response = await handleSaveAppleToken(
      post({ authorizationCode: "code-1" }),
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "appleRejected" });
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("Apple の連携を持たないユーザーは Apple に問い合わせずに断る", async () => {
    mockAuthorize.mockResolvedValue({
      ok: true,
      user: { id: "user-1" },
      profile: undefined,
      appleSubject: undefined,
    });

    const response = await handleSaveAppleToken(
      post({ authorizationCode: "code-1" }),
    );

    expect(response.status).toBe(422);
    expect(mockExchange).not.toHaveBeenCalled();
  });

  it("Apple がコードを拒んだら 422、届かなければ 503", async () => {
    mockExchange.mockResolvedValueOnce({ ok: false, reason: "rejected" });
    expect(
      (await handleSaveAppleToken(post({ authorizationCode: "c" }))).status,
    ).toBe(422);

    mockExchange.mockResolvedValueOnce({ ok: false, reason: "unavailable" });
    expect(
      (await handleSaveAppleToken(post({ authorizationCode: "c" }))).status,
    ).toBe(503);
  });

  it("サーバーに Apple の設定が無ければ 503 で、Apple に問い合わせない", async () => {
    mockConfig.mockReturnValue(undefined);

    const response = await handleSaveAppleToken(
      post({ authorizationCode: "code-1" }),
    );

    expect(response.status).toBe(503);
    expect(mockExchange).not.toHaveBeenCalled();
  });

  it("コードが無ければ 400", async () => {
    expect((await handleSaveAppleToken(post({}))).status).toBe(400);
  });
});
