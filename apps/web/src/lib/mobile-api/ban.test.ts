import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  authorizeAs,
  mockAuthorizeMobileRequest,
} from "@/test/mobile-auth-mock";

const { mockIsUserBanned, mockGetLatestBanReason } = vi.hoisted(() => ({
  mockIsUserBanned: vi.fn(),
  mockGetLatestBanReason: vi.fn(),
}));

vi.mock("./auth", async () => await import("@/test/mobile-auth-mock"));
vi.mock("../ban", () => ({
  isUserBanned: mockIsUserBanned,
  getLatestBanReason: mockGetLatestBanReason,
}));

import { handleReadBan } from "./ban";

function get(): Request {
  return new Request("https://example.test");
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleReadBan", () => {
  it("BAN 中も通す認証で読む", async () => {
    authorizeAs({ userId: "user-1", username: "alice" });
    mockIsUserBanned.mockResolvedValue(false);

    await handleReadBan(get());

    expect(mockAuthorizeMobileRequest).toHaveBeenCalledWith(
      expect.any(Request),
      "readMobileAccount",
      { forBanNotice: true },
    );
  });

  it("BAN 中なら最新の理由を返す", async () => {
    authorizeAs({ userId: "user-1", username: "alice" });
    mockIsUserBanned.mockResolvedValue(true);
    mockGetLatestBanReason.mockResolvedValue("荒らし行為");

    const response = await handleReadBan(get());

    expect(await response.json()).toEqual({
      banned: true,
      reason: "荒らし行為",
    });
    expect(mockGetLatestBanReason).toHaveBeenCalledWith("user-1");
  });

  it("理由が書かれていなければ reason は null", async () => {
    authorizeAs({ userId: "user-1" });
    mockIsUserBanned.mockResolvedValue(true);
    mockGetLatestBanReason.mockResolvedValue(null);

    const response = await handleReadBan(get());

    expect(await response.json()).toEqual({ banned: true, reason: null });
  });

  it("BAN が解けていれば banned: false だけを返し、理由を読まない", async () => {
    authorizeAs({ userId: "user-1", username: "alice" });
    mockIsUserBanned.mockResolvedValue(false);

    const response = await handleReadBan(get());

    expect(await response.json()).toEqual({ banned: false });
    expect(mockGetLatestBanReason).not.toHaveBeenCalled();
  });

  it("認証で弾かれたらその応答を返す", async () => {
    const rejected = new Response(null, { status: 401 });
    mockAuthorizeMobileRequest.mockResolvedValue({
      ok: false,
      response: rejected,
    });

    const response = await handleReadBan(get());

    expect(response).toBe(rejected);
    expect(mockIsUserBanned).not.toHaveBeenCalled();
  });
});
