import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuthorize, mockBlock, mockUnblock, mockList, mockCreateReport } =
  vi.hoisted(() => ({
    mockAuthorize: vi.fn(),
    mockBlock: vi.fn(),
    mockUnblock: vi.fn(),
    mockList: vi.fn(),
    mockCreateReport: vi.fn(),
  }));

vi.mock("./auth", () => ({ authorizeMobileRequest: mockAuthorize }));
vi.mock("../blocks/blocks", () => ({
  blockUser: mockBlock,
  unblockUser: mockUnblock,
  listBlockedUsers: mockList,
}));
vi.mock("../reports/create-report", () => ({ createReport: mockCreateReport }));
vi.mock("../log-error", () => ({ logExternalError: vi.fn() }));

import {
  handleBlockUser,
  handleReadBlocks,
  handleReportUser,
  handleUnblockUser,
} from "./moderation";

const post = (body?: unknown) =>
  new Request("https://example.test", {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthorize.mockResolvedValue({
    ok: true,
    user: { id: "me" },
    profile: { username: "me" },
  });
});

describe("handleBlockUser", () => {
  it("ブロックして成功を返す", async () => {
    mockBlock.mockResolvedValue("done");

    const response = await handleBlockUser(post(), "bob");

    expect(mockBlock).toHaveBeenCalledWith("me", "bob");
    expect(await response.json()).toEqual({ success: true });
  });

  it.each([
    ["notFound", 404, "notFound"],
    ["self", 422, "self"],
    ["accountClosing", 403, "deleted"],
  ])("%s は %i で %s", async (result, status, error) => {
    mockBlock.mockResolvedValue(result);

    const response = await handleBlockUser(post(), "bob");

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error });
  });

  it("回数制限は web のブロックと同じ枠", async () => {
    mockBlock.mockResolvedValue("done");
    await handleBlockUser(post(), "bob");
    expect(mockAuthorize).toHaveBeenCalledWith(
      expect.any(Request),
      "updateBlocks",
    );
  });
});

describe("handleUnblockUser", () => {
  it("解除して成功を返す", async () => {
    mockUnblock.mockResolvedValue("done");

    const response = await handleUnblockUser(post(), "bob");

    expect(mockUnblock).toHaveBeenCalledWith("me", "bob");
    expect(await response.json()).toEqual({ success: true });
  });
});

describe("handleReportUser", () => {
  it("検証した入力で通報する（詳細は前後の空白を除き、空なら null）", async () => {
    mockCreateReport.mockResolvedValue("done");

    const response = await handleReportUser(
      post({ reason: "spam", detail: "  " }),
      "bob",
    );

    expect(mockCreateReport).toHaveBeenCalledWith("me", "bob", {
      reason: "spam",
      detail: null,
    });
    expect(await response.json()).toEqual({ success: true });
  });

  it("その他で詳細が無ければ 422 detailRequired で、通報しない", async () => {
    const response = await handleReportUser(post({ reason: "other" }), "bob");

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "detailRequired" });
    expect(mockCreateReport).not.toHaveBeenCalled();
  });

  it("本文の形が違えば 400", async () => {
    const response = await handleReportUser(post({ reason: 1 }), "bob");

    expect(response.status).toBe(400);
  });

  it("いない相手は 404", async () => {
    mockCreateReport.mockResolvedValue("notFound");

    const response = await handleReportUser(post({ reason: "spam" }), "ghost");

    expect(response.status).toBe(404);
  });
});

describe("handleReadBlocks", () => {
  it("ブロックした人を ID と日時を出さずに返す", async () => {
    mockList.mockResolvedValue([
      {
        username: "bob",
        displayName: null,
        avatarUrl: "https://a.test/b.webp",
        blockedAt: new Date(),
      },
    ]);

    const response = await handleReadBlocks(
      new Request("https://example.test"),
    );

    expect(await response.json()).toEqual({
      items: [{ username: "bob", avatarUrl: "https://a.test/b.webp" }],
    });
  });
});
