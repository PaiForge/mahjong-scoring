import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { PracticeLinkList } from "./practice-link-card";

// next-intl の t() は関数だが、`t.has(key)` のようなメソッドも持つ。
// `practice-link-card` は `t.has()` で辞書キーの存在確認を行うため、
// モックでも関数 + プロパティを再現する必要がある。
vi.mock("next-intl/server", () => ({
  getTranslations: (_namespace?: string) => {
    const t = (key: string) => key;
    // デフォルトでは全てのキーが存在する扱い（辞書整合性は別テストで担保）。
    t.has = (_key: string) => true;
    return Promise.resolve(t);
  },
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

describe("PracticeLinkList: link href rendering", () => {
  it("renders a link with the provided href via the list", async () => {
    const { container } = render(
      await PracticeLinkList({ hrefs: ["/practice/machi-fu"] }),
    );
    const anchor = container.querySelector("a");
    expect(anchor).not.toBeNull();
    expect(anchor!.getAttribute("href")).toBe("/practice/machi-fu");
  });
});

describe("PracticeLinkList: i18n key fallback", () => {
  it("falls back to practiceLinkCta when the practice title key is missing", async () => {
    // 辞書にキーが存在しない想定のシナリオを個別モックで再現
    vi.resetModules();
    vi.doMock("next-intl/server", () => ({
      getTranslations: (_namespace?: string) => {
        const t = (key: string) => key;
        // 全てのキーが存在しない扱い（= 辞書抜けのシミュレーション）
        t.has = (_key: string) => false;
        return Promise.resolve(t);
      },
    }));

    const { PracticeLinkList: PracticeLinkListReloaded } =
      await import("./practice-link-card");

    const { container } = render(
      await PracticeLinkListReloaded({ hrefs: ["/practice/jantou-fu"] }),
    );

    // 辞書ミスヒット時は汎用 CTA ラベルが表示され、
    // キー文字列 `practices.jantouFu.title` は見える形で出現しないこと。
    expect(container.textContent).toContain("practiceLinkCta");
    expect(container.textContent).not.toContain("practices.jantouFu.title");

    vi.doUnmock("next-intl/server");
    vi.resetModules();
  });
});
