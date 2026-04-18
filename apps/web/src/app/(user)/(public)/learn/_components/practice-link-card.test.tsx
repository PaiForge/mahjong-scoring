import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { PracticeLinkCard, PracticeLinkList } from "./practice-link-card";

vi.mock("next-intl/server", () => ({
  getTranslations: () =>
    Promise.resolve((key: string) => key),
}));

describe("PracticeLinkList", () => {
  it("renders nothing when hrefs is empty", async () => {
    const element = await PracticeLinkList({ hrefs: [] });
    expect(element).toBeUndefined();
  });

  it("renders a single item without grid layout", async () => {
    const { container } = render(
      await PracticeLinkList({ hrefs: ["/practice/jantou-fu"] }),
    );
    const anchors = container.querySelectorAll("a");
    expect(anchors.length).toBe(1);
    expect(anchors[0]!.getAttribute("href")).toBe("/practice/jantou-fu");
    // 1 件のときはグリッドクラスを付けない
    const grid = container.querySelector("[class*='grid-cols-2']");
    expect(grid).toBeNull();
  });

  it("renders multiple items in a responsive grid", async () => {
    const { container } = render(
      await PracticeLinkList({
        hrefs: ["/practice/jantou-fu", "/practice/mentsu-fu"],
      }),
    );
    const anchors = container.querySelectorAll("a");
    expect(anchors.length).toBe(2);
    const grid = container.querySelector("[class*='md:grid-cols-2']");
    expect(grid).not.toBeNull();
  });

  it("renders the practice title resolved from camelCase i18n key", async () => {
    const { container } = render(
      await PracticeLinkList({ hrefs: ["/practice/jantou-fu"] }),
    );
    // モックの t() は key をそのまま返すので、正しく camelCase 変換されていれば
    // practices.jantouFu.title が文字列として出現する。
    expect(container.textContent).toContain("practices.jantouFu.title");
  });

  it("renders the practice title for multi-segment slugs", async () => {
    const { container } = render(
      await PracticeLinkList({ hrefs: ["/practice/han-count"] }),
    );
    expect(container.textContent).toContain("practices.hanCount.title");
  });
});

describe("PracticeLinkCard", () => {
  it("renders a link to the provided href", async () => {
    const { container } = render(
      await PracticeLinkCard({ href: "/practice/machi-fu" }),
    );
    const anchor = container.querySelector("a");
    expect(anchor).not.toBeNull();
    expect(anchor!.getAttribute("href")).toBe("/practice/machi-fu");
  });
});
