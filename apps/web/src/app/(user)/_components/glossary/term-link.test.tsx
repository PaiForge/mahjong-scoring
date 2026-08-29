/**
 * TermLink の用語リンク設定への追従テスト
 *
 * @description
 * - 既定（設定なし）: 用語ページへの `<a href>` を描く
 * - 用語リンクをオフ: 表示語だけを地の文として残し、リンクを描かない
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";

import { useDisplaySettingsStore } from "@/app/_hooks/use-display-settings-store";

import { TermLink } from "./term-link";

beforeEach(() => {
  useDisplaySettingsStore.setState({ termLinks: true });
});

afterEach(() => {
  cleanup();
});

describe("TermLink", () => {
  it("既定では用語ページへのリンクを描く", () => {
    const { container } = render(
      <TermLink slug="pinfu" href="/reference/glossary/pinfu">
        平和
      </TermLink>,
    );

    const anchor = container.querySelector("a");
    expect(anchor?.getAttribute("href")).toBe("/reference/glossary/pinfu");
    expect(anchor?.textContent).toBe("平和");
  });

  it("用語リンクをオフにすると表示語だけが残る", () => {
    useDisplaySettingsStore.setState({ termLinks: false });

    const { container } = render(
      <TermLink slug="pinfu" href="/reference/glossary/pinfu">
        平和
      </TermLink>,
    );

    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toBe("平和");
  });
});
