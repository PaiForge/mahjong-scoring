import { describe, expect, it } from "vitest";

import {
  MOBILE_ANNOUNCEMENT_ERROR_CODES,
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

  it("ja と省略は同じ従来のパス（古いアプリと同じ URL）", () => {
    expect(mobileAnnouncementApiPath("release", "ja")).toBe(
      "/api/mobile/v1/announcements/release",
    );
    expect(mobileAnnouncementApiPath("release", "ja")).toBe(
      mobileAnnouncementApiPath("release"),
    );
  });

  it("英語は ?locale=en を付ける", () => {
    expect(mobileAnnouncementApiPath("a/b", "en")).toBe(
      "/api/mobile/v1/announcements/a%2Fb?locale=en",
    );
  });
});

describe("mobileAnnouncementsApiUrl", () => {
  it("ページ番号をクエリに載せる", () => {
    expect(mobileAnnouncementsApiUrl(2)).toBe(
      "/api/mobile/v1/announcements?page=2",
    );
  });

  it("ja と省略は同じ従来の URL（古いアプリと同じ URL）", () => {
    expect(mobileAnnouncementsApiUrl(2, "ja")).toBe(
      "/api/mobile/v1/announcements?page=2",
    );
  });

  it("英語は &locale=en を付ける", () => {
    expect(mobileAnnouncementsApiUrl(2, "en")).toBe(
      "/api/mobile/v1/announcements?page=2&locale=en",
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

describe("MOBILE_ANNOUNCEMENT_ERROR_CODES", () => {
  // アプリは応答の error のコードで「お知らせが無い」画面に分岐する
  it("お知らせが無いことを notFound で伝える", () => {
    expect(MOBILE_ANNOUNCEMENT_ERROR_CODES).toEqual(["notFound"]);
  });
});

describe("parseMobileAnnouncementsResponse（日時の形）", () => {
  it("公開日はタイムゾーンのずれ付きの ISO 日時も読む", () => {
    const body = {
      items: [
        {
          slug: "a",
          title: "A",
          publishedAt: "2026-10-01T09:00:00+09:00",
          pinned: false,
        },
      ],
      page: 1,
      totalPages: 1,
    };
    expect(parseMobileAnnouncementsResponse(body)).toEqual(body);
  });
});

describe("parseMobileAnnouncementResponse（読める形）", () => {
  it("本文と公開日を持つ応答をそのまま読む", () => {
    const body = {
      slug: "a",
      title: "A",
      content: "本文",
      publishedAt: "2026-10-01T09:00:00+09:00",
    };
    expect(parseMobileAnnouncementResponse(body)).toEqual(body);
  });
});
