import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { getPublication } from "@/i18n/route-policy";
import { PREFERENCES_PATH } from "@mahjong-scoring/features/routes";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("next/link", async () => await import("@/test/next-link-mock"));

import { KiriageManganNote } from "./kiriage-mangan-note";

/**
 * 日本語の文字（CJK 記号と句読点・ひらがな・カタカナ・漢字・全角形）
 *
 * 辞書はキーのまま返すスタブなので、描いた文字に日本語が残っていれば
 * 部品が直書きしている。英語の辞書の値に日本語が無いことは
 * `packages/messages` の `en.test.ts` が見る。
 */
const JAPANESE_CHARACTERS = new RegExp(
  "[\\u3000-\\u303F\\u3040-\\u30FF\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uFF00-\\uFFEF]",
);

describe("KiriageManganNote", () => {
  it("日本語のページでは設定ページへ今までどおりのリンクを張る", () => {
    render(<KiriageManganNote enabled={false} pageLocale="ja" />);

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toMatch(/^\/preferences#/);
    expect(link.getAttribute("hrefLang")).toBeNull();
    expect(screen.queryByText("language.japaneseOnly")).toBeNull();
  });

  it("英語のページでは /en を付けずに日本語の設定ページへ向け、日本語のみと示す", () => {
    render(<KiriageManganNote enabled pageLocale="en" />);

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toMatch(/^\/preferences#/);
    expect(link.getAttribute("hrefLang")).toBe("ja");
    expect(screen.getByText("language.japaneseOnly")).toBeDefined();
  });

  it("英語のページの脚注に日本語の文字（区切りの中黒を含む）を直書きしない", () => {
    const { container } = render(
      <KiriageManganNote enabled={false} pageLocale="en" />,
    );

    expect(container.textContent).not.toMatch(JAPANESE_CHARACTERS);
    expect(container.textContent).toContain("kiriageManganStatusSeparator");
  });

  it("前提: 設定ページは英語で公開していない（公開したら英語のリンクに切り替える）", () => {
    expect(getPublication(PREFERENCES_PATH, "en")).toBe("unpublished");
  });
});
