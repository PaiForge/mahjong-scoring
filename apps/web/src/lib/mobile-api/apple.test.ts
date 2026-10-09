import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuthorize, mockStore } = vi.hoisted(() => ({
  mockAuthorize: vi.fn(),
  mockStore: vi.fn(),
}));

vi.mock("./auth", () => ({ authorizeMobileRequest: mockAuthorize }));
vi.mock("../apple/refresh-tokens", () => ({
  storeAppleAuthorizationCode: mockStore,
}));
vi.mock("../log-error", () => ({ logExternalError: vi.fn() }));

import { handleSaveAppleToken } from "./apple";

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
  mockStore.mockResolvedValue("saved");
});

describe("handleSaveAppleToken", () => {
  it("本人の Apple の連携の ID と一緒にコードを預ける", async () => {
    const response = await handleSaveAppleToken(
      post({ authorizationCode: "code-1" }),
    );

    expect(response.status).toBe(200);
    expect(mockStore).toHaveBeenCalledWith("user-1", "apple-sub-1", "code-1");
  });

  it("Apple の連携を持たないユーザーは、預けずに断る", async () => {
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
    expect(mockStore).not.toHaveBeenCalled();
  });

  it("拒まれたら 422、Apple に届かなければ 503、保存の失敗は 500", async () => {
    mockStore.mockResolvedValueOnce("rejected");
    expect(
      (await handleSaveAppleToken(post({ authorizationCode: "c" }))).status,
    ).toBe(422);

    mockStore.mockResolvedValueOnce("unavailable");
    expect(
      (await handleSaveAppleToken(post({ authorizationCode: "c" }))).status,
    ).toBe(503);

    mockStore.mockRejectedValueOnce(new Error("db down"));
    expect(
      (await handleSaveAppleToken(post({ authorizationCode: "c" }))).status,
    ).toBe(500);
  });

  it("コードが無ければ 400", async () => {
    expect((await handleSaveAppleToken(post({}))).status).toBe(400);
  });
});
