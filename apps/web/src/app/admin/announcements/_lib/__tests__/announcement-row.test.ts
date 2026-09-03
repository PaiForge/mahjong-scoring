import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import type { AnnouncementInput } from "../validation";
import { toAnnouncementRow } from "../announcement-row";

const NOW = new Date("2026-08-15T12:00:00.000Z");

function input(overrides: Partial<AnnouncementInput> = {}): AnnouncementInput {
  return {
    slug: "release-notes",
    title: "リリースノート",
    content: "本文",
    locale: "ja",
    status: "published",
    publishedAt: "2026-08-01T00:00:00.000Z",
    pinned: false,
    ...overrides,
  };
}

describe("toAnnouncementRow", () => {
  it("入力値をそのまま行の各列へ写す", () => {
    expect(toAnnouncementRow(input(), NOW)).toMatchObject({
      slug: "release-notes",
      title: "リリースノート",
      content: "本文",
      locale: "ja",
      status: "published",
    });
  });

  it("publishedAt の ISO 文字列を Date にする", () => {
    expect(toAnnouncementRow(input(), NOW).publishedAt).toEqual(
      new Date("2026-08-01T00:00:00.000Z"),
    );
  });

  it("publishedAt が null なら null のまま渡す", () => {
    expect(
      toAnnouncementRow(input({ status: "draft", publishedAt: null }), NOW)
        .publishedAt,
    ).toBeNull();
  });

  it("pinned が false なら pinnedAt は null", () => {
    expect(
      toAnnouncementRow(input({ pinned: false }), NOW).pinnedAt,
    ).toBeNull();
  });

  // ピン留め時刻は実行時の実時刻ではなく引数の now から決まる。
  // 関数内で new Date() を読んでいたら、この等値比較は成立しない
  it("pinned が true なら pinnedAt は引数の now", () => {
    expect(toAnnouncementRow(input({ pinned: true }), NOW).pinnedAt).toEqual(
      NOW,
    );
  });

  it("同じ入力と同じ now からは同じ行が出る", () => {
    expect(toAnnouncementRow(input({ pinned: true }), NOW)).toEqual(
      toAnnouncementRow(input({ pinned: true }), NOW),
    );
  });
});
