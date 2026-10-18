import { describe, expect, it } from "vitest";

import { type AnnouncementInput, validateAnnouncement } from "../validation";

function input(overrides: Partial<AnnouncementInput> = {}): AnnouncementInput {
  return {
    slug: "release-notes",
    title: "リリースノート",
    content: "本文",
    locale: "ja",
    status: "published",
    publishedAt: "2026-08-01T09:00",
    pinned: false,
    ...overrides,
  };
}

describe("validateAnnouncement の公開日時", () => {
  it("datetime-local の値なら通す", () => {
    expect(validateAnnouncement(input())).toBeUndefined();
  });

  it("公開状態で未入力なら必須エラー", () => {
    expect(validateAnnouncement(input({ publishedAt: null }))).toBe(
      "errorPublishedAtRequired",
    );
  });

  it("下書きなら未入力でも通す", () => {
    expect(
      validateAnnouncement(input({ status: "draft", publishedAt: null })),
    ).toBeUndefined();
  });

  // 以前のフォームはブラウザで ISO 文字列に直して送っていた。その形は
  // タイムゾーン付きで、JST の壁時計として読むと意味が変わるので受け取らない
  it.each(["2026-08-01T00:00:00.000Z", "2026-02-30T09:00", "あした"])(
    "datetime-local の形でない値（%j）は形式エラー",
    (publishedAt) => {
      expect(validateAnnouncement(input({ publishedAt }))).toBe(
        "errorPublishedAtInvalid",
      );
    },
  );
});
