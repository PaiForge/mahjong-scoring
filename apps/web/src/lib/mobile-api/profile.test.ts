import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuthorize, mockProfile, mockUpdate } = vi.hoisted(() => ({
  mockAuthorize: vi.fn(),
  mockProfile: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock("./auth", () => ({ authorizeMobileRequest: mockAuthorize }));
vi.mock("../db/queries", () => ({ getProfileForEdit: mockProfile }));
vi.mock("../users/update-profile", () => ({
  updateProfileForUser: mockUpdate,
}));
vi.mock("../log-error", () => ({ logExternalError: vi.fn() }));

import { handleReadProfile, handleUpdateProfile } from "./profile";

const INPUT = {
  displayName: "ボブ",
  bio: "",
  xUsername: "bob_x",
  instagramUsername: "",
  youtubeHandle: "",
};

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
    profile: { username: "bob" },
  });
  mockProfile.mockResolvedValue({
    displayName: null,
    avatarUrl: null,
    bio: null,
    xUsername: null,
    instagramUsername: null,
    youtubeHandle: null,
  });
  mockUpdate.mockResolvedValue({ success: true });
});

describe("handleReadProfile", () => {
  it("未設定の欄は空文字で、アバターは項目ごと省いて返す", async () => {
    const body = await (
      await handleReadProfile(new Request("https://example.test"))
    ).json();

    expect(mockProfile).toHaveBeenCalledWith("user-1");
    expect(body).toEqual({
      username: "bob",
      displayName: "",
      bio: "",
      xUsername: "",
      instagramUsername: "",
      youtubeHandle: "",
    });
  });

  it("設定済みの欄とアバターを返す", async () => {
    mockProfile.mockResolvedValue({
      ...INPUT,
      bio: "よろしく",
      avatarUrl: "https://example.test/a.webp",
    });

    const body = await (
      await handleReadProfile(new Request("https://example.test"))
    ).json();

    expect(body).toEqual({
      username: "bob",
      ...INPUT,
      bio: "よろしく",
      avatarUrl: "https://example.test/a.webp",
    });
  });

  it("ユーザー名を決める前は読まずに 409 usernameRequired", async () => {
    mockAuthorize.mockResolvedValue({
      ok: true,
      user: { id: "user-1" },
      profile: undefined,
    });

    const response = await handleReadProfile(
      new Request("https://example.test"),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "usernameRequired" });
    expect(mockProfile).not.toHaveBeenCalled();
  });

  it("読み取りに失敗したら 500 serverError", async () => {
    mockProfile.mockRejectedValue(new Error("db down"));

    const response = await handleReadProfile(
      new Request("https://example.test"),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "serverError" });
  });
});

describe("handleUpdateProfile", () => {
  it("トークンの本人の名義で更新する", async () => {
    const response = await handleUpdateProfile(postJson(INPUT));

    expect(mockUpdate).toHaveBeenCalledWith("user-1", INPUT);
    expect(await response.json()).toEqual({ success: true });
  });

  it("上限を超えた欄も本文では弾かず、検証の理由を 422 で返す", async () => {
    // 制御文字は JSON で \uXXXX（6 バイト）になり、1 文字あたりが最も長い
    const longest = "\u0001".repeat(1000);
    mockUpdate.mockResolvedValue({ error: "bioTooLong" });

    const response = await handleUpdateProfile(
      postJson({
        displayName: longest,
        bio: longest,
        xUsername: longest,
        instagramUsername: longest,
        youtubeHandle: longest,
      }),
    );

    expect(mockUpdate).toHaveBeenCalled();
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "bioTooLong" });
  });

  it("欄が欠けた本文は 400", async () => {
    const { bio: _bio, ...rest } = INPUT;

    const response = await handleUpdateProfile(postJson(rest));

    expect(response.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("ユーザー名を決める前は書かずに 409 usernameRequired", async () => {
    mockAuthorize.mockResolvedValue({
      ok: true,
      user: { id: "user-1" },
      profile: undefined,
    });

    const response = await handleUpdateProfile(postJson(INPUT));

    expect(response.status).toBe(409);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("認証の後に退会が受け付けられていたら 403 deleted", async () => {
    mockUpdate.mockResolvedValue({ error: "unauthorized" });

    const response = await handleUpdateProfile(postJson(INPUT));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "deleted" });
  });

  it("書き込みに失敗したら 500 serverError", async () => {
    mockUpdate.mockResolvedValue({ error: "updateFailed" });

    const response = await handleUpdateProfile(postJson(INPUT));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "serverError" });
  });
});
