import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { PageSkeleton } from "./page-skeleton";
import { PageTitlePlaceholder } from "./page-title";
import { SectionTitleSkeleton } from "./section-title-skeleton";

/**
 * loading.tsx の中身は Suspense のフォールバックとして初期 HTML に焼き込まれる。
 * スケルトンが見出し要素を名乗ると、中身が空の h1 / h2 が本物の見出しより先に
 * 文書へ出て、JS を実行しないクローラーにはそれが最初の見出しとして見える。
 * スケルトンの部品は見出しを描かない。
 */
describe("スケルトンの部品", () => {
  const cases = [
    ["PageTitlePlaceholder", <PageTitlePlaceholder key="t" />],
    ["SectionTitleSkeleton", <SectionTitleSkeleton key="s" />],
    ["PageSkeleton", <PageSkeleton key="p" />],
  ] as const;

  it.each(cases)("%s は見出し要素を描かない", (_name, element) => {
    const { container } = render(element);
    expect(container.querySelectorAll("h1, h2, h3, h4, h5, h6")).toHaveLength(
      0,
    );
  });
});
