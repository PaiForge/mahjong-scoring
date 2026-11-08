import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { CURRICULUM } from "@mahjong-scoring/features/curriculum/registry";
import { ChapterNav } from "./chapter-nav";

vi.mock("next-intl/server", async () => await import("@/test/intl-mock"));

// 英語での公開状態は許可リストの変更で動くので、テストでは「英語で出している
// 章は jantou-fu だけ」に固定する（日本語は resolveNavTargetFor が問い合わせない）
vi.mock("@/i18n/navigation", () => ({
  resolvePublishedHref: (path: string, locale: string) =>
    locale === "en" && path === "/lessons/jantou-fu"
      ? "/en/lessons/jantou-fu"
      : undefined,
}));

describe("ChapterNav", () => {
  it("shows only the next link for the first chapter", async () => {
    const { container } = render(
      await ChapterNav({ slug: "about-this-app", locale: "ja" }),
    );
    const anchors = container.querySelectorAll("a");
    expect(anchors.length).toBe(1);
    expect(anchors[0]!.getAttribute("href")).toBe(
      "/lessons/why-scoring-is-complex",
    );
  });

  it("shows only the prev link for the last chapter", async () => {
    // 末尾の章は章を足すたびに変わるため、slug を直書きせず CURRICULUM から引く
    const sorted = [...CURRICULUM].sort((a, b) => a.order - b.order);
    const last = sorted.at(-1)!;
    const secondLast = sorted.at(-2)!;
    const { container } = render(
      await ChapterNav({ slug: last.slug, locale: "ja" }),
    );
    const anchors = container.querySelectorAll("a");
    expect(anchors.length).toBe(1);
    expect(anchors[0]!.getAttribute("href")).toBe(
      `/lessons/${secondLast.slug}`,
    );
  });

  it("shows both prev and next links for a middle chapter", async () => {
    const { container } = render(
      await ChapterNav({ slug: "mentsu-fu", locale: "ja" }),
    );
    const anchors = container.querySelectorAll("a");
    expect(anchors.length).toBe(2);
    const hrefs = Array.from(anchors).map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/lessons/jantou-fu");
    expect(hrefs).toContain("/lessons/machi-fu");
  });

  it("日本語では言語をまたがず、「日本語のみ」の印を付けない", async () => {
    const { container } = render(
      await ChapterNav({ slug: "mentsu-fu", locale: "ja" }),
    );
    for (const anchor of container.querySelectorAll("a")) {
      expect(anchor.hasAttribute("hrefLang")).toBe(false);
    }
    expect(container.textContent).not.toContain("japaneseOnly");
  });

  it("英語では、英語で出している章は英語の URL、出していない章は日本語の章へ印付きで張る", async () => {
    const { container } = render(
      await ChapterNav({ slug: "mentsu-fu", locale: "en" }),
    );
    const anchors = Array.from(container.querySelectorAll("a"));
    const prev = anchors.find((a) =>
      a.textContent?.includes("prevChapterLabel"),
    );
    const next = anchors.find((a) =>
      a.textContent?.includes("nextChapterLabel"),
    );

    expect(prev?.getAttribute("href")).toBe("/en/lessons/jantou-fu");
    expect(prev?.hasAttribute("hreflang")).toBe(false);
    expect(prev?.textContent).not.toContain("japaneseOnly");

    expect(next?.getAttribute("href")).toBe("/lessons/machi-fu");
    expect(next?.getAttribute("hreflang")).toBe("ja");
    expect(next?.textContent).toContain("japaneseOnly");
  });
});
