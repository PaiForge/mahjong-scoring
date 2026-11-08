/**
 * BAN のページの metadata のテスト
 *
 * @description
 * - 日本語: 何も足さない（title も robots も従来どおりルートレイアウトのまま）
 * - 英語: 英語の title と noindex, nofollow
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreatePrivateMetadata } = vi.hoisted(() => ({
  mockCreatePrivateMetadata: vi.fn(),
}));

vi.mock("@/app/_lib/metadata", () => ({
  createPrivateMetadata: mockCreatePrivateMetadata,
}));

import { bannedPageMetadata } from "../banned-metadata";

beforeEach(() => {
  mockCreatePrivateMetadata.mockReset();
  mockCreatePrivateMetadata.mockResolvedValue({
    title: "Your account has been suspended",
    robots: { index: false, follow: false },
  });
});

describe("bannedPageMetadata", () => {
  it("日本語では空の metadata（従来の head のまま）", async () => {
    expect(await bannedPageMetadata("ja")).toEqual({});
    expect(mockCreatePrivateMetadata).not.toHaveBeenCalled();
  });

  it("英語では英語の title と noindex を付ける", async () => {
    expect(await bannedPageMetadata("en")).toEqual({
      title: "Your account has been suspended",
      robots: { index: false, follow: false },
    });
    expect(mockCreatePrivateMetadata).toHaveBeenCalledWith("banned", "title", {
      locale: "en",
    });
  });
});
