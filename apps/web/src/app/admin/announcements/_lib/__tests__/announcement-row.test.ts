import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import type { AnnouncementInput } from "../validation";
import { resolvePinnedAt, toAnnouncementRow } from "../announcement-row";

const NOW = new Date("2026-08-15T12:00:00.000Z");
/** 過去にピン留めしたときの時刻 */
const PINNED_EARLIER = new Date("2026-07-01T09:00:00.000Z");

/** 新規作成の文脈（引き継ぐピン留め時刻が無い） */
const CREATING = { now: NOW, currentPinnedAt: null } as const;

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

describe("resolvePinnedAt", () => {
  it("ピン留めしていなければ null", () => {
    expect(resolvePinnedAt(false, null, NOW)).toBeNull();
  });

  it("ピン留めを外したら、以前の時刻は残さず null にする", () => {
    expect(resolvePinnedAt(false, PINNED_EARLIER, NOW)).toBeNull();
  });

  it("新たにピン留めしたら now を刻む", () => {
    expect(resolvePinnedAt(true, null, NOW)).toBe(NOW);
  });

  // これがこの関数の存在理由。本文だけ直した更新でピン留め時刻が
  // 現在時刻へ書き戻ると、時刻順に並べたときに順序が入れ替わる
  it("ピン留めが続いている間は最初に留めた時刻を動かさない", () => {
    expect(resolvePinnedAt(true, PINNED_EARLIER, NOW)).toBe(PINNED_EARLIER);
  });
});

describe("toAnnouncementRow", () => {
  it("入力値をそのまま行の各列へ写す", () => {
    expect(toAnnouncementRow(input(), CREATING)).toMatchObject({
      slug: "release-notes",
      title: "リリースノート",
      content: "本文",
      locale: "ja",
      status: "published",
    });
  });

  it("publishedAt の ISO 文字列を Date にする", () => {
    expect(toAnnouncementRow(input(), CREATING).publishedAt).toEqual(
      new Date("2026-08-01T00:00:00.000Z"),
    );
  });

  it("publishedAt が null なら null のまま渡す", () => {
    expect(
      toAnnouncementRow(input({ status: "draft", publishedAt: null }), CREATING)
        .publishedAt,
    ).toBeNull();
  });

  it("pinned が false なら pinnedAt は null", () => {
    expect(
      toAnnouncementRow(input({ pinned: false }), CREATING).pinnedAt,
    ).toBeNull();
  });

  // ピン留め時刻は実行時の実時刻ではなく引数の now から決まる。
  // 関数内で new Date() を読んでいたら、この等値比較は成立しない
  it("新規作成でピン留めするなら pinnedAt は引数の now", () => {
    expect(toAnnouncementRow(input({ pinned: true }), CREATING).pinnedAt).toBe(
      NOW,
    );
  });

  it("既にピン留めされている行の更新では pinnedAt を引き継ぐ", () => {
    expect(
      toAnnouncementRow(input({ pinned: true }), {
        now: NOW,
        currentPinnedAt: PINNED_EARLIER,
      }).pinnedAt,
    ).toBe(PINNED_EARLIER);
  });

  it("同じ入力と同じ文脈からは同じ行が出る", () => {
    expect(toAnnouncementRow(input({ pinned: true }), CREATING)).toEqual(
      toAnnouncementRow(input({ pinned: true }), CREATING),
    );
  });
});
