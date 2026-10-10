/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuthorize, mockSave, mockRemove } = vi.hoisted(() => ({
  mockAuthorize: vi.fn(),
  mockSave: vi.fn(),
  mockRemove: vi.fn(),
}));

vi.mock("./auth", () => ({ authorizeMobileRequest: mockAuthorize }));
vi.mock("../users/avatar", () => ({
  saveAvatarForUser: mockSave,
  removeAvatarForUser: mockRemove,
}));
vi.mock("../log-error", () => ({ logExternalError: vi.fn() }));

import { AVATAR_MAX_FILE_SIZE } from "../images/policy";

import { handleDeleteAvatar, handleUploadAvatar } from "./avatar";

/** PNG のマジックナンバー（署名検証を通す最小の先頭） */
const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function upload(file?: File): Request {
  const body = new FormData();
  if (file) body.set("file", file);
  return new Request("https://example.test", { method: "POST", body });
}

const png = () =>
  new File([new Uint8Array(PNG_HEADER)], "a.png", { type: "image/png" });

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthorize.mockResolvedValue({
    ok: true,
    user: { id: "user-1" },
    profile: { username: "bob" },
  });
  mockSave.mockResolvedValue({ avatarUrl: "https://example.test/a.webp?t=1" });
  mockRemove.mockResolvedValue(undefined);
});

describe("handleUploadAvatar", () => {
  it("トークンの本人の名義で保存し、URL を返す", async () => {
    const response = await handleUploadAvatar(upload(png()));

    expect(mockSave).toHaveBeenCalledWith(
      "user-1",
      expect.any(Buffer),
      "POST /api/mobile/v1/profile/avatar",
    );
    expect(await response.json()).toEqual({
      avatarUrl: "https://example.test/a.webp?t=1",
    });
  });

  it("file が無ければ保存せずに 400 invalidRequest", async () => {
    const response = await handleUploadAvatar(upload());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalidRequest" });
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("受け付けない形式・大きすぎる画像は 422 で理由を返す", async () => {
    const gif = new File([new Uint8Array([0x47, 0x49, 0x46])], "a.gif", {
      type: "image/gif",
    });
    const large = new File(
      [new Uint8Array(AVATAR_MAX_FILE_SIZE + 1)],
      "a.png",
      { type: "image/png" },
    );

    const typeResponse = await handleUploadAvatar(upload(gif));
    const sizeResponse = await handleUploadAvatar(upload(large));

    expect(typeResponse.status).toBe(422);
    expect(await typeResponse.json()).toEqual({ error: "invalidType" });
    expect(sizeResponse.status).toBe(422);
    expect(await sizeResponse.json()).toEqual({ error: "tooLarge" });
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("読めない画像は 422 invalidImage、保存の失敗は 500、退会の受付後は 403", async () => {
    mockSave.mockResolvedValueOnce({ error: "invalidImage" });
    mockSave.mockResolvedValueOnce({ error: "uploadFailed" });
    mockSave.mockResolvedValueOnce({ error: "unauthorized" });

    const invalid = await handleUploadAvatar(upload(png()));
    const failed = await handleUploadAvatar(upload(png()));
    const deleted = await handleUploadAvatar(upload(png()));

    expect([invalid.status, failed.status, deleted.status]).toEqual([
      422, 500, 403,
    ]);
    expect(await invalid.json()).toEqual({ error: "invalidImage" });
    expect(await deleted.json()).toEqual({ error: "deleted" });
  });

  it("ユーザー名を決める前は 409 usernameRequired", async () => {
    mockAuthorize.mockResolvedValue({
      ok: true,
      user: { id: "user-1" },
      profile: undefined,
    });

    const response = await handleUploadAvatar(upload(png()));

    expect(response.status).toBe(409);
    expect(mockSave).not.toHaveBeenCalled();
  });
});

describe("handleDeleteAvatar", () => {
  it("トークンの本人のアバターを消す", async () => {
    const response = await handleDeleteAvatar(
      new Request("https://example.test", { method: "POST" }),
    );

    expect(mockRemove).toHaveBeenCalledWith("user-1");
    expect(await response.json()).toEqual({ success: true });
  });

  it("消せなかったら 500 serverError", async () => {
    mockRemove.mockRejectedValue(new Error("db down"));

    const response = await handleDeleteAvatar(
      new Request("https://example.test", { method: "POST" }),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "serverError" });
  });
});
