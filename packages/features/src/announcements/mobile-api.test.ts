import { describe, expect, it } from "vitest";

import {
  mobileAnnouncementApiPath,
  mobileAnnouncementsApiUrl,
  parseMobileAnnouncementResponse,
  parseMobileAnnouncementsResponse,
} from "./mobile-api";

describe("mobileAnnouncementApiPath", () => {
  it("slug を 1 つのパスの区切りとして埋め込む", () => {
    expect(mobileAnnouncementApiPath("a/b")).toBe(
      "/api/mobile/v1/announcements/a%2Fb",
    );
  });
});

describe("mobileAnnouncementsApiUrl", () => {
  it("ページ番号をクエリに載せる", () => {
    expect(mobileAnnouncementsApiUrl(2)).toBe(
      "/api/mobile/v1/announcements?page=2",
    );
  });
});

describe("parseMobileAnnouncementsResponse", () => {
  it("公開日の無い行も読む", () => {
    expect(
      parseMobileAnnouncementsResponse({
        items: [
          {
            slug: "a",
            title: "A",
            publishedAt: "2026-10-01T00:00:00.000Z",
            pinned: true,
          },
          { slug: "b", title: "B", pinned: false },
        ],
        page: 1,
        totalPages: 1,
      })?.items,
    ).toHaveLength(2);
  });

  it("公開日が日時でなければ undefined", () => {
    expect(
      parseMobileAnnouncementsResponse({
        items: [{ slug: "a", title: "A", publishedAt: "昨日", pinned: false }],
        page: 1,
        totalPages: 1,
      }),
    ).toBeUndefined();
  });
});

describe("parseMobileAnnouncementResponse", () => {
  it("本文が無ければ undefined", () => {
    expect(
      parseMobileAnnouncementResponse({ slug: "a", title: "A" }),
    ).toBeUndefined();
  });
});
