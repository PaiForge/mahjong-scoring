import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { ContentContainer } from "./content-container";
import { PageTitle, PageTitlePlaceholder } from "./page-title";

/**
 * 見出しの有無で `ContentContainer` は別のレイアウトになる（タイトル帯 +
 * フルブリードのカード / 余白付きの箱）。読み込み中の見出しは本物と別の
 * コンポーネントなので、これを見落とすと loading.tsx だけが見出し無しの
 * レイアウトに落ちる — カードが `mx-auto` で中身の幅まで縮み、実描画に
 * 替わった瞬間に全幅へ跳ねる。
 */
describe("ContentContainer", () => {
  const card = (container: HTMLElement) =>
    container.querySelector<HTMLElement>(".bg-card");

  it("PageTitle をカードの外へ引き上げる", () => {
    const { container } = render(
      <ContentContainer>
        <PageTitle>ホーム</PageTitle>
        <p>本文</p>
      </ContentContainer>,
    );

    expect(card(container)?.querySelector("h1")).toBeNull();
    expect(container.querySelector("h1")?.textContent).toBe("ホーム");
    expect(card(container)?.className).toContain("border-t-4");
  });

  it("PageTitlePlaceholder も見出しとして扱う", () => {
    const { container } = render(
      <ContentContainer>
        <PageTitlePlaceholder width="w-24" />
        <p>本文</p>
      </ContentContainer>,
    );

    const placeholder = container.querySelector('[aria-hidden="true"]');
    expect(placeholder).not.toBeNull();
    expect(card(container)?.contains(placeholder)).toBe(false);
    expect(card(container)?.className).toContain("border-t-4");
  });

  it("見出しが無ければ余白付きの箱に収める", () => {
    const { container } = render(
      <ContentContainer>
        <p>本文</p>
      </ContentContainer>,
    );

    expect(card(container)?.className).toContain("border-y-4");
  });
});
