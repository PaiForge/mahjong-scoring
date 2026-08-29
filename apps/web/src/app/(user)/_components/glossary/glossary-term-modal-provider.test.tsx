/**
 * 用語モーダルの中身のテスト
 *
 * @description
 * - 用語リンクを押すと、その語の意味と用語ページへの導線が出る
 * - 同じモーダルに、用語リンクを切る設定への導線が出る
 *   （設定ページを自分から見に行く読者しか設定に辿り着けない状態を避ける）
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { useDisplaySettingsStore } from "@/app/_hooks/use-display-settings-store";

import { GlossaryTermModalProvider } from "./glossary-term-modal-provider";
import { TermLink } from "./term-link";

const TERMS = {
  pinfu: {
    slug: "pinfu",
    term: "平和",
    reading: "ピンフ",
    definition: "符が付く要素がひとつもない門前限定の1翻役。",
    href: "/reference/glossary/pinfu",
  },
} as const;

function renderChapter() {
  return render(
    <GlossaryTermModalProvider
      terms={TERMS}
      viewDetailsLabel="用語ページを見る"
      turnOffLabel="用語リンクをオフにする"
      closeLabel="閉じる"
    >
      <p>
        <TermLink slug="pinfu" href="/reference/glossary/pinfu">
          平和
        </TermLink>
        で和了る
      </p>
    </GlossaryTermModalProvider>,
  );
}

beforeEach(() => {
  useDisplaySettingsStore.setState({ termLinks: true });
});

afterEach(() => {
  cleanup();
});

describe("GlossaryTermModalProvider", () => {
  it("用語リンクを押すと語の意味を出す", () => {
    renderChapter();
    fireEvent.click(screen.getByRole("link", { name: "平和" }));

    expect(screen.getByText("ピンフ")).toBeDefined();
    expect(
      screen
        .getByRole("link", { name: "用語ページを見る" })
        .getAttribute("href"),
    ).toBe("/reference/glossary/pinfu");
  });

  it("用語リンクを切る設定への導線を出す", () => {
    renderChapter();
    fireEvent.click(screen.getByRole("link", { name: "平和" }));

    expect(
      screen
        .getByRole("link", { name: "用語リンクをオフにする" })
        .getAttribute("href"),
    ).toBe("/preferences#term-links");
  });
});
