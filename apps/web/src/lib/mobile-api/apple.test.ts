import { beforeEach, describe, expect, it, vi } from "vitest";
import { authorizeAs } from "@/test/mobile-auth-mock";

const { mockStore } = vi.hoisted(() => ({
  mockStore: vi.fn(),
}));

vi.mock("./auth", async () => await import("@/test/mobile-auth-mock"));
vi.mock("../apple/refresh-tokens", () => ({
  storeAppleAuthorizationCode: mockStore,
}));
vi.mock("../log-error", async () => await import("@/test/log-error-mock"));

import { handleSaveAppleToken } from "./apple";
import { postJsonRequest } from "@/test/request";

function post(body: unknown): Request {
  return postJsonRequest("https://example.test", body);
}

beforeEach(() => {
  vi.clearAllMocks();
  authorizeAs({ userId: "user-1", appleSubject: "apple-sub-1" });
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
    authorizeAs({ userId: "user-1" });

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
