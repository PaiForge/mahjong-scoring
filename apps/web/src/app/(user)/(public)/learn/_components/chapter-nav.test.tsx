import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { CURRICULUM } from "../_lib/curriculum";
import { ChapterNav } from "./chapter-nav";

vi.mock("next-intl/server", async () => await import("@/test/intl-mock"));

describe("ChapterNav", () => {
  it("shows only the next link for the first chapter", async () => {
    const { container } = render(await ChapterNav({ slug: "about-this-app" }));
    const anchors = container.querySelectorAll("a");
    expect(anchors.length).toBe(1);
    expect(anchors[0]!.getAttribute("href")).toBe(
      "/learn/why-scoring-is-complex",
    );
  });

  it("shows only the prev link for the last chapter", async () => {
    // 末尾の章は章を足すたびに変わるため、slug を直書きせず CURRICULUM から引く
    const sorted = [...CURRICULUM].sort((a, b) => a.order - b.order);
    const last = sorted.at(-1)!;
    const secondLast = sorted.at(-2)!;
    const { container } = render(await ChapterNav({ slug: last.slug }));
    const anchors = container.querySelectorAll("a");
    expect(anchors.length).toBe(1);
    expect(anchors[0]!.getAttribute("href")).toBe(`/learn/${secondLast.slug}`);
  });

  it("shows both prev and next links for a middle chapter", async () => {
    const { container } = render(await ChapterNav({ slug: "mentsu-fu" }));
    const anchors = container.querySelectorAll("a");
    expect(anchors.length).toBe(2);
    const hrefs = Array.from(anchors).map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/learn/jantou-fu");
    expect(hrefs).toContain("/learn/machi-fu");
  });
});
