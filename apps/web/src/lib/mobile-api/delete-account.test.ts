import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuthorize, mockHasToken, mockStore, mockRequest } = vi.hoisted(
  () => ({
    mockAuthorize: vi.fn(),
    mockHasToken: vi.fn(),
    mockStore: vi.fn(),
    mockRequest: vi.fn(),
  }),
);

vi.mock("server-only", () => ({}));
vi.mock("./auth", () => ({ authorizeMobileRequest: mockAuthorize }));
vi.mock("../apple/refresh-tokens", () => ({
  hasAppleRefreshToken: mockHasToken,
  storeAppleAuthorizationCode: mockStore,
}));
vi.mock("../users/delete-account", () => ({
  requestAccountDeletion: mockRequest,
}));
vi.mock("../activity-log", () => ({ logActivityEvent: vi.fn() }));
vi.mock("../log-error", () => ({ logExternalError: vi.fn() }));

import { handleDeleteAccount } from "./delete-account";

function post(body?: unknown): Request {
  return new Request("https://example.test", {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function signedInAs(appleSubject: string | undefined) {
  mockAuthorize.mockResolvedValue({
    ok: true,
    user: { id: "user-1" },
    profile: undefined,
    appleSubject,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  signedInAs(undefined);
  mockHasToken.mockResolvedValue(false);
  mockStore.mockResolvedValue("saved");
  mockRequest.mockResolvedValue("completed");
});

describe("handleDeleteAccount", () => {
  it("Apple の連携が無ければ、本文無しでそのまま受け付ける", async () => {
    const response = await handleDeleteAccount(post());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "completed" });
    expect(mockRequest).toHaveBeenCalledWith("user-1");
  });

  it("Apple の連携があってトークンを持っていれば、そのまま受け付ける", async () => {
    signedInAs("apple-sub");
    mockHasToken.mockResolvedValue(true);

    expect((await handleDeleteAccount(post())).status).toBe(200);
    expect(mockRequest).toHaveBeenCalled();
  });

  it("Apple の連携があってトークンが無ければ、受け付けずに Apple での確認を求める", async () => {
    signedInAs("apple-sub");

    const response = await handleDeleteAccount(post());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "appleAuthorizationRequired",
    });
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("確認し直したコードを交換・保存してから受け付ける", async () => {
    signedInAs("apple-sub");

    const response = await handleDeleteAccount(
      post({ appleAuthorizationCode: "code-1" }),
    );

    expect(response.status).toBe(200);
    expect(mockStore).toHaveBeenCalledWith("user-1", "apple-sub", "code-1");
    expect(mockStore.mock.invocationCallOrder[0]).toBeLessThan(
      mockRequest.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it("コードを保存できなければ受け付けない（拒まれたら 422、Apple に届かなければ 503）", async () => {
    signedInAs("apple-sub");

    mockStore.mockResolvedValueOnce("rejected");
    expect(
      (await handleDeleteAccount(post({ appleAuthorizationCode: "c" }))).status,
    ).toBe(422);
    mockStore.mockResolvedValueOnce("unavailable");
    expect(
      (await handleDeleteAccount(post({ appleAuthorizationCode: "c" }))).status,
    ).toBe(503);
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("Apple の連携が無いのにコードが付いていたら断る", async () => {
    expect(
      (await handleDeleteAccount(post({ appleAuthorizationCode: "c" }))).status,
    ).toBe(422);
    expect(mockStore).not.toHaveBeenCalled();
  });

  it("受付そのものの失敗は 500 deleteFailed", async () => {
    mockRequest.mockRejectedValue(new Error("db down"));

    const response = await handleDeleteAccount(post());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "deleteFailed" });
  });
});
